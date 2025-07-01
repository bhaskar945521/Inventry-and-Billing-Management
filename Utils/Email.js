const nodemailer = require('nodemailer');

// Create transporter for sending emails
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL, // Admin's email
    pass: process.env.ADMIN_EMAIL_PASSWORD // Admin's email password or app password
  }
});

const sendPasswordResetNotification = async (userInfo) => {
  try {
    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: process.env.ADMIN_EMAIL, // Send to admin
      subject: '🔒 Password Reset Request - Inventory System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">🔒 Password Reset Request</h2>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <hr>
          <h3>User Details:</h3>
          <ul>
            <li><strong>Name:</strong> ${userInfo.name}</li>
            <li><strong>Email:</strong> ${userInfo.email}</li>
            <li><strong>Business:</strong> ${userInfo.businessName || 'N/A'}</li>
            <li><strong>Role:</strong> ${userInfo.role}</li>
          </ul>
          <hr>
          <p><strong>Action Required:</strong> Please reset the password for this user and contact them with the new password.</p>
          <p style="color: #666; font-size: 12px;">This is an automated notification from your Inventory Management System.</p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset notification email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Email sending error:', error);
    throw new Error('Failed to send email notification');
  }
};

module.exports = { sendPasswordResetNotification }; 