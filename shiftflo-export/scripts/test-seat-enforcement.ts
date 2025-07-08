// Test the seat-based enforcement system end-to-end
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testSeatEnforcement() {
  console.log('🧪 SEAT_ENFORCEMENT_TEST_START', { timestamp: new Date().toISOString() });
  
  try {
    // Step 1: Check current seat usage
    console.log('📊 Checking current seat usage...');
    const usageResponse = await fetch(`${BASE_URL}/api/subscription/seat-usage?tenantId=template-business`);
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
    
    // Step 2: Try to add staff when at/over limit
    if (seatUsage.availableSeats <= 0) {
      console.log('🚫 TESTING_SEAT_LIMIT_ENFORCEMENT (should fail)...');
      const invitationData = {
        firstName: 'Over',
        lastName: 'Limit',
        email: `overlimit+${Date.now()}@example.com`,
        role: 'staff',
        tenantId: 'template-business'
      };
      
      const inviteResponse = await fetch(`${BASE_URL}/api/admin/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invitationData)
      });
      
      if (!inviteResponse.ok) {
        const errorData = await inviteResponse.json();
        if (errorData.code === 'SEAT_LIMIT_EXCEEDED') {
          console.log('✅ SEAT_LIMIT_PROPERLY_ENFORCED:', {
            status: inviteResponse.status,
            code: errorData.code,
            message: errorData.message,
            currentSeats: errorData.currentSeats,
            maxSeats: errorData.maxSeats
          });
        } else {
          console.log('❌ UNEXPECTED_ERROR_RESPONSE:', errorData);
        }
      } else {
        console.log('❌ SEAT_LIMIT_NOT_ENFORCED - invitation should have failed');
      }
    } else {
      console.log('✅ SEATS_AVAILABLE - enforcement not triggered');
    }
    
    // Step 3: Test successful invitation when seats available
    if (seatUsage.availableSeats > 0) {
      console.log('👤 TESTING_SUCCESSFUL_INVITATION (should work)...');
      const validInvitationData = {
        firstName: 'Valid',
        lastName: 'User',
        email: `valid+${Date.now()}@example.com`,
        role: 'staff',
        tenantId: 'template-business'
      };
      
      const validInviteResponse = await fetch(`${BASE_URL}/api/admin/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validInvitationData)
      });
      
      if (validInviteResponse.ok) {
        const result = await validInviteResponse.json();
        console.log('✅ VALID_INVITATION_SUCCESSFUL:', {
          message: result.message,
          userId: result.userId
        });
      } else {
        const errorData = await validInviteResponse.json();
        console.log('❌ VALID_INVITATION_FAILED:', errorData);
      }
    }
    
    // Step 4: Check updated seat usage
    console.log('📊 Checking updated seat usage...');
    const updatedUsageResponse = await fetch(`${BASE_URL}/api/subscription/seat-usage?tenantId=template-business`);
    const updatedSeatUsage = await updatedUsageResponse.json();
    console.log('📋 UPDATED_SEAT_USAGE:', {
      totalSeats: updatedSeatUsage.totalSeats,
      activeStaff: updatedSeatUsage.activeStaff,
      pendingInvites: updatedSeatUsage.pendingInvites,
      seatsUsed: updatedSeatUsage.seatsUsed,
      availableSeats: updatedSeatUsage.availableSeats,
      isOverLimit: updatedSeatUsage.isOverLimit,
      excessSeats: updatedSeatUsage.excessSeats
    });
    
    console.log('✅ SEAT_ENFORCEMENT_TEST_COMPLETE');
    
  } catch (error) {
    console.error('❌ SEAT_ENFORCEMENT_TEST_FAILED:', error.message);
  }
}

// Run the test
testSeatEnforcement();