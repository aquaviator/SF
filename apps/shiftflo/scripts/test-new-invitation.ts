// Test the complete invitation workflow with a new unique email
async function testNewInvitation() {
  console.log('🧪 NEW_INVITATION_TEST_START', { timestamp: new Date().toISOString() });
  
  // Use a unique timestamp to ensure no email conflicts
  const timestamp = Date.now();
  const uniqueEmail = `test+${timestamp}@shiftflo.com`;
  
  try {
    const invitationData = {
      firstName: 'Test',
      lastName: 'User',
      email: uniqueEmail,
      role: 'staff',
      tenantId: 'template-business'
    };
    
    console.log('📤 Sending invitation with unique email...', { email: uniqueEmail });
    const response = await fetch('http://localhost:5000/api/admin/staff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invitationData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ NEW_INVITATION_SUCCESS', {
      message: result.message,
      email: uniqueEmail,
      userCreated: result.userId ? true : false
    });
    
    console.log('🔍 Check your email inbox for activation link:');
    console.log(`📧 Email sent to: ${uniqueEmail}`);
    console.log('📋 Expected activation URL format: http://localhost:5000/activate?token=...');
    
  } catch (error) {
    console.error('❌ NEW_INVITATION_TEST_FAILED', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

testNewInvitation();