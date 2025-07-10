import { db } from "../server/db";
import { timeEntries } from "../shared/schema";

/**
 * Add active time entries to show staff currently working
 */
async function addActiveTimeEntries() {
  console.log("⏰ Adding active time entries...");

  // Get current time for realistic entries
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(8, 0, 0, 0); // 8 AM start

  const morningStart = new Date(now);
  morningStart.setHours(9, 30, 0, 0); // 9:30 AM start

  const activeEntries = [
    {
      tenantId: "acme-corp",
      userId: 2, // Mike Johnson
      shiftId: 1, // Today's shift
      clockInTime: startOfDay,
      clockOutTime: null, // Still clocked in
      totalHours: "2.5", // Currently worked
      status: "clocked_in" as const,
      isApproved: false,
      notes: "Working morning prep shift",
    },
    {
      tenantId: "acme-corp", 
      userId: 3, // Lisa Chen
      shiftId: 2, // Today's shift
      clockInTime: morningStart,
      clockOutTime: null, // Still clocked in
      totalHours: "1.0", // Currently worked
      status: "clocked_in" as const,
      isApproved: false,
      notes: "Working FOH service",
    },
    {
      tenantId: "acme-corp",
      userId: 4, // Alex Martinez 
      shiftId: 3, // Today's shift
      clockInTime: morningStart,
      clockOutTime: null, // Still clocked in
      totalHours: "1.0", // Currently worked
      status: "on_break" as const,
      isApproved: false,
      notes: "On lunch break",
      breakStartTime: new Date(now.getTime() - 15 * 60 * 1000), // Started break 15 min ago
    }
  ];

  try {
    // Insert active time entries
    for (const entry of activeEntries) {
      await db.insert(timeEntries).values(entry);
      console.log(`✅ Added active time entry for user ${entry.userId} (${entry.status})`);
    }

    console.log("✅ Active time entries added successfully!");
    console.log(`📊 Added ${activeEntries.length} active time entries showing current staff status`);
    
  } catch (error) {
    console.error("❌ Error adding active time entries:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  addActiveTimeEntries()
    .then(() => {
      console.log("🎉 Active time entries setup complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Setup failed:", error);
      process.exit(1);
    });
}

export { addActiveTimeEntries };