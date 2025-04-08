import jwt from 'jsonwebtoken';
import { appendToSheet } from '../../lib/sheets';

export default async function handler(req, res) {
  try {
    // Verify token
    const { token } = req.query;
    if (!token) {
      return res.status(400).send('Missing token');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { studentId, courseId, facultyId, score } = decoded;
    
    // Log rating to Google Sheets
    const timestamp = new Date().toISOString();
    await appendToSheet('Engagement Ratings', [
      [
        `R${Date.now()}`, // Rating ID
        studentId,
        courseId,
        facultyId,
        timestamp.split('T')[0], // Date
        timestamp.split('T')[1].split('.')[0], // Time
        score,
        '' // Notes (empty for now)
      ]
    ]);
    
    // Return a nice confirmation page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Rating Submitted</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
          .success { color: #28a745; font-size: 48px; margin-bottom: 20px; }
          .message { font-size: 24px; margin-bottom: 30px; }
        </style>
      </head>
      <body>
        <div class="success">✓</div>
        <div class="message">Engagement score of ${score} recorded successfully!</div>
        <p>You can close this window now.</p>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error processing rating:', error);
    res.status(500).send(`Error: ${error.message}`);
  }
}