// backend/Utils/SMS.js
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

const sendSMS = async (phoneNumber, message) => {
  try {
    const result = await client.messages.create({
      body: message,
      from: twilioPhone,
      to: phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}` // Default to India country code
    });
    console.log('✅ SMS sent:', result.sid);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('❌ SMS sending error:', error);
    throw new Error('Failed to send SMS');
  }
};

module.exports = { sendSMS }; 