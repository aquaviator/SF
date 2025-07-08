// Test the complete invitation workflow: API + Email
async function testFullInvitation() {
  console.log('🧪 FULL_INVITATION_TEST_START', { timestamp: new Date().toISOString() });
  
  try {
    const invitationData = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      role: 'staff',
      tenantId: 'template-business'
    };
    
    console.log('📤 Sending invitation with email...');
    const response = await fetch('http://localhost:5000/api/admin/staff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invitationData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ FULL_INVITATION_SUCCESS', {
      message: result.message,
      userCreated: result.userId ? true : false,
      emailExpected: true
    });
    
    console.log('🔍 Verifying user in database...');
    const staffResponse = await fetch('http://localhost:5000/api/staff?tenantId=template-business');
    const staff = await staffResponse.json();
    
    const createdUser = staff.find((user: any) => user.email === invitationData.email);
    if (createdUser) {
      console.log('✅ USER_VERIFIED_IN_DATABASE', {
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
        isActive: createdUser.isActive,
        role: createdUser.role
      });
    } else {
      console.log('❌ USER_NOT_FOUND_IN_DATABASE');
    }
    
  } catch (error) {
    console.error('❌ FULL_INVITATION_TEST_FAILED', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

testFullInvitation();