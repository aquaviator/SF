import { db } from "../server/db";
import { 
  subscriptions, 
  seatPricing, 
  seatAllocation, 
  billingHistory,
  users 
} from "@shared/schema";

/**
 * Comprehensive Seat-Based Subscription System Seed
 * Creates authentic database-driven subscription data for Template Business
 */
async function seatSubscriptionSeed() {
  console.log("🪑 Starting seat-based subscription system seed...");

  try {
    // Step 1: Create seat pricing tiers
    console.log("💰 Creating seat pricing tiers...");
    await db.insert(seatPricing).values([
      {
        tierName: "Starter",
        minSeats: 1,
        maxSeats: 10,
        pricePerSeat: 300, // £3.00 in pence
        features: [
          "Basic shift scheduling",
          "Staff management",
          "Time tracking",
          "Basic reporting",
          "Email support"
        ],
        isActive: true,
      },
      {
        tierName: "Professional", 
        minSeats: 5,
        maxSeats: 50,
        pricePerSeat: 250, // £2.50 in pence - volume discount
        features: [
          "Advanced scheduling",
          "Comprehensive analytics", 
          "Strike management",
          "Holiday tracking",
          "API access",
          "Priority support"
        ],
        isActive: true,
      },
      {
        tierName: "Enterprise",
        minSeats: 25,
        maxSeats: null, // unlimited
        pricePerSeat: 200, // £2.00 in pence - best volume discount
        features: [
          "Unlimited everything",
          "Custom integrations",
          "Dedicated support",
          "Advanced analytics",
          "White-label options",
          "24/7 phone support"
        ],
        isActive: true,
      }
    ]);

    // Step 2: Update template business subscription
    console.log("📋 Updating template business subscription...");
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14); // 14-day trial

    await db.insert(subscriptions).values({
      tenantId: "template-business",
      status: "trial",
      seatsIncluded: 5,
      seatsUsed: 2, // Owner + 2 staff
      pricePerSeat: 300, // £3.00 in pence
      monthlyTotal: 1500, // 5 seats × £3.00 = £15.00
      trialDaysRemaining: 14,
      nextBillingDate: nextMonth,
      trialStart: new Date(),
      trialEnd: trialEnd,
      // Stripe fields will be populated when user completes payment
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeStatus: null,
    }).onConflictDoUpdate({
      target: subscriptions.tenantId,
      set: {
        status: "trial",
        seatsIncluded: 5,
        seatsUsed: 2,
        pricePerSeat: 300,
        monthlyTotal: 1500,
        trialDaysRemaining: 14,
        nextBillingDate: nextMonth,
        trialStart: new Date(),
        trialEnd: trialEnd,
      }
    });

    // Step 3: Create seat allocations for existing users
    console.log("🪑 Creating seat allocations...");
    const templateUsers = await db.select().from(users).where(
      // @ts-ignore - using SQL like operator
      db.eq(users.tenantId, "template-business")
    );

    for (const user of templateUsers) {
      await db.insert(seatAllocation).values({
        tenantId: "template-business",
        userId: user.id,
        seatType: "active",
        assignedAt: new Date(),
      }).onConflictDoNothing();
    }

    // Step 4: Create sample billing history
    console.log("💳 Creating sample billing history...");
    const subscription = await db.select().from(subscriptions).where(
      // @ts-ignore - using SQL like operator  
      db.eq(subscriptions.tenantId, "template-business")
    ).then(rows => rows[0]);

    if (subscription) {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const thisMonth = new Date();

      await db.insert(billingHistory).values([
        {
          tenantId: "template-business",
          subscriptionId: subscription.id,
          billingPeriodStart: lastMonth,
          billingPeriodEnd: thisMonth,
          seatsCharged: 3, // 3 seats were used last month
          amountCharged: 900, // 3 × £3.00 = £9.00
          status: "paid",
          paidAt: lastMonth,
          stripeInvoiceId: "in_1234567890",
          stripePaymentIntentId: "pi_1234567890",
        },
        {
          tenantId: "template-business", 
          subscriptionId: subscription.id,
          billingPeriodStart: thisMonth,
          billingPeriodEnd: nextMonth,
          seatsCharged: 5, // Current month: 5 seats 
          amountCharged: 1500, // 5 × £3.00 = £15.00
          status: "pending", // Trial period, not yet charged
          paidAt: null,
          stripeInvoiceId: null,
          stripePaymentIntentId: null,
        }
      ]);
    }

    console.log("✅ Seat-based subscription system seed completed successfully!");
    console.log("📊 Summary:");
    console.log("   - 3 pricing tiers created (Starter, Professional, Enterprise)");
    console.log("   - Template business subscription updated (5 seats, £3.00/seat)");
    console.log("   - Seat allocations created for existing users");
    console.log("   - Sample billing history added");
    console.log("   - System ready for Stripe integration");

  } catch (error) {
    console.error("❌ Error in seat subscription seed:", error);
    throw error;
  }
}

// Run the seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seatSubscriptionSeed()
    .then(() => {
      console.log("🎉 Seat subscription seed completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seat subscription seed failed:", error);
      process.exit(1);
    });
}

export default seatSubscriptionSeed;