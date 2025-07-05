import { db } from "../server/db";
import { shifts, users } from "../shared/schema";
import { eq, and } from "drizzle-orm";

async function addTestAssignment() {
  try {
    console.log("Creating test assignment for clean-business...");
    
    // Get the current users
    const allUsers = await db.select().from(users).where(eq(users.tenantId, "clean-business"));
    console.log("Available users:", allUsers.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}`, role: u.role })));
    
    // Find owner and staff
    const owner = allUsers.find(u => u.role === "owner");
    const staffMember = allUsers.find(u => u.role === "staff");
    
    if (!owner || !staffMember) {
      console.log("No owner or staff found");
      return;
    }
    
    console.log(`Owner: ${owner.firstName} ${owner.lastName} (ID: ${owner.id})`);
    console.log(`Staff: ${staffMember.firstName} ${staffMember.lastName} (ID: ${staffMember.id})`);
    
    // Create a test shift with "assigned" status
    const testShift = await db.insert(shifts).values({
      tenantId: "clean-business",
      date: "2025-07-06", // Tomorrow
      role: "Server",
      startTime: "10:00",
      endTime: "18:00",
      location: "Main Location",
      description: "Test assignment requiring confirmation",
      status: "assigned", // This is the key - needs staff confirmation
      assignmentType: "shift",
      createdBy: owner.id,
      assignedTo: staffMember.id, // Assigned to staff member
      notes: "Please confirm your availability for this shift"
    }).returning();
    
    console.log("✅ Test assignment created:", {
      id: testShift[0].id,
      date: testShift[0].date,
      role: testShift[0].role,
      status: testShift[0].status,
      assignedTo: testShift[0].assignedTo,
      createdBy: testShift[0].createdBy
    });
    
    // Verify by checking pending assignments
    const pendingAssignments = await db.select().from(shifts).where(
      and(
        eq(shifts.tenantId, "clean-business"),
        eq(shifts.assignedTo, staffMember.id),
        eq(shifts.status, "assigned")
      )
    );
    
    console.log(`✅ Pending assignments for ${staffMember.firstName}: ${pendingAssignments.length}`);
    
  } catch (error) {
    console.error("Error creating test assignment:", error);
  }
}

addTestAssignment();