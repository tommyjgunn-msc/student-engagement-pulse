// pages/api/cron.js
import { sendTimedClassEngagementEmails } from '../../lib/email';

export default async function handler(req, res) {
  try {
    // Verify this is a cron job request
    const { authorization } = req.headers;
    
    // Use a different authorization token for local testing if needed
    if (process.env.NODE_ENV === 'development') {
      // Allow specific test query parameter for development
      if (req.query.test !== process.env.CRON_TEST_KEY) {
        // For local testing, we can bypass auth if it's a specific testing scenario
        if (!req.query.bypassAuth) {
          return res.status(401).json({ error: 'Unauthorized for testing' });
        }
      }
    } else if (authorization !== `Bearer ${process.env.CRON_SECRET}`) {
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