import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GOOGLE_DELEGATED_EMAIL,
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});

export const sendActivationEmail = async (email: string, firstName: string, activationToken: string) => {
  // Use local development URL for activation
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://app.shiftflo.com' 
    : 'http://localhost:5000';
  const activationUrl = `${baseUrl}/activate?token=${activationToken}`;
  
  const mailOptions = {
    from: process.env.GOOGLE_DELEGATED_EMAIL,
    to: email,
    subject: 'Activate your Shiftflo account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Shiftflo, ${firstName}!</h2>
        <p>You've been invited to join your team's Shiftflo workspace. To get started, please activate your account by clicking the link below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationUrl}" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Activate Your Account
          </a>
        </div>
        
        <p>This link will expire in 7 days. If you didn't expect this email, you can safely ignore it.</p>
        
        <p>Best regards,<br>The Shiftflo Team</p>
        
        <hr style="margin-top: 40px; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          If you're having trouble clicking the button, copy and paste this URL into your browser:<br>
          <a href="${activationUrl}">${activationUrl}</a>
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};