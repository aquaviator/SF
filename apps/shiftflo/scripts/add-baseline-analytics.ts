import { storage } from "../server/storage";

/**
 * Add baseline analytics and subscription data for Template Business
 * This provides meaningful analytics even for empty template
 */
async function addBaselineAnalytics() {
  console.log("🔄 Adding baseline analytics data...");
  
  const tenantId = "template-business";
  
  try {
    // Add basic subscription plan
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

    // Create a trial subscription for the template business
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
    await storage.createUsageMetrics({
      tenantId,
      staffCount: 3, // Owner + 2 staff
      shiftsCount: 0,
      storageUsed: "0.1GB",
      lastUpdated: new Date(),
    });

    // Add sample analytics reports
    await storage.createAnalyticsReport({
      tenantId,
      name: "Monthly Labor Cost Report",
      reportType: "labor_cost",
      dataPoints: JSON.stringify([
        { month: "Jan", cost: 0, budget: 0 },
        { month: "Feb", cost: 0, budget: 0 },
        { month: "Mar", cost: 0, budget: 0 },
        { month: "Apr", cost: 0, budget: 0 },
        { month: "May", cost: 0, budget: 0 },
        { month: "Jun", cost: 0, budget: 0 },
      ]),
      createdBy: 16, // Business Owner user ID
      status: "ready",
      filePath: null,
    });

    console.log("✅ Baseline analytics data added successfully");
    
  } catch (error) {
    console.error("❌ Error adding baseline analytics:", error);
    throw error;
  }
}

// Run the script
addBaselineAnalytics()
  .then(() => {
    console.log("🎉 Baseline analytics setup completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Failed to add baseline analytics:", error);
    process.exit(1);
  });