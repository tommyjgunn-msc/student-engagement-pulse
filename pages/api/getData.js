// pages/api/getData.js
import { readSheet } from '../../lib/sheets';
import { getAcademicContext } from '../../lib/academicCalendar';

export default async function handler(req, res) {
  try {
    // Get current academic context
    const now = new Date();
    console.log("Fetching academic context...");
    let context = {
      trimester: null,
      week: null,
      unit: null,
      isSummative: false,
      isBreak: false
    };
    
    try {
      context = await getAcademicContext(now);
      console.log("Retrieved academic context:", context);
    } catch (contextError) {
      console.error("Error getting academic context:", contextError);
    }
    
    // Get student data - filter by program if requested
    console.log("Fetching student data...");
    let programStudents = [];
    try {
      const studentData = await readSheet('Students', 'A2:E100');
      console.log(`Retrieved ${studentData ? studentData.length : 0} students`);
      
      // Just log the first few students to understand the structure
      if (studentData && studentData.length > 0) {
        console.log("Sample student data:", studentData.slice(0, 2));
      }
      
      // For now, don't filter - just use all students
      programStudents = studentData || [];
    } catch (studentError) {
      console.error("Error getting student data:", studentError);
    }
    
    // Get ratings data
    console.log("Fetching ratings data...");
    let ratingsData = [];
    try {
      ratingsData = await readSheet('Engagement Ratings', 'A2:G500') || [];
      console.log(`Retrieved ${ratingsData.length} ratings`);
      
      // Log a sample rating
      if (ratingsData.length > 0) {
        console.log("Sample rating:", ratingsData[0]);
      }
    } catch (ratingsError) {
      console.error("Error getting ratings data:", ratingsError);
    }
    
    // Get Canvas data
    console.log("Fetching canvas data...");
    let canvasData = [];
    try {
      canvasData = await readSheet('Canvas Data', 'A2:G500') || [];
      console.log(`Retrieved ${canvasData.length} canvas data entries`);
    } catch (canvasError) {
      console.error("Error getting canvas data:", canvasError);
    }
    
    // Build proper student objects
    console.log("Building student objects...");
    const students = programStudents.map(student => {
      if (!student || student.length < 3) {
        console.log("Invalid student record:", student);
        return null;
      }
      
      const studentId = student[0];
      const studentName = `${student[1] || 'Unknown'} ${student[2] || ''}`;
      
      // Get this student's ratings
      const studentRatings = ratingsData
        .filter(r => r && r.length > 1 && r[1] === studentId)
        .sort((a, b) => new Date(a[4]) - new Date(b[4]));
      
      // Calculate faculty score from ratings
      const recentRatings = studentRatings.slice(-3);
      const facultyScore = recentRatings.length > 0
        ? recentRatings.reduce((sum, r) => sum + parseInt(r[6], 10), 0) / recentRatings.length
        : 5;
      
      // Get canvas data for the student
      const studentCanvas = canvasData
        .filter(c => c && c.length > 0 && c[0] === studentId)
        .sort((a, b) => new Date(a[1]) - new Date(b[1]));
      
      // Default metrics
      let objectiveScore = 5;
      let attendance = 5;
      let assignments = 5;
      let engagement = 5;
      let grades = 5;
      
      // If we have canvas data, use it
      if (studentCanvas.length > 0) {
        const recent = studentCanvas[studentCanvas.length - 1];
        
        if (recent.length >= 7) {
          attendance = parseInt(recent[2], 10) / 10;
          assignments = parseInt(recent[3], 10) / 10;
          engagement = (parseInt(recent[4], 10) / 1.4 + parseInt(recent[5], 10) / 0.8) / 10;
          grades = parseInt(recent[6], 10) / 10;
          objectiveScore = (attendance + assignments + engagement + grades) / 4;
        }
      }
      
      // Combined score
      const currentScore = (facultyScore * 0.6) + (objectiveScore * 0.4);
      
      // Calculate trend
      const previousRatings = studentRatings.slice(-6, -3);
      const previousScore = previousRatings.length > 0
        ? previousRatings.reduce((sum, r) => sum + parseInt(r[6], 10), 0) / previousRatings.length
        : facultyScore;
      
      const trend = facultyScore - previousScore;
      
      // Prepare trend data for charts
      const trendData = {
        dates: studentRatings.slice(-10).map(r => r[4]),
        scores: studentRatings.slice(-10).map(r => parseInt(r[6], 10))
      };
      
      return {
        id: studentId,
        name: studentName,
        currentScore: Math.round(currentScore * 10) / 10,
        facultyScore: Math.round(facultyScore * 10) / 10,
        objectiveScore: Math.round(objectiveScore * 10) / 10,
        trend: Math.round(trend * 10) / 10,
        trendData,
        canvasMetrics: {
          attendance: Math.min(10, Math.round(attendance)),
          assignments: Math.min(10, Math.round(assignments)),
          engagement: Math.min(10, Math.round(engagement)),
          grades: Math.min(10, Math.round(grades))
        }
      };
    }).filter(student => student !== null);
    
    console.log(`Built ${students.length} valid student objects`);
    
    // Get courses - filter by program
    console.log("Fetching course data...");
    let courses = [];
    try {
      const courseData = await readSheet('Courses', 'A2:I100');
      console.log(`Retrieved ${courseData ? courseData.length : 0} courses`);
      
      // For now, just convert all courses to the expected format
      courses = courseData ? courseData.map(course => ({
        id: course[0] || '',
        name: course[1] || 'Unknown Course'
      })) : [];
    } catch (courseError) {
      console.error("Error getting course data:", courseError);
    }
    
    // Return the data with academic context
    res.status(200).json({ 
      students, 
      courses, 
      academicContext: context 
    });
    
  } catch (error) {
    console.error('Error in getData API:', error);
    res.status(500).json({ 
      error: error.message,
      students: [],
      courses: [],
      academicContext: {
        trimester: null,
        week: null,
        unit: null,
        isSummative: false,
        isBreak: false
      }
    });
  }
}