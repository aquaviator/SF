import { storage } from "../server/storage";

/**
 * Populate template data for complete functionality (excluding Stripe subscription data)
 */
async function populateTemplateData() {
  console.log("🔄 Populating template business data...");
  
  const tenantId = "template-business";
  const ownerId = 16; // Business Owner
  const staff1Id = 17; // Alice Johnson  
  const staff2Id = 18; // Bob Smith
  
  try {

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
      action: "Template business ready",
      description: "Template business setup for deployment",
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