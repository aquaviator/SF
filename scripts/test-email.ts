import nodemailer from 'nodemailer';

async function testEmailConnection() {
  console.log('🔧 EMAIL_TEST_START', { timestamp: new Date().toISOString() });
  
  try {
    // Check environment variables
    console.log('🔑 Email configuration:');
    console.log('- GOOGLE_DELEGATED_EMAIL:', process.env.GOOGLE_DELEGATED_EMAIL ? 'Set (length: ' + process.env.GOOGLE_DELEGATED_EMAIL.length + ')' : 'Missing');
    console.log('- GOOGLE_APP_PASSWORD:', process.env.GOOGLE_APP_PASSWORD ? 'Set (length: ' + process.env.GOOGLE_APP_PASSWORD.length + ')' : 'Missing');
    
    if (!process.env.GOOGLE_DELEGATED_EMAIL || !process.env.GOOGLE_APP_PASSWORD) {
      throw new Error('Missing required environment variables');
    }

    // Create transporter with detailed config
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GOOGLE_DELEGATED_EMAIL,
        pass: process.env.GOOGLE_APP_PASSWORD,
      },
      debug: true, // Enable debug output
      logger: true // Enable logger
    });
    
    // Test basic connection
    console.log('📧 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful');
    
    // Test sending a simple email
    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.GOOGLE_DELEGATED_EMAIL,
      to: process.env.GOOGLE_DELEGATED_EMAIL, // Send to same email for testing
      subject: 'Test Email from ShiftFlo',
      text: 'This is a test email to verify the email configuration is working.',
      html: '<p>This is a test email to verify the email configuration is working.</p>'
    });
    
    console.log('✅ Test email sent successfully');
    console.log('📧 Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ EMAIL_TEST_FAILED', {
      error: error.message,
      code: error.code,
      command: error.command,
      timestamp: new Date().toISOString()
    });
    
    if (error.message.includes('Username and Password not accepted')) {
      console.log('\n🔧 TROUBLESHOOTING STEPS:');
      console.log('1. Verify the email address is correct');
      console.log('2. Ensure 2-factor authentication is enabled on the Google account');
      console.log('3. Generate a NEW app password from Google Account settings');
      console.log('4. Use the 16-character app password (remove spaces)');
      console.log('5. Make sure "Less secure app access" is not needed (app passwords bypass this)');
    }
  }
}

testEmailConnection();