import { db } from "../server/db";
import { 
  users, shifts, opportunities, swapRequests, assignments, 
  holidayRequests, activityLogs, businessProfiles, locations,
  jobRoles, departments, shiftPolicies, timeEntries, staffStrikes,
  analyticsReports, analyticsMetrics, subscriptions, subscriptionPlans,
  usageMetrics, invoices, billingInfo, performanceMetrics,
  scheduleTemplates, holidayEntitlements
} from "../shared/schema";

/**
 * Complete database reset - removes all data from all tables
 */
async function cleanReset() {
  try {
    console.log('🗑️ Starting complete database reset...');

    // Delete all data from tables in correct order (respecting foreign keys)
    await db.delete(timeEntries);
    await db.delete(staffStrikes);
    await db.delete(activityLogs);
    await db.delete(swapRequests);
    await db.delete(holidayRequests);
    await db.delete(assignments);
    await db.delete(opportunities);
    await db.delete(shifts);
    await db.delete(scheduleTemplates);
    await db.delete(holidayEntitlements);
    await db.delete(performanceMetrics);
    await db.delete(usageMetrics);
    await db.delete(invoices);
    await db.delete(billingInfo);
    await db.delete(subscriptions);
    await db.delete(subscriptionPlans);
    await db.delete(analyticsMetrics);
    await db.delete(analyticsReports);
    await db.delete(shiftPolicies);
    await db.delete(departments);
    await db.delete(jobRoles);
    await db.delete(locations);
    await db.delete(businessProfiles);
    await db.delete(users);

    console.log('✅ All tables cleared successfully');

    // Create minimal setup: 1 business, 1 owner, 2 staff
    console.log('👥 Creating minimal business setup...');

    // 1. Create owner user
    const [owner] = await db.insert(users).values({
      tenantId: "clean-business",
      username: "owner.admin",
      password: "password123",
      role: "owner",
      firstName: "Business",
      lastName: "Owner",
      email: "owner@clean-business.com",
      isActive: true,
    }).returning();

    // 2. Create two staff members
    const [staff1] = await db.insert(users).values({
      tenantId: "clean-business", 
      username: "staff.alice",
      password: "password123",
      role: "staff",
      firstName: "Alice",
      lastName: "Johnson",
      email: "alice@clean-business.com",
      isActive: true,
    }).returning();

    const [staff2] = await db.insert(users).values({
      tenantId: "clean-business",
      username: "staff.bob", 
      password: "password123",
      role: "staff",
      firstName: "Bob",
      lastName: "Smith",
      email: "bob@clean-business.com",
      isActive: true,
    }).returning();

    // 3. Create business profile
    await db.insert(businessProfiles).values({
      tenantId: "clean-business",
      name: "Clean Business Ltd",
      industry: "General",
      description: "Clean testing business",
      ownerName: `${owner.firstName} ${owner.lastName}`,
      contactEmail: owner.email,
      phone: "+1-555-0123",
      address: "123 Business Street",
    });

    // 4. Create basic location
    await db.insert(locations).values({
      tenantId: "clean-business",
      name: "Main Office",
      address: "123 Business Street",
      capacity: 50,
    });

    // 5. Create basic job role
    await db.insert(jobRoles).values({
      tenantId: "clean-business", 
      title: "General Staff",
      description: "General staff member",
      hourlyRate: 15.00,
      requirements: null,
    });

    console.log('✅ Clean database setup complete!');
    console.log('📊 Created:');
    console.log(`   - Business: Clean Business Ltd (tenant: clean-business)`);
    console.log(`   - Owner: ${owner.firstName} ${owner.lastName} (ID: ${owner.id})`);
    console.log(`   - Staff 1: ${staff1.firstName} ${staff1.lastName} (ID: ${staff1.id})`);
    console.log(`   - Staff 2: ${staff2.firstName} ${staff2.lastName} (ID: ${staff2.id})`);
    console.log(`   - 1 Location: Main Office`);
    console.log(`   - 1 Job Role: General Staff`);
    console.log('🎯 Database is now clean and ready for testing!');

  } catch (error) {
    console.error('❌ Error during database reset:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run the reset
cleanReset();