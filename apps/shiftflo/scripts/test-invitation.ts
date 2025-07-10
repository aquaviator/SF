// Use Node.js built-in fetch (available in Node 18+)

async function testInvitationAPI() {
  console.log('🧪 INVITATION_API_TEST_START', { timestamp: new Date().toISOString() });
  
  try {
    const invitationData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test.user@example.com',
      role: 'staff',
      tenantId: 'template-business'
    };
    
    console.log('📤 Sending invitation request...');
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
    console.log('✅ INVITATION_SUCCESS', {
      message: result.message,
      userCreated: result.userId ? true : false
    });
    
    // Check if user was created in database by querying staff endpoint
    console.log('🔍 Verifying user was created...');
    const staffResponse = await fetch('http://localhost:5000/api/staff?tenantId=template-business');
    const staff = await staffResponse.json();
    
    const createdUser = staff.find((user: any) => user.email === invitationData.email);
    if (createdUser) {
      console.log('✅ USER_CREATED_IN_DATABASE', {
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
        isActive: createdUser.isActive
      });
    } else {
      console.log('❌ USER_NOT_FOUND_IN_DATABASE');
    }
    
  } catch (error) {
    console.error('❌ INVITATION_TEST_FAILED', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

testInvitationAPI();