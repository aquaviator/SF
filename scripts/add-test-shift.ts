import { db } from "../server/db";
import { shifts } from "../shared/schema";

/**
 * Add a test shift for Alice Johnson (ID: 3) to test cancellation functionality
 */
async function addTestShift() {
  try {
    console.log('➕ Adding test shift for Alice Johnson...');

    // Create a shift for tomorrow so it can be cancelled
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const [shift] = await db.insert(shifts).values({
      tenantId: "clean-business",
      date: tomorrowStr,
      startTime: "09:00",
      endTime: "17:00",
      role: "General Staff",
      description: "Test shift for cancellation testing",
      location: "Main Office",
      assignedTo: 3, // Alice Johnson
      status: "assigned",
      createdBy: 2, // Business Owner
      notes: "Test shift to verify cancellation functionality"
    }).returning();

    console.log('✅ Test shift created successfully!');
    console.log(`   - Shift ID: ${shift.id}`);
    console.log(`   - Date: ${shift.date}`);
    console.log(`   - Time: ${shift.startTime} - ${shift.endTime}`);
    console.log(`   - Assigned to: Alice Johnson (ID: 3)`);
    console.log(`   - Status: ${shift.status}`);
    console.log('🎯 Ready to test cancellation functionality!');

  } catch (error) {
    console.error('❌ Error adding test shift:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run the script
addTestShift();