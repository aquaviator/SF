/**
 * Fix Seat Limit Overrun
 * Provides options to resolve the current over-limit situation
 */

async function fixSeatLimitOverrun() {
  console.log('🔧 SEAT_LIMIT_OVERRUN_FIX_START', { timestamp: new Date().toISOString() });
  
  try {
    // Get current situation via API
    const tenantId = 'ofs-705305';
    const BASE_URL = 'http://localhost:5000';
    
    // Get subscription details
    const subscriptionResponse = await fetch(`${BASE_URL}/api/subscription?tenantId=${tenantId}`);
    const subscription = await subscriptionResponse.json();
    
    if (!subscription) {
      console.log('❌ No subscription found for tenant');
      return;
    }
    
    // Get all staff members
    const staffResponse = await fetch(`${BASE_URL}/api/staff?tenantId=${tenantId}`);
    const allStaff = await staffResponse.json();
    
    const activeStaff = allStaff.filter((u: any) => u.isActive);
    const inactiveStaff = allStaff.filter((u: any) => !u.isActive);
    
    console.log('📊 CURRENT_SITUATION:', {
      subscriptionSeats: subscription.seatsIncluded,
      totalStaff: allStaff.length,
      activeStaff: activeStaff.length,
      inactiveStaff: inactiveStaff.length,
      overLimit: activeStaff.length > subscription.seatsIncluded,
      excessStaff: Math.max(0, activeStaff.length - subscription.seatsIncluded)
    });
    
    console.log('\n👥 ACTIVE_STAFF_MEMBERS:');
    activeStaff.forEach((staff: any, index: number) => {
      console.log(`  ${index + 1}. ${staff.username} (ID: ${staff.id}) - Created: ${staff.createdAt || 'N/A'}`);
    });
    
    console.log('\n💤 INACTIVE_STAFF_MEMBERS:');
    inactiveStaff.forEach((staff: any, index: number) => {
      console.log(`  ${index + 1}. ${staff.username} (ID: ${staff.id}) - Created: ${staff.createdAt || 'N/A'}`);
    });
    
    // Provide remediation options
    const excessCount = activeStaff.length - subscription.seatsIncluded;
    
    if (excessCount > 0) {
      console.log('\n🚨 OVERRUN_DETECTED:', {
        message: `${excessCount} staff member(s) exceed the ${subscription.seatsIncluded}-seat limit`,
        recommendedActions: [
          'Option 1: Upgrade subscription to accommodate current staff',
          'Option 2: Deactivate excess staff members',
          'Option 3: Remove test/demo accounts'
        ]
      });
      
      // Option 1: Calculate upgrade cost
      const recommendedSeats = Math.max(subscription.seatsIncluded, activeStaff.length);
      console.log('\n💰 UPGRADE_OPTION:', {
        currentSeats: subscription.seatsIncluded,
        recommendedSeats: recommendedSeats,
        additionalSeats: recommendedSeats - subscription.seatsIncluded,
        estimatedCost: `$${(recommendedSeats * (subscription.pricePerSeat || 300)) / 100}/month`
      });
      
      // Option 2: Suggest deactivation candidates (use test account patterns)
      const testAccountPatterns = ['+1@', '+2@', '+3@', '+4@', '+5@', '+100@'];
      const deactivationCandidates = activeStaff.filter((staff: any) => 
        testAccountPatterns.some(pattern => staff.username.includes(pattern))
      ).slice(0, excessCount);
      
      console.log('\n🔄 DEACTIVATION_CANDIDATES (test accounts):');
      deactivationCandidates.forEach((candidate: any, index: number) => {
        console.log(`  ${index + 1}. ${candidate.username} (ID: ${candidate.id})`);
      });
      
      // Option 3: Provide SQL commands for manual intervention
      console.log('\n🛠️ MANUAL_REMEDIATION_OPTIONS:');
      console.log('\n-- Option A: Upgrade subscription seats:');
      console.log(`UPDATE subscriptions SET seats_included = ${recommendedSeats} WHERE tenant_id = '${tenantId}';`);
      
      console.log('\n-- Option B: Deactivate excess staff (run for each excess user):');
      deactivationCandidates.forEach((candidate: any) => {
        console.log(`UPDATE users SET is_active = false WHERE id = ${candidate.id}; -- ${candidate.username}`);
      });
      
      console.log('\n-- Option C: Remove test accounts (if applicable):');
      console.log('-- Review staff list and remove any test/demo accounts manually');
    } else {
      console.log('✅ NO_OVERRUN_DETECTED: Current staff count is within seat limits');
    }
    
    console.log('\n✅ SEAT_LIMIT_ANALYSIS_COMPLETED');
    
  } catch (error) {
    console.error('❌ FIX_FAILED:', error);
  }
}

// Run the fix
fixSeatLimitOverrun().catch(console.error);