import { db } from "../server/db";
import {
  users,
  businessProfiles,
  locations,
  jobRoles,
  shifts,
  shiftPolicies
} from "@shared/schema";

/**
 * Simple Template Seed - Creates a minimal business with 2 staff
 * Perfect for starting with a clean slate
 */
async function simpleTemplateSeed() {
  console.log("🌱 Starting simple template seed...");
  
  // 1. Create Business Profile
  const [business] = await db.insert(businessProfiles).values({
    tenantId: "simple-business",
    name: "Simple Business",
    description: "A clean template business",
    industry: "General",
    size: "Small",
    timezone: "Europe/London",
    currency: "GBP",
    address: "123 Main Street, London, UK",
    phone: "+44 20 1234 5678",
    email: "hello@simple-business.com",
    website: "https://simple-business.com",
    businessType: "Template"
  }).returning();

  // 2. Create Users
  const [owner] = await db.insert(users).values({
    tenantId: "simple-business",
    username: "owner",
    password: "password123",
    role: "owner",
    firstName: "Business",
    lastName: "Owner",
    email: "owner@simple-business.com",
    isActive: true,
    phone: "+44 20 1234 5678",
    address: "123 Main Street, London, UK",
    hireDate: new Date("2024-01-01"),
    employeeId: "EMP001"
  }).returning();

  const [staff1] = await db.insert(users).values({
    tenantId: "simple-business",
    username: "alice",
    password: "password123",
    role: "staff",
    firstName: "Alice",
    lastName: "Johnson",
    email: "alice@simple-business.com",
    isActive: true,
    phone: "+44 20 1234 5679",
    address: "456 Oak Avenue, London, UK",
    hireDate: new Date("2024-02-01"),
    employeeId: "EMP002"
  }).returning();

  const [staff2] = await db.insert(users).values({
    tenantId: "simple-business",
    username: "bob",
    password: "password123",
    role: "staff",
    firstName: "Bob",
    lastName: "Smith",
    email: "bob@simple-business.com",
    isActive: true,
    phone: "+44 20 1234 5680",
    address: "789 Pine Road, London, UK",
    hireDate: new Date("2024-03-01"),
    employeeId: "EMP003"
  }).returning();

  // 3. Create Location
  const [location] = await db.insert(locations).values({
    tenantId: "simple-business",
    name: "Main Office",
    address: "123 Main Street, London, UK",
    isActive: true
  }).returning();

  // 4. Create Job Role
  const [jobRole] = await db.insert(jobRoles).values({
    tenantId: "simple-business",
    title: "Team Member",
    description: "General team member role",
    hourlyRate: "12.00",
    responsibilities: ["Customer service", "General duties"],
    requirements: ["Good communication", "Reliable"],
    isActive: true,
    legendLabel: "Team",
    legendColor: "#3B82F6",
    legendIcon: "user"
  }).returning();

  // 5. Create Basic Shift Policy
  await db.insert(shiftPolicies).values({
    tenantId: "simple-business",
    minNoticeHours: 24,
    maxAdvanceBookingDays: 30,
    allowSelfCancellation: true,
    cancellationDeadlineHours: 4,
    requireApprovalForSwaps: true,
    allowOpenShiftClaiming: true,
    resetPeriodDays: 90,
    lateGracePeriodMinutes: 10,
    clockInBufferMinutes: 15,
    clockOutBufferMinutes: 30
  });

  // 6. Create Sample Shifts for This Week
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  await db.insert(shifts).values([
    {
      tenantId: "simple-business",
      date: today.toISOString().split('T')[0],
      startTime: "09:00",
      endTime: "17:00",
      role: "Team Member",
      description: "Morning shift - Customer service",
      assignedTo: staff1.id,
      location: "Main Office",
      status: "confirmed",
      notes: "Morning shift",
      createdBy: owner.id
    },
    {
      tenantId: "simple-business",
      date: tomorrow.toISOString().split('T')[0],
      startTime: "13:00",
      endTime: "21:00",
      role: "Team Member",
      description: "Afternoon shift - General duties",
      assignedTo: staff2.id,
      location: "Main Office",
      status: "confirmed",
      notes: "Afternoon shift",
      createdBy: owner.id
    },
    {
      tenantId: "simple-business",
      date: dayAfter.toISOString().split('T')[0],
      startTime: "09:00",
      endTime: "17:00",
      role: "Team Member",
      description: "Available shift - Team support",
      location: "Main Office",
      status: "open",
      notes: "Available shift",
      createdBy: owner.id
    }
  ]);

  console.log("✅ Simple template seed completed!");
  console.log("📊 Created:");
  console.log(`   - Business: ${business.name} (tenant: ${business.tenantId})`);
  console.log(`   - Owner: ${owner.firstName} ${owner.lastName} (ID: ${owner.id})`);
  console.log(`   - Staff 1: ${staff1.firstName} ${staff1.lastName} (ID: ${staff1.id})`);
  console.log(`   - Staff 2: ${staff2.firstName} ${staff2.lastName} (ID: ${staff2.id})`);
  console.log(`   - Location: ${location.name}`);
  console.log(`   - Job Role: ${jobRole.title}`);
  console.log("   - 3 shifts (2 assigned, 1 open)");
  console.log("🎯 Template ready for use!");
}

simpleTemplateSeed()
  .then(() => {
    console.log("✅ Seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });