import nodemailer from 'nodemailer';

if (!process.env.GOOGLE_DELEGATED_EMAIL || !process.env.GOOGLE_APP_PASSWORD) {
  throw new Error('Missing required email environment variables: GOOGLE_DELEGATED_EMAIL and GOOGLE_APP_PASSWORD');
}

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GOOGLE_DELEGATED_EMAIL,
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});

export const sendActivationEmail = async (email: string, firstName: string, activationToken: string, tenantId: string) => {
  const activationUrl = `https://${tenantId}.localhost:5000/activate?token=${activationToken}`;
  
  const mailOptions = {
    from: process.env.GOOGLE_DELEGATED_EMAIL,
    to: email,
    subject: 'Activate your ShiftFlo account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to ShiftFlo, ${firstName}!</h2>
        <p>Your business account has been created successfully. To get started, please activate your account by clicking the link below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Activate Account
          </a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${activationUrl}</p>
        <p>This activation link will expire in 24 hours.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 14px;">
          If you didn't create this account, please ignore this email.
        </p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};