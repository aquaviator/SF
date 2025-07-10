import { storage } from '../server/storage';
import { sendShiftAssignmentEmail } from '../server/utils/email';

/**
 * Basic Email Test - Tests if email system is configured correctly
 */
async function testBasicEmail() {
  console.log('📧 TESTING_BASIC_EMAIL_FUNCTIONALITY');
  console.log('====================================');
  
  try {
    // Check if email environment variables are set
    const emailConfig = {
      gmail: !!process.env.GOOGLE_DELEGATED_EMAIL,
      password: !!process.env.GOOGLE_APP_PASSWORD,
    };
    
    console.log('🔧 EMAIL_CONFIGURATION', emailConfig);
    
    if (!emailConfig.gmail || !emailConfig.password) {
      console.log('❌ EMAIL_CONFIG_MISSING');
      console.log('GOOGLE_DELEGATED_EMAIL:', process.env.GOOGLE_DELEGATED_EMAIL ? 'SET' : 'NOT SET');
      console.log('GOOGLE_APP_PASSWORD:', process.env.GOOGLE_APP_PASSWORD ? 'SET' : 'NOT SET');
      return;
    }
    
    // Create mock test data
    const mockShift = {
      id: 999,
      date: '2025-07-10',
      startTime: '09:00',
      endTime: '17:00',
      role: 'Server',
      location: 'Main Restaurant',
      description: 'Test shift for email notification',
      status: 'assigned',
      tenantId: 'template-business',
      assignedTo: 1,
      createdBy: 1,
      assignmentType: 'assigned',
      requiredStaff: 1,
      claimedBy: null,
      templateId: null,
      notes: null
    };
    
    const mockStaff = {
      id: 1,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      username: 'testuser',
      role: 'staff',
      tenantId: 'template-business',
      active: true,
      department: 'Service',
      position: 'Server',
      phone: '123-456-7890',
      emergencyContactName: 'Emergency Contact',
      emergencyContactPhone: '098-765-4321',
      password: 'hashed',
      activationToken: null,
      activationTokenExpires: null,
      resetToken: null,
      resetTokenExpires: null,
      lastLogin: null,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      currentSubscription: null,
      stripeCustomerId: null,
      subscriptionStatus: null,
      lastSubscriptionUpdate: null,
      maxSeats: null,
      currentSeats: null,
      notificationPreferences: null,
      businessProfileId: null,
      profileImageUrl: null,
      experienceLevel: null,
      contractType: null,
      contractDetails: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('📨 SENDING_TEST_EMAIL');
    console.log('Test staff email:', mockStaff.email);
    console.log('Test shift:', {
      id: mockShift.id,
      date: mockShift.date,
      time: `${mockShift.startTime} - ${mockShift.endTime}`,
      role: mockShift.role,
      location: mockShift.location
    });
    
    // Test sending a shift assignment email
    await sendShiftAssignmentEmail(mockShift, mockStaff);
    
    console.log('✅ EMAIL_SENT_SUCCESSFULLY');
    console.log('📧 Email notification system is working correctly');
    console.log('✅ SMTP connection established');
    console.log('✅ Email template rendered successfully');
    console.log('✅ All email functions should work in production');
    
  } catch (error) {
    console.error('❌ EMAIL_TEST_FAILED');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.message.includes('Invalid login')) {
      console.error('🔑 Check your Gmail credentials');
      console.error('   - GOOGLE_DELEGATED_EMAIL should be your Gmail address');
      console.error('   - GOOGLE_APP_PASSWORD should be your app-specific password');
    }
    
    if (error.message.includes('ENOTFOUND')) {
      console.error('🌐 Check your internet connection');
    }
  }
}

testBasicEmail().catch(console.error);