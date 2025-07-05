import { storage } from "../server/storage";

/**
 * Populate all missing template data for complete functionality
 */
async function populateTemplateData() {
  console.log("🔄 Populating template business data...");
  
  const tenantId = "template-business";
  const ownerId = 16; // Business Owner
  const staff1Id = 17; // Alice Johnson  
  const staff2Id = 18; // Bob Smith
  
  try {
    // Add subscription plans first
    console.log("📦 Adding subscription plans...");
    await storage.createSubscriptionPlan({
      id: "starter",
      name: "Starter",
      type: "starter" as const,
      monthlyPrice: 29,
      annualPrice: 290,
      features: '["Up to 5 staff members", "Basic scheduling", "Mobile app access", "Email support"]',
      staffLimit: 5,
      shiftsLimit: 100,
      storageLimit: "1GB",
      isActive: true,
    });

    await storage.createSubscriptionPlan({
      id: "professional", 
      name: "Professional",
      type: "professional" as const,
      monthlyPrice: 49,
      annualPrice: 490,
      features: '["Up to 25 staff members", "Advanced scheduling", "Time tracking", "Analytics & reporting", "Priority support"]',
      staffLimit: 25,
      shiftsLimit: 500,
      storageLimit: "10GB",
      isActive: true,
    });

    // Create subscription for template business
    console.log("💳 Creating subscription...");
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14); // 14-day trial

    await storage.createSubscription({
      tenantId,
      planId: "starter",
      status: "trial",
      startDate,
      endDate,
      trialDaysRemaining: 14,
    });

    // Add usage metrics
    console.log("📊 Adding usage metrics...");
    await storage.createUsageMetrics({
      tenantId,
      staffCount: 3, // Owner + 2 staff
      shiftsCount: 0,
      storageUsed: "0.1GB",
      lastUpdated: new Date(),
    });

    // Add billing info
    console.log("💰 Adding billing info...");
    await storage.createBillingInfo({
      tenantId,
      companyName: "Template Business",
      email: "billing@template-business.com",
      address: "123 Business Street",
      city: "Business City",
      postalCode: "BC1 2AB",
      country: "United Kingdom",
      vatNumber: null,
    });

    // Add some invoices
    console.log("🧾 Adding sample invoices...");
    await storage.createInvoice({
      tenantId,
      invoiceNumber: "INV-2025-001",
      amount: 29.00,
      status: "paid",
      dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      description: "Starter Plan - January 2025",
      filePath: null,
    });

    await storage.createInvoice({
      tenantId,
      invoiceNumber: "INV-2025-002", 
      amount: 29.00,
      status: "pending",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      description: "Starter Plan - February 2025",
      filePath: null,
    });

    // Add performance metrics for staff
    console.log("📈 Adding performance metrics...");
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    
    await storage.createPerformanceMetrics({
      tenantId,
      userId: staff1Id,
      metricType: "attendance",
      value: 95.5,
      period: "monthly",
      date: lastMonth,
    });

    await storage.createPerformanceMetrics({
      tenantId,
      userId: staff1Id,
      metricType: "punctuality",
      value: 92.0,
      period: "monthly", 
      date: lastMonth,
    });

    await storage.createPerformanceMetrics({
      tenantId,
      userId: staff2Id,
      metricType: "attendance",
      value: 88.5,
      period: "monthly",
      date: lastMonth,
    });

    await storage.createPerformanceMetrics({
      tenantId,
      userId: staff2Id,
      metricType: "punctuality",
      value: 90.0,
      period: "monthly",
      date: lastMonth,
    });

    // Add analytics reports
    console.log("📊 Adding analytics reports...");
    await storage.createAnalyticsReport({
      tenantId,
      name: "Monthly Labor Cost Report",
      reportType: "labor_cost",
      dataPoints: '[]', // Empty for template
      createdBy: ownerId,
      status: "ready",
      filePath: null,
    });

    await storage.createAnalyticsReport({
      tenantId,
      name: "Staff Performance Summary", 
      reportType: "performance",
      dataPoints: '[]',
      createdBy: ownerId,
      status: "ready",
      filePath: null,
    });

    // Add analytics metrics for baseline charts
    console.log("📈 Adding analytics metrics...");
    await storage.createAnalyticsMetrics({
      tenantId,
      metricType: "labor_cost",
      value: 0,
      period: "monthly",
      date: new Date(),
    });

    await storage.createAnalyticsMetrics({
      tenantId,
      metricType: "fill_rate",
      value: 0,
      period: "monthly", 
      date: new Date(),
    });

    await storage.createAnalyticsMetrics({
      tenantId,
      metricType: "overtime_hours",
      value: 0,
      period: "weekly",
      date: new Date(),
    });

    // Add activity logs for recent activity
    console.log("📝 Adding activity logs...");
    await storage.createActivityLog({
      tenantId,
      userId: ownerId,
      action: "Business profile created",
      description: "Initial business setup completed",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    });

    await storage.createActivityLog({
      tenantId,
      userId: ownerId,
      action: "Staff members added",
      description: "Added Alice Johnson and Bob Smith to team",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    });

    await storage.createActivityLog({
      tenantId,
      userId: ownerId,
      action: "Trial subscription activated",
      description: "14-day Starter plan trial begins",
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    });

    console.log("✅ Template data population completed successfully");
    
  } catch (error) {
    console.error("❌ Error populating template data:", error);
    throw error;
  }
}

// Run the script
populateTemplateData()
  .then(() => {
    console.log("🎉 Template business data ready for deployment");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Failed to populate template data:", error);
    process.exit(1);
  });