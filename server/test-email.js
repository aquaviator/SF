import nodemailer from 'nodemailer';

console.log('Email credentials check:');
console.log('GOOGLE_DELEGATED_EMAIL:', process.env.GOOGLE_DELEGATED_EMAIL ? 'Set' : 'Not set');
console.log('GOOGLE_APP_PASSWORD:', process.env.GOOGLE_APP_PASSWORD ? 'Set' : 'Not set');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GOOGLE_DELEGATED_EMAIL,
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});

async function testEmail() {
  try {
    console.log('Testing email connection...');
    await transporter.verify();
    console.log('✅ Email connection verified successfully');
    
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.GOOGLE_DELEGATED_EMAIL,
      to: 'test@example.com', // Replace with a real email for testing
      subject: 'ShiftFlo Email Test',
      text: 'This is a test email from ShiftFlo registration system.',
    });
    
    console.log('✅ Test email sent:', info.messageId);
  } catch (error) {
    console.error('❌ Email error:', error);
  }
}

testEmail();