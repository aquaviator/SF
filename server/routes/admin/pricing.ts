import type { Express } from "express";
import { db } from "../../db";
import { seatPricing, promoCodes, campaigns } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { adminAuth, requireRole } from "../../middleware/adminAuth";

export function setupAdminPricingRoutes(app: Express) {
  // GET /api/admin/pricing/seats - Get seat pricing configurations
  app.get('/api/admin/pricing/seats', adminAuth, requireRole(['super_admin', 'finance']), async (req, res) => {
    try {
      console.log('💰 FETCHING_SEAT_PRICING', { adminId: (req as any).admin?.id, timestamp: new Date() });

      const pricing = await db
        .select()
        .from(seatPricing)
        .orderBy(desc(seatPricing.createdAt));

      console.log('✅ SEAT_PRICING_FETCHED', { count: pricing.length, timestamp: new Date() });

      res.json(pricing);
    } catch (error: any) {
      console.error('❌ SEAT_PRICING_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to fetch seat pricing' });
    }
  });

  // POST /api/admin/pricing/seats - Create new seat pricing
  app.post('/api/admin/pricing/seats', adminAuth, requireRole(['super_admin', 'finance']), async (req, res) => {
    try {
      const { pricePerSeat, features, isActive } = req.body;
      
      console.log('💰 CREATING_SEAT_PRICING', { 
        pricePerSeat, 
        featuresCount: features?.length,
        adminId: (req as any).admin?.id, 
        timestamp: new Date() 
      });

      const [newPricing] = await db
        .insert(seatPricing)
        .values({
          pricePerSeat,
          features,
          isActive: isActive ?? true,
        })
        .returning();

      console.log('✅ SEAT_PRICING_CREATED', { pricingId: newPricing.id, timestamp: new Date() });

      res.status(201).json(newPricing);
    } catch (error: any) {
      console.error('❌ SEAT_PRICING_CREATE_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to create seat pricing' });
    }
  });

  // PUT /api/admin/pricing/seats/:id - Update seat pricing
  app.put('/api/admin/pricing/seats/:id', adminAuth, requireRole(['super_admin', 'finance']), async (req, res) => {
    try {
      const pricingId = parseInt(req.params.id);
      const { pricePerSeat, features, isActive } = req.body;
      
      console.log('💰 UPDATING_SEAT_PRICING', { 
        pricingId, 
        pricePerSeat,
        adminId: (req as any).admin?.id, 
        timestamp: new Date() 
      });

      const [updatedPricing] = await db
        .update(seatPricing)
        .set({
          pricePerSeat,
          features,
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(seatPricing.id, pricingId))
        .returning();

      if (!updatedPricing) {
        return res.status(404).json({ message: 'Seat pricing not found' });
      }

      console.log('✅ SEAT_PRICING_UPDATED', { pricingId, timestamp: new Date() });

      res.json(updatedPricing);
    } catch (error: any) {
      console.error('❌ SEAT_PRICING_UPDATE_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to update seat pricing' });
    }
  });

  // DELETE /api/admin/pricing/seats/:id - Delete seat pricing
  app.delete('/api/admin/pricing/seats/:id', adminAuth, requireRole(['super_admin', 'finance']), async (req, res) => {
    try {
      const pricingId = parseInt(req.params.id);
      
      console.log('🗑️ DELETING_SEAT_PRICING', { pricingId, adminId: (req as any).admin?.id, timestamp: new Date() });

      const [deletedPricing] = await db
        .delete(seatPricing)
        .where(eq(seatPricing.id, pricingId))
        .returning();

      if (!deletedPricing) {
        return res.status(404).json({ message: 'Seat pricing not found' });
      }

      console.log('✅ SEAT_PRICING_DELETED', { pricingId, timestamp: new Date() });

      res.json({ message: 'Seat pricing deleted successfully' });
    } catch (error: any) {
      console.error('❌ SEAT_PRICING_DELETE_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to delete seat pricing' });
    }
  });

  // GET /api/admin/pricing/promo-codes - Get promo codes
  app.get('/api/admin/pricing/promo-codes', adminAuth, requireRole(['super_admin', 'marketing', 'finance']), async (req, res) => {
    try {
      console.log('🎫 FETCHING_PROMO_CODES', { adminId: (req as any).admin?.id, timestamp: new Date() });

      const promoCodesList = await db
        .select()
        .from(promoCodes)
        .orderBy(desc(promoCodes.createdAt));

      console.log('✅ PROMO_CODES_FETCHED', { count: promoCodesList.length, timestamp: new Date() });

      res.json(promoCodesList);
    } catch (error: any) {
      console.error('❌ PROMO_CODES_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to fetch promo codes' });
    }
  });

  // GET /api/admin/pricing/campaigns - Get marketing campaigns
  app.get('/api/admin/pricing/campaigns', adminAuth, requireRole(['super_admin', 'marketing']), async (req, res) => {
    try {
      console.log('📢 FETCHING_CAMPAIGNS', { adminId: (req as any).admin?.id, timestamp: new Date() });

      const campaignList = await db
        .select()
        .from(campaigns)
        .orderBy(desc(campaigns.createdAt));

      console.log('✅ CAMPAIGNS_FETCHED', { count: campaignList.length, timestamp: new Date() });

      res.json(campaignList);
    } catch (error: any) {
      console.error('❌ CAMPAIGNS_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to fetch campaigns' });
    }
  });
}