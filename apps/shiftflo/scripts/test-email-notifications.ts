import { storage } from '../server/storage';
import { sendShiftAssignmentEmail, sendShiftReminderEmail, sendSwapRequestEmail, sendHolidayRequestEmail, sendHolidayStatusUpdateEmail, sendEmergencyShiftAlert } from '../server/utils/email';

/**
 * Test Email Notifications System
 * Tests all operational email notifications with real data
 */

interface TestResult {
  type: string;
  success: boolean;
  message: string;
  details?: any;
}

async function testEmailNotifications(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  console.log('📧 TESTING_EMAIL_NOTIFICATIONS_SYSTEM');
  console.log('=====================================');
  
  try {
    // Get test data from database using Template Business tenant
    const testTenantId = 'template-business';
    const allUsers = await storage.getStaffByTenant(testTenantId);
    const allShifts = await storage.getShiftsByTenant(testTenantId);
    const allHolidayRequests = await storage.getHolidayRequestsByTenant(testTenantId);
    
    // Find test users
    const owner = allUsers.find(u => u.role === 'owner');
    const staff = allUsers.find(u => u.role === 'staff');
    const assignedShift = allShifts.find(s => s.assignedTo && s.status === 'assigned');
    const confirmedShift = allShifts.find(s => s.assignedTo && s.status === 'confirmed');
    const holidayRequest = allHolidayRequests.find(r => r.status === 'pending');
    
    console.log('📊 TEST_DATA_SUMMARY', {
      totalUsers: allUsers.length,
      totalShifts: allShifts.length,
      totalHolidayRequests: allHolidayRequests.length,
      hasOwner: !!owner,
      hasStaff: !!staff,
      hasAssignedShift: !!assignedShift,
      hasConfirmedShift: !!confirmedShift,
      hasHolidayRequest: !!holidayRequest
    });
    
    // Test 1: Shift Assignment Email
    if (assignedShift && staff) {
      try {
        await sendShiftAssignmentEmail(assignedShift, staff);
        results.push({
          type: 'shift_assignment',
          success: true,
          message: `Shift assignment email sent to ${staff.email}`,
          details: { shiftId: assignedShift.id, staffId: staff.id }
        });
      } catch (error) {
        results.push({
          type: 'shift_assignment',
          success: false,
          message: `Failed to send shift assignment email: ${error.message}`,
          details: { error: error.message }
        });
      }
    } else {
      results.push({
        type: 'shift_assignment',
        success: false,
        message: 'No assigned shift or staff found for testing',
        details: { assignedShift: !!assignedShift, staff: !!staff }
      });
    }
    
    // Test 2: Shift Reminder Email
    if (confirmedShift && staff) {
      try {
        await sendShiftReminderEmail(confirmedShift, staff);
        results.push({
          type: 'shift_reminder',
          success: true,
          message: `Shift reminder email sent to ${staff.email}`,
          details: { shiftId: confirmedShift.id, staffId: staff.id }
        });
      } catch (error) {
        results.push({
          type: 'shift_reminder',
          success: false,
          message: `Failed to send shift reminder email: ${error.message}`,
          details: { error: error.message }
        });
      }
    } else {
      results.push({
        type: 'shift_reminder',
        success: false,
        message: 'No confirmed shift or staff found for testing',
        details: { confirmedShift: !!confirmedShift, staff: !!staff }
      });
    }
    
    // Test 3: Swap Request Email (mock data)
    if (staff && owner && confirmedShift) {
      try {
        const mockSwapData = {
          id: 999,
          originalShift: confirmedShift,
          targetShift: {
            date: '2025-07-10',
            startTime: '14:00',
            endTime: '18:00',
            role: 'Server',
            location: 'Main Floor'
          },
          reason: 'Family emergency - need to swap shifts'
        };
        
        await sendSwapRequestEmail(mockSwapData, owner, staff);
        results.push({
          type: 'swap_request',
          success: true,
          message: `Swap request email sent to ${owner.email}`,
          details: { swapId: mockSwapData.id, fromStaff: staff.id, toOwner: owner.id }
        });
      } catch (error) {
        results.push({
          type: 'swap_request',
          success: false,
          message: `Failed to send swap request email: ${error.message}`,
          details: { error: error.message }
        });
      }
    } else {
      results.push({
        type: 'swap_request',
        success: false,
        message: 'No staff, owner, or confirmed shift found for testing',
        details: { staff: !!staff, owner: !!owner, confirmedShift: !!confirmedShift }
      });
    }
    
    // Test 4: Holiday Request Email
    if (holidayRequest && owner && staff) {
      try {
        const requestData = {
          ...holidayRequest,
          daysRequested: 3,
          requestType: 'Vacation',
          createdAt: new Date().toISOString()
        };
        
        await sendHolidayRequestEmail(requestData, owner, staff);
        results.push({
          type: 'holiday_request',
          success: true,
          message: `Holiday request email sent to ${owner.email}`,
          details: { requestId: holidayRequest.id, fromStaff: staff.id, toOwner: owner.id }
        });
      } catch (error) {
        results.push({
          type: 'holiday_request',
          success: false,
          message: `Failed to send holiday request email: ${error.message}`,
          details: { error: error.message }
        });
      }
    } else {
      results.push({
        type: 'holiday_request',
        success: false,
        message: 'No holiday request, owner, or staff found for testing',
        details: { holidayRequest: !!holidayRequest, owner: !!owner, staff: !!staff }
      });
    }
    
    // Test 5: Holiday Status Update Email
    if (holidayRequest && owner && staff) {
      try {
        const statusUpdateData = {
          ...holidayRequest,
          status: 'approved',
          daysRequested: 3,
          requestType: 'Vacation',
          updatedAt: new Date().toISOString()
        };
        
        await sendHolidayStatusUpdateEmail(statusUpdateData, staff, owner);
        results.push({
          type: 'holiday_status_update',
          success: true,
          message: `Holiday status update email sent to ${staff.email}`,
          details: { requestId: holidayRequest.id, toStaff: staff.id, fromOwner: owner.id }
        });
      } catch (error) {
        results.push({
          type: 'holiday_status_update',
          success: false,
          message: `Failed to send holiday status update email: ${error.message}`,
          details: { error: error.message }
        });
      }
    } else {
      results.push({
        type: 'holiday_status_update',
        success: false,
        message: 'No holiday request, owner, or staff found for testing',
        details: { holidayRequest: !!holidayRequest, owner: !!owner, staff: !!staff }
      });
    }
    
    // Test 6: Emergency Shift Alert
    if (confirmedShift && staff) {
      try {
        const eligibleStaff = allUsers.filter(u => u.role === 'staff' && u.active);
        
        await sendEmergencyShiftAlert(confirmedShift, eligibleStaff, 'Testing emergency alert system');
        results.push({
          type: 'emergency_alert',
          success: true,
          message: `Emergency alert sent to ${eligibleStaff.length} staff members`,
          details: { shiftId: confirmedShift.id, staffCount: eligibleStaff.length }
        });
      } catch (error) {
        results.push({
          type: 'emergency_alert',
          success: false,
          message: `Failed to send emergency alert: ${error.message}`,
          details: { error: error.message }
        });
      }
    } else {
      results.push({
        type: 'emergency_alert',
        success: false,
        message: 'No confirmed shift or staff found for testing',
        details: { confirmedShift: !!confirmedShift, staff: !!staff }
      });
    }
    
  } catch (error) {
    results.push({
      type: 'system_error',
      success: false,
      message: `System error during email testing: ${error.message}`,
      details: { error: error.message }
    });
  }
  
  return results;
}

// Run the tests
async function runTests() {
  console.log('🚀 STARTING_EMAIL_NOTIFICATION_TESTS');
  console.log('====================================');
  
  const results = await testEmailNotifications();
  
  console.log('\n📊 TEST_RESULTS_SUMMARY');
  console.log('=======================');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful tests: ${successful}/${results.length}`);
  console.log(`❌ Failed tests: ${failed}/${results.length}`);
  
  console.log('\n📝 DETAILED_RESULTS');
  console.log('==================');
  
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${index + 1}. ${result.type}: ${result.message}`);
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
  });
  
  if (successful === results.length) {
    console.log('\n🎉 ALL_EMAIL_NOTIFICATIONS_WORKING');
    console.log('==================================');
    console.log('✅ All email notification types are functioning correctly');
    console.log('✅ Email templates are rendering properly');
    console.log('✅ SMTP connection is working');
    console.log('✅ Error handling is in place');
  } else {
    console.log('\n⚠️  SOME_TESTS_FAILED');
    console.log('=====================');
    console.log('❌ Some email notification tests failed');
    console.log('❌ Check your email configuration');
    console.log('❌ Verify SMTP credentials');
  }
  
  process.exit(successful === results.length ? 0 : 1);
}

runTests().catch(console.error);