// pages/api/testEmail.js
import { generateToken } from '../../lib/email';
const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  try {
    // Use your email configuration
    const transporter = nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
    
    // Send a test email to yourself
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: process.env.FROM_EMAIL, // Your email
      subject: 'Test Email for Student Engagement Pulse',
      html: '<h1>Test Email</h1><p>This is a test email to verify SendGrid configuration.</p>'
    });
    
    res.status(200).json({ success: true, message: 'Test email sent' });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: error.message });
  }
}