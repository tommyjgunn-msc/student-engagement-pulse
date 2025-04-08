// scripts/test-email-send.js
require('dotenv').config();
const { sendTimedClassEngagementEmails } = require('../lib/email');

async function testEmailSending() {
  console.log("Testing timed email sending...");
  
  try {
    const result = await sendTimedClassEngagementEmails();
    console.log("Result:", result);
  } catch (error) {
    console.error("Error testing email sending:", error);
  }
}

testEmailSending().catch(console.error);