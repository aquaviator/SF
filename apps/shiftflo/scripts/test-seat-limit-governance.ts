/**
 * Test Seat Limit Governance
 * Tests that the seat limit validation prevents activation when at capacity
 */

const BASE_URL = 'http://localhost:5000';

async function testSeatLimitGovernance() {
  console.log('🧪 SEAT_LIMIT_GOVERNANCE_TEST_START', { timestamp: new Date().toISOString() });
  
  try {
    // Step 1: Check current seat usage
    console.log('📊 Checking current seat usage...');
    const usageResponse = await fetch(`${BASE_URL}/api/subscription/seat-usage?tenantId=ofs-705305`);
    const seatUsage = await usageResponse.json();
    
    console.log('📋 CURRENT_SEAT_USAGE:', {
      totalSeats: seatUsage.totalSeats,
      activeStaff: seatUsage.activeStaff,
      pendingInvites: seatUsage.pendingInvites,
      seatsUsed: seatUsage.seatsUsed,
      availableSeats: seatUsage.availableSeats,
      isOverLimit: seatUsage.isOverLimit,
      excessSeats: seatUsage.excessSeats
    });
    
    // Step 2: Get inactive user with activation token
    console.log('🔍 Finding inactive user with activation token...');
    const staffResponse = await fetch(`${BASE_URL}/api/staff?tenantId=ofs-705305`);
    const staff = await staffResponse.json();
    
    const inactiveUser = staff.find((user: any) => !user.isActive);
    if (!inactiveUser) {
      console.log('❌ No inactive user found for testing');
      return;
    }
    
    console.log('👤 INACTIVE_USER_FOUND:', {
      id: inactiveUser.id,
      username: inactiveUser.username,
      email: inactiveUser.email,
      isActive: inactiveUser.isActive
    });
    
    // Step 3: Test activation endpoint with seat limit validation
    console.log('🚫 Testing activation when over seat limit (should fail)...');
    
    // Known activation token for user ID 159 (leatfield+100@gmail.com)
    const activationToken = 'c1309107998c4d3c109f6189ac471bf2d3ab9769938e33e8b4154aa52af51ff6';
    
    const activationResponse = await fetch(`${BASE_URL}/api/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: activationToken,
        password: 'testpassword123'
      })
    });
    
    if (!activationResponse.ok) {
      const errorData = await activationResponse.json();
      
      if (errorData.code === 'SEAT_LIMIT_EXCEEDED') {
        console.log('✅ SEAT_LIMIT_GOVERNANCE_WORKING:', {
          status: activationResponse.status,
          code: errorData.code,
          message: errorData.message,
          currentActiveStaff: errorData.currentActiveStaff,
          maxSeats: errorData.maxSeats
        });
        
        console.log('🔒 GOVERNANCE_RESULT: Account activation properly blocked due to seat limit');
      } else {
        console.log('❌ UNEXPECTED_ERROR:', {
          status: activationResponse.status,
          error: errorData
        });
      }
    } else {
      console.log('❌ SEAT_LIMIT_GOVERNANCE_FAILED: Activation should have been blocked');
      const result = await activationResponse.json();
      console.log('Activation result:', result);
    }
    
    console.log('✅ SEAT_LIMIT_GOVERNANCE_TEST_COMPLETED');
    
  } catch (error) {
    console.error('❌ TEST_FAILED:', error);
  }
}

// Run the test
testSeatLimitGovernance().catch(console.error);