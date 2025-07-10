import type { Express } from "express";
import { db } from "../../db";
import { seatPricing } from "@shared/schema";
import { eq } from "drizzle-orm";
import { adminAuth } from "../../middleware/adminAuth";

export function setupAdminSeatPricingRoutes(app: Express) {
  // GET /api/admin/seat-pricing - Get current seat pricing
  app.get('/api/admin/seat-pricing', adminAuth, async (req, res) => {
    try {
      const [pricing] = await db.select().from(seatPricing).where(eq(seatPricing.isActive, true));
      
      if (!pricing) {
        return res.status(404).json({ message: "No active seat pricing found" });
      }

      res.json(pricing);
    } catch (error) {
      console.error("Error fetching seat pricing:", error);
      res.status(500).json({ message: "Failed to fetch seat pricing" });
    }
  });

  // PATCH /api/admin/seat-pricing/:id - Update seat pricing
  app.patch('/api/admin/seat-pricing/:id', adminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { price_per_seat, features } = req.body;

      const updates: any = {};
      if (price_per_seat !== undefined) {
        updates.pricePerSeat = price_per_seat;
      }
      if (features !== undefined) {
        updates.features = features;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      updates.updatedAt = new Date();

      const [updated] = await db
        .update(seatPricing)
        .set(updates)
        .where(eq(seatPricing.id, parseInt(id)))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Seat pricing not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating seat pricing:", error);
      res.status(500).json({ message: "Failed to update seat pricing" });
    }
  });
}