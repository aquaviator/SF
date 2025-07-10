import { db } from "../server/db";
import {
  users,
  businessProfiles,
  locations,
  jobRoles,
  shiftPolicies
} from "@shared/schema";

/**
 * Empty Template Seed - Creates minimal business with NO shifts
 * Perfect for clean deployment template
 */
async function emptyTemplateSeed() {
  console.log("🌱 Starting empty template seed...");
  
  // 1. Create Business Profile
  const [business] = await db.insert(businessProfiles).values({
    tenantId: "template-business",
    name: "Template Business",
    description: "A clean template for new businesses",
    industry: "General",
    size: "Small",
    timezone: "Europe/London",
    currency: "GBP",
    address: "123 Business Street, London, UK",
    phone: "+44 20 1234 5678",
    email: "hello@template-business.com",
    website: "https://template-business.com",
    businessType: "Template"
  }).returning();

  // 2. Create Users
  const [owner] = await db.insert(users).values({
    tenantId: "template-business",
    username: "owner",
    password: "password123",
    role: "owner",
    firstName: "Business",
    lastName: "Owner",
    email: "owner@template-business.com",
    isActive: true,
    phone: "+44 20 1234 5678",
    address: "123 Business Street, London, UK",
    hireDate: new Date("2024-01-01"),
    employeeId: "EMP001"
  }).returning();

  const [staff1] = await db.insert(users).values({
    tenantId: "template-business",
    username: "alice",
    password: "password123",
    role: "staff",
    firstName: "Alice",
    lastName: "Johnson",
    email: "alice@template-business.com",
    isActive: true,
    phone: "+44 20 1234 5679",
    address: "456 Oak Avenue, London, UK",
    hireDate: new Date("2024-02-01"),
    employeeId: "EMP002"
  }).returning();

  const [staff2] = await db.insert(users).values({
    tenantId: "template-business",
    username: "bob",
    password: "password123",
    role: "staff",
    firstName: "Bob",
    lastName: "Smith",
    email: "bob@template-business.com",
    isActive: true,
    phone: "+44 20 1234 5680",
    address: "789 Pine Road, London, UK",
    hireDate: new Date("2024-03-01"),
    employeeId: "EMP003"
  }).returning();

  // 3. Create Location
  const [location] = await db.insert(locations).values({
    tenantId: "template-business",
    name: "Main Office",
    address: "123 Business Street, London, UK",
    isActive: true
  }).returning();

  // 4. Create Job Role
  const [jobRole] = await db.insert(jobRoles).values({
    tenantId: "template-business",
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
    tenantId: "template-business",
    minNoticeHours: 24,
    maxAdvanceBookingDays: 30,
    cancellationDeadlineHours: 4,
    requireApprovalForSwaps: true,
    allowOpenShiftClaiming: true,
    resetPeriodDays: 90,
    lateGracePeriodMinutes: 10,
    clockInBufferMinutes: 15,
    clockOutBufferMinutes: 30
  });

  // NO SHIFTS CREATED - Clean template

  console.log("✅ Empty template seed completed!");
  console.log("📊 Created:");
  console.log(`   - Business: ${business.name} (tenant: ${business.tenantId})`);
  console.log(`   - Owner: ${owner.firstName} ${owner.lastName} (ID: ${owner.id})`);
  console.log(`   - Staff 1: ${staff1.firstName} ${staff1.lastName} (ID: ${staff1.id})`);
  console.log(`   - Staff 2: ${staff2.firstName} ${staff2.lastName} (ID: ${staff2.id})`);
  console.log(`   - Location: ${location.name}`);
  console.log(`   - Job Role: ${jobRole.title}`);
  console.log("   - NO shifts created - clean template");
  console.log("🎯 Empty template ready for deployment!");
}

emptyTemplateSeed()
  .then(() => {
    console.log("✅ Empty seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Empty seed failed:", error);
    process.exit(1);
  });