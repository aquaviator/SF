import { db } from "../server/db.js";
import { 
  shifts, 
  timeEntries, 
  holidayRequests,
  assignments,
  opportunities
} from "../shared/schema.js";

async function seedRealisticData() {
  console.log("Starting realistic data seed...");
  
  // Get current date for realistic timestamps
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // Helper function to get date N days from now
  const getDateOffset = (days: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  try {
    // 1. Create realistic shifts for the past week and upcoming week
    const shiftData = [
      // Past week shifts (completed)
      {
        tenantId: "acme-corp",
        role: "Server",
        date: getDateOffset(-6),
        startTime: "09:00",
        endTime: "17:00",
        description: "Morning shift",
        location: "Main Location",
        assignedTo: 35, // Sarah Johnson
        status: "completed" as const,
        isPublished: true,
        createdBy: 35,
        templateId: null
      },
      {
        tenantId: "acme-corp", 
        role: "Server",
        date: getDateOffset(-4),
        startTime: "12:00",
        endTime: "20:00",
        description: "Afternoon shift",
        location: "Main Location",
        assignedTo: 35,
        status: "completed" as const,
        isPublished: true,
        createdBy: 35,
        templateId: null
      },
      {
        tenantId: "acme-corp",
        role: "Server", 
        date: getDateOffset(-2),
        startTime: "10:00",
        endTime: "18:00",
        description: "Day shift",
        location: "Main Location",
        assignedTo: 35,
        status: "completed" as const,
        isPublished: true,
        createdBy: 35,
        templateId: null
      },
      // This week shifts
      {
        tenantId: "acme-corp",
        role: "Server",
        date: getDateOffset(1),
        startTime: "09:00", 
        endTime: "17:00",
        description: "Morning shift",
        location: "Main Location",
        assignedTo: 35,
        status: "confirmed" as const,
        isPublished: true,
        createdBy: 35,
        templateId: null
      },
      {
        tenantId: "acme-corp",
        role: "Server",
        date: getDateOffset(3),
        startTime: "14:00",
        endTime: "22:00", 
        description: "Evening shift",
        location: "Main Location",
        assignedTo: 35,
        status: "confirmed" as const,
        isPublished: true,
        createdBy: 35,
        templateId: null
      },
      {
        tenantId: "acme-corp",
        role: "Server",
        date: getDateOffset(5),
        startTime: "11:00",
        endTime: "19:00",
        description: "Lunch shift",
        location: "Main Location", 
        assignedTo: 35,
        status: "assigned" as const,
        isPublished: true,
        createdBy: 35,
        templateId: null
      }
    ];

    console.log("Inserting shifts...");
    const insertedShifts = await db.insert(shifts).values(shiftData).returning();
    console.log(`Inserted ${insertedShifts.length} shifts`);

    // 2. Create time entries for completed shifts
    const timeEntryData = [
      // Past week time entries
      {
        tenantId: "acme-corp",
        userId: 35,
        shiftId: insertedShifts[0].id,
        clockInTime: new Date(`${getDateOffset(-6)}T09:02:00`),
        clockOutTime: new Date(`${getDateOffset(-6)}T17:01:00`),
        totalHours: "7.98",
        status: "clocked_out" as const,
        lateByMinutes: 2,
        earlyByMinutes: 0,
        notes: "Completed morning shift"
      },
      {
        tenantId: "acme-corp",
        userId: 35, 
        shiftId: insertedShifts[1].id,
        clockInTime: new Date(`${getDateOffset(-4)}T12:05:00`),
        clockOutTime: new Date(`${getDateOffset(-4)}T20:03:00`),
        totalHours: "7.97",
        status: "clocked_out" as const,
        lateByMinutes: 5,
        earlyByMinutes: 0,
        notes: "Completed afternoon shift"
      },
      {
        tenantId: "acme-corp",
        userId: 35,
        shiftId: insertedShifts[2].id,
        clockInTime: new Date(`${getDateOffset(-2)}T10:01:00`),
        clockOutTime: new Date(`${getDateOffset(-2)}T18:02:00`),
        totalHours: "8.02",
        status: "clocked_out" as const,
        lateByMinutes: 1,
        earlyByMinutes: 0,
        notes: "Completed day shift"
      }
    ];

    console.log("Inserting time entries...");
    const insertedTimeEntries = await db.insert(timeEntries).values(timeEntryData).returning();
    console.log(`Inserted ${insertedTimeEntries.length} time entries`);

    // 3. Create a holiday request
    const holidayRequestData = [{
      tenantId: "acme-corp",
      userId: 35,
      startDate: getDateOffset(10),
      endDate: getDateOffset(12), 
      requestType: "vacation" as const,
      status: "pending" as const,
      reason: "Family vacation",
      requestedDays: 3,
      submittedAt: new Date(),
      updatedAt: new Date()
    }];

    console.log("Inserting holiday request...");
    const insertedHolidayRequests = await db.insert(holidayRequests).values(holidayRequestData).returning();
    console.log(`Inserted ${insertedHolidayRequests.length} holiday requests`);

    // 4. Create some opportunities 
    const opportunityData = [
      {
        tenantId: "acme-corp",
        title: "Weekend Kitchen Help",
        description: "Help needed in kitchen during busy weekend",
        assignmentType: "open_opportunity" as const,
        createdBy: 35,
        isActive: true,
        requirements: ["Food handling certification preferred"],
        location: "Main Kitchen",
        hourlyRate: 16.50,
        slots: 2
      },
      {
        tenantId: "acme-corp", 
        title: "Event Server",
        description: "Private event catering service",
        assignmentType: "open_opportunity" as const,
        createdBy: 35,
        isActive: true,
        requirements: ["Experience with formal dining service"],
        location: "Banquet Hall",
        hourlyRate: 18.00,
        slots: 1
      },
      {
        tenantId: "acme-corp",
        title: "Delivery Driver",
        description: "Food delivery for catering orders",
        assignmentType: "open_opportunity" as const,
        createdBy: 35,
        isActive: true,
        requirements: ["Valid driver's license", "Own vehicle"],
        location: "Various locations",
        hourlyRate: 15.00,
        slots: 1
      }
    ];

    console.log("Inserting opportunities...");
    const insertedOpportunities = await db.insert(opportunities).values(opportunityData).returning();
    console.log(`Inserted ${insertedOpportunities.length} opportunities`);

    // 5. Create an assignment for staff response
    const assignmentData = [{
      tenantId: "acme-corp",
      title: "Weekend Kitchen Assistant",
      description: "We need extra kitchen help this weekend during our busy period. Perfect opportunity for additional hours.",
      assignmentType: "assigned" as const,
      assignedTo: 35,
      createdBy: 35,
      isActive: true,
      requirements: ["Basic food prep experience"],
      location: "Main Kitchen", 
      hourlyRate: 16.00,
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      status: "pending"
    }];

    console.log("Inserting assignments...");
    const insertedAssignments = await db.insert(assignments).values(assignmentData).returning();
    console.log(`Inserted ${insertedAssignments.length} assignments`);

    console.log("\n✅ Realistic data seed completed successfully!");
    console.log("📊 Summary:");
    console.log(`- ${insertedShifts.length} shifts (3 completed, 3 upcoming)`);
    console.log(`- ${insertedTimeEntries.length} time entries (~24 hours total)`);
    console.log(`- ${insertedHolidayRequests.length} holiday request`);
    console.log(`- ${insertedOpportunities.length} shift opportunities`);
    console.log(`- ${insertedAssignments.length} pending assignment`);

  } catch (error) {
    console.error("❌ Error seeding realistic data:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedRealisticData()
    .then(() => {
      console.log("Seed completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}

export { seedRealisticData };