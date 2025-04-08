// Create this file as scripts/generate-canvas-data.js
require('dotenv').config();

const { google } = require('googleapis');
const sheets = google.sheets('v4');
const fs = require('fs');

// Create auth client using environment variables instead of file
const auth = new google.auth.GoogleAuth({
    credentials: {
      type: "service_account",
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  
// Append to sheet function specific for this script
async function appendToSheet(sheetName, values) {
  try {
    const client = await auth.getClient();
    const sheetsApi = google.sheets({ version: 'v4', auth: client });
    
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    console.log("Using spreadsheet ID:", spreadsheetId);
    
    const response = await sheetsApi.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error appending to Google Sheets:', error);
    throw error;
  }
}

async function generateCanvasData() {
  try {
    // Get existing ratings data to align Canvas data with engagement patterns
    const client = await auth.getClient();
    const sheetsApi = google.sheets({ version: 'v4', auth: client });
    
    const response = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Engagement Ratings!A2:G500'
    });
    
    const ratingsData = response.data.values || [];
    
    // Group ratings by student ID to get average engagement per student
    const studentEngagement = {};
    ratingsData.forEach(row => {
      const studentId = row[1];
      const score = parseInt(row[6], 10);
      
      if (!studentEngagement[studentId]) {
        studentEngagement[studentId] = {
          scores: [],
          average: 0
        };
      }
      
      studentEngagement[studentId].scores.push(score);
    });
    
    // Calculate average engagement score for each student
    Object.keys(studentEngagement).forEach(studentId => {
      const scores = studentEngagement[studentId].scores;
      studentEngagement[studentId].average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });
    
    // Get all Leadership Core student IDs
    const studentsResponse = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Students!A2:E100'
    });
    
    const studentsData = studentsResponse.data.values || [];
    const leadershipCoreStudentIds = studentsData
      .filter(row => row[4] === 'Leadership Core')
      .map(row => row[0]);
    
    // Generate Canvas data for the past 3 weeks
    const canvasData = [];
    const now = new Date();
    
    // Generate three data points per student (one for each week)
    for (let weekOffset = 3; weekOffset > 0; weekOffset--) {
      const date = new Date(now);
      date.setDate(date.getDate() - (weekOffset * 7));
      const timestamp = date.toISOString().split('T')[0];
      
      for (const studentId of leadershipCoreStudentIds) {
        // Base metrics on the student's engagement score if available, otherwise random
        const baseEngagement = studentEngagement[studentId] 
          ? studentEngagement[studentId].average / 10 // Convert 0-10 scale to 0-1
          : Math.random() * 0.7 + 0.3; // Random between 0.3 and 1.0
        
        // Add some random variation around the base score
        const variation = 0.15; // +/- 15% variation
        
        // Generate metrics with some correlation to engagement score
        // For declining students, show worsening metrics over time
        const isDecliningSeries = ['2057443225', '1139703003', '1417154539'].includes(studentId);
        const timeEffect = isDecliningSeries ? (1 + (weekOffset * 0.1)) : (1 - (weekOffset * 0.05));
        
        // Apply variation and time effect to create realistic data
        const adjusted = baseEngagement * timeEffect;
        const randomFactor = () => 1 + ((Math.random() * variation * 2) - variation);
        
        const attendancePercentage = Math.min(100, Math.round(adjusted * 100 * randomFactor()));
        const assignmentCompletion = Math.min(100, Math.round(adjusted * 100 * randomFactor()));
        const canvasLoginFrequency = Math.round((adjusted * 14) * randomFactor()); // 0-14 logins per week
        const discussionParticipation = Math.round((adjusted * 8) * randomFactor()); // 0-8 posts/replies
        const averageGrade = Math.min(100, Math.round(adjusted * 100 * randomFactor()));
        
        canvasData.push([
          studentId,
          timestamp,
          attendancePercentage,
          assignmentCompletion,
          canvasLoginFrequency,
          discussionParticipation,
          averageGrade
        ]);
      }
    }
    
    // Add the Canvas data to the sheet
    await appendToSheet('Canvas Data', canvasData);
    console.log(`Successfully added ${canvasData.length} Canvas data entries!`);
    
  } catch (error) {
    console.error('Error generating Canvas data:', error);
  }
}

generateCanvasData();