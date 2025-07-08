#!/usr/bin/env tsx

import { db } from "../server/db";
import { staffStrikes } from "@shared/schema";

/**
 * Add test strikes to demonstrate the strike system functionality
 */
async function addTestStrikes() {
  console.log("🏗️ ADDING_TEST_STRIKES: Creating sample strikes for demo...");
  
  try {
    // Add some test strikes for user ID 1 (Sarah Wilson)
    const testStrikes = [
      {
        tenantId: "acme-corp",
        userId: 1,
        reason: "no_show" as const,
        points: 2,
        isActive: true,
        issuedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        expiresAt: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000), // 85 days from now
        notes: "Failed to show up for morning shift",
        shiftId: 172
      },
      {
        tenantId: "acme-corp", 
        userId: 1,
        reason: "late_cancellation" as const,
        points: 1,
        isActive: true,
        issuedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        expiresAt: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000), // 80 days from now
        notes: "Cancelled shift with only 30 minutes notice"
      },
      {
        tenantId: "acme-corp",
        userId: 1, 
        reason: "no_show" as const,
        points: 2,
        isActive: false, // This one has expired
        issuedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
        expiresAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Expired 10 days ago
        notes: "Old strike - now expired"
      }
    ];

    const insertedStrikes = await db.insert(staffStrikes).values(testStrikes).returning();
    
    console.log("✅ TEST_STRIKES_ADDED:", {
      totalAdded: insertedStrikes.length,
      activeStrikes: insertedStrikes.filter(s => s.isActive).length,
      totalPoints: insertedStrikes.filter(s => s.isActive).reduce((sum, s) => sum + s.points, 0),
      timestamp: new Date()
    });

    console.log("🎯 Strike Summary:");
    insertedStrikes.forEach((strike) => {
      console.log(`  - ${strike.reason} (${strike.points} pts) - ${strike.isActive ? 'Active' : 'Expired'}`);
    });

    console.log("\n🔄 Refresh the My Strikes tab to see the new data!");
    
  } catch (error) {
    console.error("❌ FAILED_TO_ADD_TEST_STRIKES:", error);
  }
}

// Run the script
addTestStrikes().then(() => {
  console.log("✨ Test strike addition complete!");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Script failed:", error);
  process.exit(1);
});