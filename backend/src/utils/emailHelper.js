import nodemailer from 'nodemailer';

// Create transporter for sending emails
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send OTP email
export const sendOTPEmail = async (toEmail, otp, userName = '') => {
  try {
    const transporter = createTransporter();

    const subject = 'Your Password Reset OTP - Bookstore';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3498db; color: white; padding: 20px; border-radius: 5px; text-align: center; }
            .content { padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin-top: 20px; }
            .otp-box { background-color: #ecf0f1; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #3498db; font-family: 'Courier New', monospace; }
            .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 20px; }
            .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            
            <div class="content">
              <p>Hello ${userName ? userName : 'User'},</p>
              
              <p>You requested to reset your password for your Bookstore account. Use the OTP code below to proceed:</p>
              
              <div class="otp-box">
                <p style="margin: 0; color: #7f8c8d; font-size: 14px; margin-bottom: 10px;">Your One-Time Password (OTP)</p>
                <div class="otp-code">${otp}</div>
              </div>
              
              <p><strong>This OTP will expire in 10 minutes.</strong></p>
              
              <div class="warning">
                <strong>⚠️ Security Warning:</strong> Never share this OTP with anyone. Our team will never ask for your OTP via email or phone.
              </div>
              
              <p>If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
              
              <p>Best regards,<br><strong>Bookstore Team</strong></p>
            </div>
            
            <div class="footer">
              <p>© 2026 Bookstore. All rights reserved.</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await transporter.sendMail({
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_EMAIL}>`,
      to: toEmail,
      subject: subject,
      html: htmlContent
    });

    console.log(`OTP email sent successfully to ${toEmail}`);
    return result;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};

// Send password reset confirmation email
export const sendPasswordResetConfirmationEmail = async (toEmail, userName = '') => {
  try {
    const transporter = createTransporter();

    const subject = 'Password Reset Successful - Bookstore';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #27ae60; color: white; padding: 20px; border-radius: 5px; text-align: center; }
            .content { padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 20px; }
            .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Successful</h1>
            </div>
            
            <div class="content">
              <div class="success-icon">✓</div>
              <p>Hello ${userName ? userName : 'User'},</p>
              
              <p>Your password has been successfully reset. You can now log in to your Bookstore account with your new password.</p>
              
              <p>If you did not make this change or believe your account has been compromised, please contact our support team immediately.</p>
              
              <p>Best regards,<br><strong>Bookstore Team</strong></p>
            </div>
            
            <div class="footer">
              <p>© 2026 Bookstore. All rights reserved.</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await transporter.sendMail({
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_EMAIL}>`,
      to: toEmail,
      subject: subject,
      html: htmlContent
    });

    console.log(`Confirmation email sent successfully to ${toEmail}`);
    return result;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
};
