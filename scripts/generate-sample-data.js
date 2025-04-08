// Create scripts directory and add this file
// scripts/generate-sample-data.js
require('dotenv').config(); // Add this line to load .env file

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
    console.log("Using spreadsheet ID:", spreadsheetId); // Add this to debug
    
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

async function generateSampleRatings() {
  try {
    const studentIds = [
      '2000280813', '1183142342', '3091480511', '1587104507', '2103477037',
      '2057443225', '1139703003', '2280106109', '1417154539', '1495926113'
    ];
    
    const courseIds = ['CID', 'PRD', 'DDD', 'ELD'];
    const facultyIds = ['jipinmoye@alueducation.com', 'ypoorun@alueducation.com', 'snaicken@alueducation.com', 'fsarah@alueducation.com'];
    
    // Generate ratings for the past 3 weeks (3 separate classes)
    const ratings = [];
    const now = new Date();
    
    // 3 weeks ago - lower scores
    let date = new Date(now);
    date.setDate(date.getDate() - 21);
    
    for (const studentId of studentIds) {
      for (const courseId of courseIds) {
        const facultyId = facultyIds[courseIds.indexOf(courseId)];
        const score = Math.floor(Math.random() * 4) + 3; // Scores between 3-6 (lower)
        
        ratings.push([
          `R${Date.now()}-${studentId}-${courseId}`,
          studentId,
          courseId,
          facultyId,
          date.toISOString().split('T')[0],
          '10:30:00',
          score,
          ''
        ]);
      }
    }
    
    // 2 weeks ago - mixed scores
    date = new Date(now);
    date.setDate(date.getDate() - 14);
    
    for (const studentId of studentIds) {
      for (const courseId of courseIds) {
        const facultyId = facultyIds[courseIds.indexOf(courseId)];
        const score = Math.floor(Math.random() * 5) + 3; // Scores between 3-7
        
        ratings.push([
          `R${Date.now()}-${studentId}-${courseId}-2`,
          studentId,
          courseId,
          facultyId,
          date.toISOString().split('T')[0],
          '10:30:00',
          score,
          ''
        ]);
      }
    }
    
    // 1 week ago - improved scores for most students, but some declining
    date = new Date(now);
    date.setDate(date.getDate() - 7);
    
    for (const studentId of studentIds) {
      for (const courseId of courseIds) {
        const facultyId = facultyIds[courseIds.indexOf(courseId)];
        
        // Make a few students declining, most improving
        let score;
        if (['2057443225', '1139703003', '1417154539'].includes(studentId)) {
          score = Math.floor(Math.random() * 3) + 2; // Declining: 2-4
        } else {
          score = Math.floor(Math.random() * 3) + 6; // Improving: 6-8
        }
        
        ratings.push([
          `R${Date.now()}-${studentId}-${courseId}-3`,
          studentId,
          courseId,
          facultyId,
          date.toISOString().split('T')[0],
          '10:30:00',
          score,
          ''
        ]);
      }
    }
    
    console.log(`Generated ${ratings.length} sample ratings. Starting upload...`);
    
    // Add the ratings to the sheet in batches to avoid API limits
    const batchSize = 20;
    for (let i = 0; i < ratings.length; i += batchSize) {
      const batch = ratings.slice(i, i + batchSize);
      await appendToSheet('Engagement Ratings', batch);
      console.log(`Added batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(ratings.length/batchSize)}`);
      // Add a small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`Successfully added ${ratings.length} sample ratings!`);
  } catch (error) {
    console.error('Error generating sample data:', error);
  }
}

generateSampleRatings();