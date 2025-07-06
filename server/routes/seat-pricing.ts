import type { Express } from "express";
import { db } from "../db";
import { seatPricing } from "@shared/schema";
import { eq } from "drizzle-orm";

export function setupSeatPricingRoutes(app: Express) {
  // GET /api/seat-pricing - Public endpoint for seat pricing
  app.get('/api/seat-pricing', async (req, res) => {
    try {
      const [pricing] = await db.select().from(seatPricing).where(eq(seatPricing.isActive, true));
      
      if (!pricing) {
        return res.status(404).json({ message: "No active seat pricing found" });
      }

      // Return only the essential pricing data for public consumption
      res.json({
        price_per_seat: pricing.pricePerSeat,
        features: pricing.features
      });
    } catch (error) {
      console.error("Error fetching public seat pricing:", error);
      res.status(500).json({ message: "Failed to fetch seat pricing" });
    }
  });
}