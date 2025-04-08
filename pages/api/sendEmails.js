import { sendClassEngagementEmails } from '../../lib/email';

export default async function handler(req, res) {
  try {
    // Basic API key validation (improve in production)
    const { apiKey } = req.query;
    if (apiKey !== process.env.API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const result = await sendClassEngagementEmails();
    res.status(200).json(result);
  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).json({ error: error.message });
  }
}