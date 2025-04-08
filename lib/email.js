// lib/email.js
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { readSheet } = require('./sheets');
const { isTeachingDay, getAcademicContext } = require('./academicCalendar');
const { matchesDay, classJustEnded } = require('./schedule');

// Configure nodemailer with SendGrid
const transporter = nodemailer.createTransport({
  service: 'SendGrid',
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});

// Generate secure token for email links
function generateToken(data) {
  return jwt.sign(data, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// Get appropriate color for engagement score
function getColorForScore(score) {
  if (score <= 2) return '#dc3545'; // Red
  if (score <= 6) return '#ffc107'; // Yellow
  return '#28a745'; // Green
}

// Create rating links for each score
function generateRatingLinks(studentId, courseId, facultyId) {
  const ratings = [0, 2, 4, 6, 8, 10];
  return ratings.map(score => {
    const token = generateToken({ studentId, courseId, facultyId, score });
    return `<a href="${process.env.BASE_URL}/api/rate?token=${token}" 
      style="display:inline-block; padding:8px; margin:5px; background-color:${getColorForScore(score)}; 
      color:white; text-decoration:none; border-radius:4px;">${score}</a>`;
  }).join(' ');
}

// Original function - leave this for backward compatibility
async function sendClassEngagementEmails() {
  try {
    // Get today's courses
    const today = new Date();
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
    const courses = await readSheet('Courses', 'A2:I100');
    
    // Check if we got courses
    if (!courses || courses.length === 0) {
      console.log('No courses found');
      return { success: false, message: 'No courses found' };
    }
    
    // Filter to courses for today
    const todayCourses = courses.filter(course => {
      const schedule = course[5]; // Schedule column
      return schedule && schedule.includes(dayOfWeek);
    });
    
    console.log(`Found ${todayCourses.length} courses scheduled for ${dayOfWeek}`);
    
    // For each course, get enrolled students and send email to faculty
    for (const course of todayCourses) {
      await sendEmailForCourse(course, today);
    }
    
    return { success: true, message: 'Engagement emails sent successfully' };
  } catch (error) {
    console.error('Error sending engagement emails:', error);
    return { success: false, error: error.message };
  }
}

// New function for timed emails
async function sendTimedClassEngagementEmails() {
  try {
    // Get current date and time
    const now = new Date();
    
    // Check if today is a teaching day
    const teachingDay = await isTeachingDay(now);
    if (!teachingDay) {
      console.log('Not sending emails: Not a teaching day');
      return { success: true, message: 'Not a teaching day' };
    }
    
    // Get academic context
    const context = await getAcademicContext(now);
    if (context.isBreak || context.isSummative) {
      console.log('Not sending emails: Break or summative week');
      return { success: true, message: 'Break or summative week' };
    }
    
    // Get all courses
    const courses = await readSheet('Courses', 'A2:I100');
    
    // Filter courses that just ended
    const justEndedCourses = courses.filter(course => {
      const schedule = course[5]; // Schedule column
      return matchesDay(schedule, now.getDay()) && classJustEnded(schedule, now);
    });
    
    console.log(`Found ${justEndedCourses.length} courses that just ended`);
    
    // Send emails for each course that just ended
    for (const course of justEndedCourses) {
      await sendEmailForCourse(course, now, context);
    }
    
    return { 
      success: true, 
      message: `Engagement emails sent successfully for ${justEndedCourses.length} courses`
    };
    
  } catch (error) {
    console.error('Error sending timed engagement emails:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to send email for a specific course
async function sendEmailForCourse(course, date, context = null) {
  const courseId = course[0];
  const courseName = course[1];
  const facultyId = course[2];
  const facultyName = course[3];
  const facultyEmail = course[4];
  const program = course[7] || 'LC'; // Program column with default
  const module = course[8] || '';     // Module column
  
  // Get enrolled students for this course
  const enrollments = await readSheet('Enrollments', 'A2:E100');
  const courseEnrollments = enrollments.filter(enrollment => enrollment[2] === courseId);
  
  // Get student details
  const students = await readSheet('Students', 'A2:H100');
  const programStudents = students.filter(student => {
    // Filter students by program (column 4)
    return student[4] === program;
  });
  
  const courseStudents = programStudents.filter(student => 
    courseEnrollments.some(enrollment => enrollment[1] === student[0])
  );
  
  // Generate email content
  let studentListHtml = '';
  for (const student of courseStudents) {
    const studentId = student[0];
    const studentName = `${student[1]} ${student[2]}`;
    studentListHtml += `
      <div style="margin:15px 0; padding:10px; border:1px solid #eee; border-radius:4px;">
        <h3 style="margin:0 0 10px 0;">${studentName}</h3>
        <p>How engaged was this student in today's class?</p>
        <div>${generateRatingLinks(studentId, courseId, facultyId)}</div>
      </div>
    `;
  }
  
  // Add academic context to email if available
  let contextInfo = '';
  if (context) {
    contextInfo = `Trimester ${context.trimester}, Week ${context.week}, Unit ${context.unit}`;
  }
  
  // Send email to faculty
  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: facultyEmail,
    subject: `Student Engagement: ${courseName}${contextInfo ? ` - ${contextInfo}` : ''}`,
    html: `
      <h1>Student Engagement Tracker</h1>
      <h2>${courseName}${module ? ` (${module})` : ''}</h2>
      ${contextInfo ? `<h3>${contextInfo}</h3>` : ''}
      <p>Please rate each student's engagement in today's class by clicking on the appropriate score:</p>
      <p><strong>0</strong> = Fully disengaged (not present or completely disconnected)</p>
      <p><strong>2-4</strong> = Minimal engagement (present but not participating)</p>
      <p><strong>6</strong> = Functional engagement (participating but showing signs of potential issues)</p>
      <p><strong>8-10</strong> = Active engagement (fully participating and engaged)</p>
      ${studentListHtml}
      <p>Thank you for helping identify at-risk students early!</p>
    `
  });
  
  console.log(`Sent engagement email for ${courseName} to ${facultyEmail}`);
  return true;
}

module.exports = { 
  sendClassEngagementEmails, 
  sendTimedClassEngagementEmails, 
  generateToken 
};