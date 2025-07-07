import nodemailer from 'nodemailer';

interface EmailChangeRequest {
  to: string;
  currentEmail: string;
  token: string;
  type: 'business' | 'user';
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GOOGLE_DELEGATED_EMAIL,
        pass: process.env.GOOGLE_APP_PASSWORD,
      },
    });
  }

  async sendEmailChangeVerification({ to, currentEmail, token, type }: EmailChangeRequest): Promise<boolean> {
    try {
      const subject = 'Verify Your Email Change Request - ShiftFlo';
      
      const htmlContent = `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Email Change Request</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0;">Secure verification required</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: #f3f4f6; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 32px;">
                🔐
              </div>
              <h2 style="color: #374151; margin: 0 0 10px 0;">Email Change Verification</h2>
              <p style="color: #6b7280; margin: 0;">Someone requested to change the ${type} email address</p>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin-bottom: 30px;">
              <p style="margin: 0 0 10px 0; font-weight: 600;">Change Details:</p>
              <p style="margin: 0 0 5px 0;"><strong>From:</strong> ${currentEmail}</p>
              <p style="margin: 0;"><strong>To:</strong> ${to}</p>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: #1f2937; color: white; font-size: 28px; font-weight: bold; letter-spacing: 4px; padding: 20px; border-radius: 6px; display: inline-block; margin-bottom: 15px;">
                ${token}
              </div>
              <p style="color: #6b7280; margin: 0; font-size: 14px;">This code expires in 15 minutes</p>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
              <p style="margin: 0; color: #92400e;">
                <strong>Security Notice:</strong> If you didn't request this email change, please ignore this email or contact support if you're concerned about account security.
              </p>
            </div>
            
            <div style="text-align: center; color: #6b7280; font-size: 14px;">
              <p>This verification email was sent from ShiftFlo</p>
              <p>Do not reply to this email</p>
            </div>
          </div>
        </div>
      `;

      const mailOptions = {
        from: `"ShiftFlo Support" <${process.env.GOOGLE_DELEGATED_EMAIL}>`,
        to: to,
        subject: subject,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✅ EMAIL_CHANGE_VERIFICATION_SENT', { to, type, token });
      return true;
    } catch (error) {
      console.error('❌ EMAIL_CHANGE_VERIFICATION_FAILED', { to, type, error });
      return false;
    }
  }
}

export const emailService = new EmailService();