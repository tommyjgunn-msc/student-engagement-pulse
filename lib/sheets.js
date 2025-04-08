const { google } = require('googleapis');
const sheets = google.sheets('v4');

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

// Read from specific sheet
async function readSheet(sheetName, range) {
  try {
    const client = await auth.getClient();
    const sheetsApi = google.sheets({ version: 'v4', auth: client });
    
    const response = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${sheetName}!${range}`
    });
    
    return response.data.values || [];
  } catch (error) {
    console.error('Error reading from Google Sheets:', error);
    throw error;
  }
}

// Write to specific sheet
async function writeToSheet(sheetName, range, values) {
  try {
    const client = await auth.getClient();
    const sheetsApi = google.sheets({ version: 'v4', auth: client });
    
    const response = await sheetsApi.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${sheetName}!${range}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error writing to Google Sheets:', error);
    throw error;
  }
}

// Append to sheet
async function appendToSheet(sheetName, values) {
  try {
    const client = await auth.getClient();
    const sheetsApi = google.sheets({ version: 'v4', auth: client });
    
    const response = await sheetsApi.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
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

module.exports = { readSheet, writeToSheet, appendToSheet };