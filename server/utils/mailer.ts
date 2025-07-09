import nodemailer from 'nodemailer';
import { getDomainFromDatabase } from '../setup/domainSetup';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GOOGLE_DELEGATED_EMAIL,
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});

export async function sendActivationEmail(email: string, activationToken: string, domain?: string) {
  // Use the same domain detection system as operational emails
  const activeDomain = await getDomainFromDatabase();
  const isLocalhost = activeDomain.includes('localhost');
  const protocol = isLocalhost ? 'http' : 'https';
  const activationLink = `${protocol}://${activeDomain}/activate?token=${activationToken}`;
  
  console.log('📧 ACTIVATION_EMAIL_DEBUG', {
    email,
    activeDomain,
    isLocalhost,
    protocol,
    activationLink,
    timestamp: new Date()
  });
  
  const mailOptions = {
    from: process.env.GOOGLE_DELEGATED_EMAIL,
    to: email,
    subject: 'Activate Your ShiftFlo Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb; text-align: center;">Welcome to ShiftFlo</h1>
        <p>Thank you for registering! Please click the button below to activate your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Activate Account</a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${activationLink}</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendEmailChangeConfirmation(email: string, token: string, domain?: string) {
  // Use the same domain detection system as operational emails
  const activeDomain = await getDomainFromDatabase();
  const isLocalhost = activeDomain.includes('localhost');
  const protocol = isLocalhost ? 'http' : 'https';
  const confirmLink = `${protocol}://${activeDomain}/confirm-email?token=${token}`;
  
  console.log('📧 EMAIL_CHANGE_CONFIRMATION_DEBUG', {
    email,
    activeDomain,
    isLocalhost,
    protocol,
    confirmLink,
    timestamp: new Date()
  });
  
  const mailOptions = {
    from: process.env.GOOGLE_DELEGATED_EMAIL,
    to: email,
    subject: 'Confirm Your New Email Address - ShiftFlo',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb; text-align: center;">Confirm Email Change</h1>
        <p>You requested to change your email address in ShiftFlo. Click the button below to confirm this change:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Confirm Email Change</a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${confirmLink}</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour. If you didn't request this change, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendPasswordResetEmail(email: string, token: string, domain?: string) {
  // Use the same domain detection system as operational emails
  const activeDomain = await getDomainFromDatabase();
  const isLocalhost = activeDomain.includes('localhost');
  const protocol = isLocalhost ? 'http' : 'https';
  const resetLink = `${protocol}://${activeDomain}/reset-password?token=${token}`;
  
  console.log('📧 PASSWORD_RESET_EMAIL_DEBUG', {
    email,
    activeDomain,
    isLocalhost,
    protocol,
    resetLink,
    timestamp: new Date()
  });
  
  const mailOptions = {
    from: process.env.GOOGLE_DELEGATED_EMAIL,
    to: email,
    subject: 'Reset Your Password - ShiftFlo',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb; text-align: center;">Reset Your Password</h1>
        <p>You requested to reset your password for ShiftFlo. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetLink}</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour. If you didn't request this reset, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendUpgradeConfirmationEmail(user: any, upgradeDetails: any) {
  const { seatsAdded, newSeatCount, newMonthlyTotal, invoice, paymentDetails } = upgradeDetails;
  
  // Use the same domain detection system as operational emails
  const activeDomain = await getDomainFromDatabase();
  const isLocalhost = activeDomain.includes('localhost');
  const protocol = isLocalhost ? 'http' : 'https';
  const dashboardLink = `${protocol}://${activeDomain}/dashboard`;
  
  console.log('📧 UPGRADE_CONFIRMATION_EMAIL_DEBUG', {
    email: user.email,
    activeDomain,
    isLocalhost,
    protocol,
    dashboardLink,
    timestamp: new Date()
  });
  
  const mailOptions = {
    from: process.env.GOOGLE_DELEGATED_EMAIL,
    to: user.email,
    subject: 'Subscription Upgraded - ShiftFlo',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb; text-align: center;">Subscription Upgraded Successfully</h1>
        <p>Hello ${user.firstName || 'there'},</p>
        
        <p>Your ShiftFlo subscription has been successfully upgraded!</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e293b;">Upgrade Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Seats Added:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${seatsAdded}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>New Seat Count:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${newSeatCount}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>New Monthly Total:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;"><strong>£${newMonthlyTotal.toFixed(2)}</strong></td>
            </tr>
          </table>
        </div>

        ${invoice ? `
        <div style="background-color: #fefce8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #eab308;">
          <h3 style="margin-top: 0; color: #a16207;">Invoice Details</h3>
          <p><strong>Invoice ID:</strong> ${invoice.stripeInvoiceId}</p>
          <p><strong>Amount Paid:</strong> £${((invoice.amount || 0) / 100).toFixed(2)}</p>
          <p><strong>Description:</strong> ${invoice.description}</p>
          <p><strong>Payment Date:</strong> ${new Date(invoice.paidAt).toLocaleDateString()}</p>
        </div>
        ` : ''}

        <p>Your new billing cycle will reflect the updated seat count starting from your next billing date.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Dashboard</a>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #64748b;">Thank you for choosing ShiftFlo!</p>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          If you have any questions about your upgrade, please contact our support team.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}