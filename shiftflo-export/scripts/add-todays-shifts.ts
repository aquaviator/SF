import { db } from "../server/db";
import { shifts, timeEntries, users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function addTodaysShifts() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get tenant and users
    const tenantId = "dialabeer";
    const allUsers = await db.select().from(users).where(eq(users.tenantId, tenantId));
    const staffUsers = allUsers.filter(u => u.role === 'staff');
    
    console.log(`Found ${staffUsers.length} staff users for tenant ${tenantId}`);
    
    // Create today's shifts
    const todaysShifts = [
      {
        tenantId,
        date: today,
        startTime: "08:00",
        endTime: "16:00",
        role: "Team Member",
        description: "Morning shift - 8am to 4pm",
        location: "Main Office",
        status: "assigned" as const,
        assignmentType: "assigned" as const,
        requiredStaff: 1,
        assignedTo: staffUsers[0]?.id || null,
        claimedBy: null,
        createdBy: allUsers.find(u => u.role === 'owner')?.id || null,
        templateId: null,
        notes: "Morning shift"
      },
      {
        tenantId,
        date: today,
        startTime: "12:00",
        endTime: "20:00",
        role: "Team Member", 
        description: "Afternoon shift - 12pm to 8pm",
        location: "Main Office",
        status: "assigned" as const,
        assignmentType: "assigned" as const,
        requiredStaff: 1,
        assignedTo: staffUsers[1]?.id || null,
        claimedBy: null,
        createdBy: allUsers.find(u => u.role === 'owner')?.id || null,
        templateId: null,
        notes: "Afternoon shift"
      },
      {
        tenantId,
        date: today,
        startTime: "16:00",
        endTime: "00:00",
        role: "Team Member",
        description: "Evening shift - 4pm to midnight",
        location: "Main Office", 
        status: "assigned" as const,
        assignmentType: "assigned" as const,
        requiredStaff: 1,
        assignedTo: staffUsers[2]?.id || null,
        claimedBy: null,
        createdBy: allUsers.find(u => u.role === 'owner')?.id || null,
        templateId: null,
        notes: "Evening shift"
      }
    ];

    const createdShifts = await db.insert(shifts).values(todaysShifts).returning();
    console.log(`✅ Created ${createdShifts.length} shifts for today`);

    // Create time entries to show staff clocked in
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 8);
    
    const timeEntriesToday = [
      {
        tenantId,
        userId: staffUsers[0]?.id || 0,
        shiftId: createdShifts[0]?.id || 0,
        clockInTime: "08:00:00",
        status: "clocked_in" as const,
        totalHours: "0.00",
        date: today,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        tenantId,
        userId: staffUsers[1]?.id || 0,
        shiftId: createdShifts[1]?.id || 0,
        clockInTime: "12:15:00", // 15 minutes late
        status: "late" as const,
        totalHours: "0.00", 
        date: today,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const createdTimeEntries = await db.insert(timeEntries).values(timeEntriesToday).returning();
    console.log(`✅ Created ${createdTimeEntries.length} time entries for today`);

    console.log("🎯 Today's data setup complete:");
    console.log(`- Date: ${today}`);
    console.log(`- Shifts created: ${createdShifts.length}`);
    console.log(`- Active time entries: ${createdTimeEntries.length}`);
    console.log(`- Staff statuses: 1 clocked in, 1 late, 1 not started`);

  } catch (error) {
    console.error("❌ Error setting up today's data:", error);
  }
}

addTodaysShifts();