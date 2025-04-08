// pages/api/cron.js
import { sendTimedClassEngagementEmails } from '../../lib/email';

export default async function handler(req, res) {
  try {
    // Verify this request is authorized
    const { apiKey } = req.query;
    
    // Check if API key is valid (should match your environment variable)
    if (apiKey !== process.env.API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    console.log("Running cron job for timed engagement emails...");
    const result = await sendTimedClassEngagementEmails();
    console.log("Cron job result:", result);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error running cron job:', error);
    res.status(500).json({ error: error.message });
  }
}