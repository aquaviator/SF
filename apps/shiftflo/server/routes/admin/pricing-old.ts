import type { Express } from "express";
import { db } from "../../db";
import { seatPricing, promoCodes, campaigns } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { adminAuth, requireRole } from "../../middleware/adminAuth";

export function setupAdminPricingRoutes(app: Express) {
  // GET /api/admin/pricing/seats - Get seat pricing configurations
  app.get('/api/admin/pricing/seats', adminAuth, requireRole(['super_admin', 'finance']), async (req, res) => {
    try {
      console.log('💰 FETCHING_SEAT_PRICING', { adminId: req.admin?.id, timestamp: new Date() });

      const seatPricing = await db
        .select()
        .from(seatPricing)
        .orderBy(desc(seatPricing.createdAt));

      console.log('✅ SEAT_PRICING_FETCHED', { count: seatPricing.length, timestamp: new Date() });

      res.json(seatPricing);
    } catch (error) {
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
        adminId: req.admin?.id, 
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
    } catch (error) {
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
        adminId: req.admin?.id, 
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
    } catch (error) {
      console.error('❌ SEAT_PRICING_UPDATE_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to update seat pricing' });
    }
  });

  // DELETE /api/admin/pricing/seats/:id - Delete seat pricing
  app.delete('/api/admin/pricing/seats/:id', adminAuth, requireRole(['super_admin', 'finance']), async (req, res) => {
    try {
      const pricingId = parseInt(req.params.id);
      
      console.log('🗑️ DELETING_SEAT_PRICING', { pricingId, adminId: req.admin?.id, timestamp: new Date() });

      const [deletedPricing] = await db
        .delete(seatPricing)
        .where(eq(seatPricing.id, pricingId))
        .returning();

      if (!deletedPricing) {
        return res.status(404).json({ message: 'Seat pricing not found' });
      }

      console.log('✅ SEAT_PRICING_DELETED', { pricingId, timestamp: new Date() });

      res.json({ message: 'Seat pricing deleted successfully' });
    } catch (error) {
      console.error('❌ SEAT_PRICING_DELETE_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to delete seat pricing' });
    }
  });

  // GET /api/admin/pricing/promo-codes - Get promo codes
  app.get('/api/admin/pricing/promo-codes', adminAuth, requireRole(['super_admin', 'marketing', 'finance']), async (req, res) => {
    try {
      console.log('🎫 FETCHING_PROMO_CODES', { adminId: req.admin?.id, timestamp: new Date() });

      const promoCodes = await db
        .select()
        .from(promoCodes)
        .orderBy(desc(promoCodes.createdAt));

      console.log('✅ PROMO_CODES_FETCHED', { count: promoCodes.length, timestamp: new Date() });

      res.json(promoCodes);
    } catch (error) {
      console.error('❌ PROMO_CODES_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to fetch promo codes' });
    }
  });

  // GET /api/admin/pricing/campaigns - Get marketing campaigns
  app.get('/api/admin/pricing/campaigns', adminAuth, requireRole(['super_admin', 'marketing']), async (req, res) => {
    try {
      console.log('📢 FETCHING_CAMPAIGNS', { adminId: req.admin?.id, timestamp: new Date() });

      const campaignList = await db
        .select()
        .from(campaigns)
        .orderBy(desc(campaigns.createdAt));

      console.log('✅ CAMPAIGNS_FETCHED', { count: campaignList.length, timestamp: new Date() });

      res.json(campaignList);
    } catch (error) {
      console.error('❌ CAMPAIGNS_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to fetch campaigns' });
    }
  });
}
    } catch (error) {
      console.error('❌ SEAT_PRICING_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to fetch seat pricing' });
    }
  });

  // POST /api/admin/pricing/seats
  app.post('/api/admin/pricing/seats', adminAuth, requireRole(['super_admin', 'finance']), async (req, res) => {
    try {
      const { pricePerSeat, features, isActive = true } = req.body;

      console.log('💰 CREATING_SEAT_PRICING', { 
        pricePerSeat, 
        featuresCount: features?.length,
        adminId: req.admin?.id,
        timestamp: new Date() 
      });

      if (!pricePerSeat || !features || !Array.isArray(features)) {
        return res.status(400).json({ message: 'Price per seat and features are required' });
      }

      // Deactivate existing pricing if this is being set as active
      if (isActive) {
        await db.update(seatPricing)
          .set({ isActive: false })
          .where(eq(seatPricing.isActive, true));
      }

      const [newPricing] = await db.insert(seatPricing).values({
        pricePerSeat: Number(pricePerSeat),
        features,
        isActive
      }).returning();

      console.log('✅ SEAT_PRICING_CREATED', { 
        pricingId: newPricing.id,
        pricePerSeat: newPricing.pricePerSeat,
        timestamp: new Date() 
      });

      res.status(201).json(newPricing);
    } catch (error) {
      console.error('❌ CREATE_SEAT_PRICING_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to create seat pricing' });
    }
  });

  // PUT /api/admin/pricing/seats/:id
  app.put('/api/admin/pricing/seats/:id', adminAuth, requireRole(['super_admin', 'finance']), async (req, res) => {
    try {
      const { id } = req.params;
      const { pricePerSeat, features, isActive } = req.body;

      console.log('💰 UPDATING_SEAT_PRICING', { 
        pricingId: id,
        pricePerSeat,
        isActive,
        adminId: req.admin?.id,
        timestamp: new Date() 
      });

      const updates: any = {};
      if (pricePerSeat !== undefined) updates.pricePerSeat = Number(pricePerSeat);
      if (features !== undefined) updates.features = features;
      if (isActive !== undefined) {
        updates.isActive = isActive;
        
        // If setting this as active, deactivate others
        if (isActive) {
          await db.update(seatPricing)
            .set({ isActive: false })
            .where(eq(seatPricing.isActive, true));
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
      }

      updates.updatedAt = new Date();

      const [updatedPricing] = await db.update(seatPricing)
        .set(updates)
        .where(eq(seatPricing.id, Number(id)))
        .returning();

      if (!updatedPricing) {
        return res.status(404).json({ message: 'Seat pricing not found' });
      }

      console.log('✅ SEAT_PRICING_UPDATED', { 
        pricingId: updatedPricing.id,
        timestamp: new Date() 
      });

      res.json(updatedPricing);
    } catch (error) {
      console.error('❌ UPDATE_SEAT_PRICING_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to update seat pricing' });
    }
  });

  // DELETE /api/admin/pricing/seats/:id
  app.delete('/api/admin/pricing/seats/:id', adminAuth, requireRole(['super_admin', 'finance']), async (req, res) => {
    try {
      const { id } = req.params;

      console.log('💰 DELETING_SEAT_PRICING', { 
        pricingId: id,
        adminId: req.admin?.id,
        timestamp: new Date() 
      });

      const [deletedPricing] = await db.delete(seatPricing)
        .where(eq(seatPricing.id, Number(id)))
        .returning();

      if (!deletedPricing) {
        return res.status(404).json({ message: 'Seat pricing not found' });
      }

      console.log('✅ SEAT_PRICING_DELETED', { 
        pricingId: deletedPricing.id,
        timestamp: new Date() 
      });

      res.json({ message: 'Seat pricing deleted successfully' });
    } catch (error) {
      console.error('❌ DELETE_SEAT_PRICING_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to delete seat pricing' });
    }
  });

  // GET /api/admin/pricing/promo-codes
  app.get('/api/admin/pricing/promo-codes', adminAuth, requireRole(['super_admin', 'finance', 'marketing']), async (req, res) => {
    try {
      console.log('🎟️ FETCHING_PROMO_CODES', { adminId: req.admin?.id, timestamp: new Date() });

      const promoCodes = await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));

      console.log('✅ PROMO_CODES_FETCHED', { count: promoCodes.length, timestamp: new Date() });
      res.json(promoCodes);
    } catch (error) {
      console.error('❌ PROMO_CODES_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to fetch promo codes' });
    }
  });

  // POST /api/admin/pricing/promo-codes
  app.post('/api/admin/pricing/promo-codes', adminAuth, requireRole(['super_admin', 'finance', 'marketing']), async (req, res) => {
    try {
      const { 
        code, 
        discountType, 
        discountValue, 
        validFrom, 
        validTo, 
        usageLimit,
        tenantRestrictions,
        isActive = true 
      } = req.body;

      console.log('🎟️ CREATING_PROMO_CODE', { 
        code,
        discountType,
        discountValue,
        adminId: req.admin?.id,
        timestamp: new Date() 
      });

      if (!code || !discountType || !discountValue || !validFrom || !validTo) {
        return res.status(400).json({ message: 'Required fields: code, discountType, discountValue, validFrom, validTo' });
      }

      const [newPromoCode] = await db.insert(promoCodes).values({
        code: code.toUpperCase(),
        discountType,
        discountValue: String(discountValue),
        validFrom: new Date(validFrom),
        validTo: new Date(validTo),
        usageLimit: usageLimit ? Number(usageLimit) : null,
        tenantRestrictions: tenantRestrictions || [],
        isActive,
        timesUsed: 0
      }).returning();

      console.log('✅ PROMO_CODE_CREATED', { 
        promoId: newPromoCode.id,
        code: newPromoCode.code,
        timestamp: new Date() 
      });

      res.status(201).json(newPromoCode);
    } catch (error) {
      console.error('❌ CREATE_PROMO_CODE_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to create promo code' });
    }
  });

  // PUT /api/admin/pricing/promo-codes/:id
  app.put('/api/admin/pricing/promo-codes/:id', adminAuth, requireRole(['super_admin', 'finance', 'marketing']), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      console.log('🎟️ UPDATING_PROMO_CODE', { 
        promoId: id,
        updates: Object.keys(updates),
        adminId: req.admin?.id,
        timestamp: new Date() 
      });

      // Convert date fields
      if (updates.validFrom) updates.validFrom = new Date(updates.validFrom);
      if (updates.validTo) updates.validTo = new Date(updates.validTo);
      if (updates.code) updates.code = updates.code.toUpperCase();

      const [updatedPromoCode] = await db.update(promoCodes)
        .set(updates)
        .where(eq(promoCodes.id, Number(id)))
        .returning();

      if (!updatedPromoCode) {
        return res.status(404).json({ message: 'Promo code not found' });
      }

      console.log('✅ PROMO_CODE_UPDATED', { 
        promoId: updatedPromoCode.id,
        code: updatedPromoCode.code,
        timestamp: new Date() 
      });

      res.json(updatedPromoCode);
    } catch (error) {
      console.error('❌ UPDATE_PROMO_CODE_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to update promo code' });
    }
  });

  // DELETE /api/admin/pricing/promo-codes/:id
  app.delete('/api/admin/pricing/promo-codes/:id', adminAuth, requireRole(['super_admin', 'finance', 'marketing']), async (req, res) => {
    try {
      const { id } = req.params;

      console.log('🎟️ DELETING_PROMO_CODE', { 
        promoId: id,
        adminId: req.admin?.id,
        timestamp: new Date() 
      });

      const [deletedPromoCode] = await db.delete(promoCodes)
        .where(eq(promoCodes.id, Number(id)))
        .returning();

      if (!deletedPromoCode) {
        return res.status(404).json({ message: 'Promo code not found' });
      }

      console.log('✅ PROMO_CODE_DELETED', { 
        promoId: deletedPromoCode.id,
        code: deletedPromoCode.code,
        timestamp: new Date() 
      });

      res.json({ message: 'Promo code deleted successfully' });
    } catch (error) {
      console.error('❌ DELETE_PROMO_CODE_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to delete promo code' });
    }
  });

  // GET /api/admin/pricing/campaigns
  app.get('/api/admin/pricing/campaigns', adminAuth, requireRole(['super_admin', 'marketing']), async (req, res) => {
    try {
      console.log('📢 FETCHING_CAMPAIGNS', { adminId: req.admin?.id, timestamp: new Date() });

      const campaignList = await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));

      console.log('✅ CAMPAIGNS_FETCHED', { count: campaignList.length, timestamp: new Date() });
      res.json(campaignList);
    } catch (error) {
      console.error('❌ CAMPAIGNS_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to fetch campaigns' });
    }
  });

  // POST /api/admin/pricing/campaigns
  app.post('/api/admin/pricing/campaigns', adminAuth, requireRole(['super_admin', 'marketing']), async (req, res) => {
    try {
      const { 
        name, 
        description, 
        trialDays = 14, 
        defaultSeats = 5, 
        pricePerSeat = 300,
        startDate,
        endDate,
        isActive = true 
      } = req.body;

      console.log('📢 CREATING_CAMPAIGN', { 
        name,
        trialDays,
        pricePerSeat,
        adminId: req.admin?.id,
        timestamp: new Date() 
      });

      if (!name) {
        return res.status(400).json({ message: 'Campaign name is required' });
      }

      const [newCampaign] = await db.insert(campaigns).values({
        name,
        description,
        trialDays: Number(trialDays),
        defaultSeats: Number(defaultSeats),
        pricePerSeat: Number(pricePerSeat),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive
      }).returning();

      console.log('✅ CAMPAIGN_CREATED', { 
        campaignId: newCampaign.id,
        name: newCampaign.name,
        timestamp: new Date() 
      });

      res.status(201).json(newCampaign);
    } catch (error) {
      console.error('❌ CREATE_CAMPAIGN_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to create campaign' });
    }
  });

  // PUT /api/admin/pricing/campaigns/:id
  app.put('/api/admin/pricing/campaigns/:id', adminAuth, requireRole(['super_admin', 'marketing']), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      console.log('📢 UPDATING_CAMPAIGN', { 
        campaignId: id,
        updates: Object.keys(updates),
        adminId: req.admin?.id,
        timestamp: new Date() 
      });

      // Convert date fields
      if (updates.startDate) updates.startDate = new Date(updates.startDate);
      if (updates.endDate) updates.endDate = new Date(updates.endDate);
      updates.updatedAt = new Date();

      const [updatedCampaign] = await db.update(campaigns)
        .set(updates)
        .where(eq(campaigns.id, Number(id)))
        .returning();

      if (!updatedCampaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      console.log('✅ CAMPAIGN_UPDATED', { 
        campaignId: updatedCampaign.id,
        name: updatedCampaign.name,
        timestamp: new Date() 
      });

      res.json(updatedCampaign);
    } catch (error) {
      console.error('❌ UPDATE_CAMPAIGN_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to update campaign' });
    }
  });

  // DELETE /api/admin/pricing/campaigns/:id
  app.delete('/api/admin/pricing/campaigns/:id', adminAuth, requireRole(['super_admin', 'marketing']), async (req, res) => {
    try {
      const { id } = req.params;

      console.log('📢 DELETING_CAMPAIGN', { 
        campaignId: id,
        adminId: req.admin?.id,
        timestamp: new Date() 
      });

      const [deletedCampaign] = await db.delete(campaigns)
        .where(eq(campaigns.id, Number(id)))
        .returning();

      if (!deletedCampaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      console.log('✅ CAMPAIGN_DELETED', { 
        campaignId: deletedCampaign.id,
        name: deletedCampaign.name,
        timestamp: new Date() 
      });

      res.json({ message: 'Campaign deleted successfully' });
    } catch (error) {
      console.error('❌ DELETE_CAMPAIGN_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to delete campaign' });
    }
  });
}