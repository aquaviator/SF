import type { Express } from "express";
import { db } from "../../db";
import { domainConfig } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { adminAuth, requireRole } from "../../middleware/adminAuth";

export function setupAdminDomainRoutes(app: Express) {
  // GET /api/admin/domains - Get domain configurations
  app.get('/api/admin/domains', adminAuth, requireRole(['super_admin']), async (req, res) => {
    try {
      console.log('🌐 FETCHING_DOMAINS', { adminId: req.admin?.id, timestamp: new Date() });

      const domains = await db
        .select()
        .from(domainConfig)
        .orderBy(desc(domainConfig.createdAt));

      console.log('✅ DOMAINS_FETCHED', { count: domains.length, timestamp: new Date() });

      res.json(domains);
    } catch (error) {
      console.error('❌ DOMAINS_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to fetch domains' });
    }
  });

  // POST /api/admin/domains - Add new domain configuration
  app.post('/api/admin/domains', adminAuth, requireRole(['super_admin']), async (req, res) => {
    try {
      const { domain, tenantId, sslEnabled, customSettings } = req.body;
      
      console.log('🌐 CREATING_DOMAIN', { 
        domain, 
        tenantId,
        adminId: req.admin?.id, 
        timestamp: new Date() 
      });

      const [newDomain] = await db
        .insert(domainConfig)
        .values({
          domain,
          tenantId,
          sslEnabled: sslEnabled ?? true,
          customSettings: customSettings || {},
          isActive: true,
        })
        .returning();

      console.log('✅ DOMAIN_CREATED', { domainId: newDomain.id, timestamp: new Date() });

      res.status(201).json(newDomain);
    } catch (error) {
      console.error('❌ DOMAIN_CREATE_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to create domain configuration' });
    }
  });
}
    } catch (error) {
      console.error('❌ DOMAINS_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to fetch domain configurations' });
    }
  });

  // POST /api/admin/domains
  app.post('/api/admin/domains', adminAuth, requireRole(['super_admin']), async (req, res) => {
    try {
      const { name, baseUrl, isActive = false } = req.body;

      console.log('🌐 CREATING_DOMAIN', { 
        name,
        baseUrl,
        isActive,
        adminId: req.admin?.id,
        timestamp: new Date() 
      });

      if (!name || !baseUrl) {
        return res.status(400).json({ message: 'Name and base URL are required' });
      }

      // Validate URL format
      try {
        new URL(baseUrl);
      } catch {
        return res.status(400).json({ message: 'Invalid URL format' });
      }

      // If setting as active, deactivate other domains
      if (isActive) {
        await db.update(domainConfig)
          .set({ isActive: false })
          .where(eq(domainConfig.isActive, true));
      }

      const [newDomain] = await db.insert(domainConfig).values({
        name,
        baseUrl,
        isActive
      }).returning();

      console.log('✅ DOMAIN_CREATED', { 
        domainId: newDomain.id,
        name: newDomain.name,
        timestamp: new Date() 
      });

      res.status(201).json(newDomain);
    } catch (error) {
      console.error('❌ CREATE_DOMAIN_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to create domain configuration' });
    }
  });

  // PUT /api/admin/domains/:id
  app.put('/api/admin/domains/:id', adminAuth, requireRole(['super_admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, baseUrl, isActive } = req.body;

      console.log('🌐 UPDATING_DOMAIN', { 
        domainId: id,
        name,
        baseUrl,
        isActive,
        adminId: req.admin?.id,
        timestamp: new Date() 
      });

      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (baseUrl !== undefined) {
        // Validate URL format
        try {
          new URL(baseUrl);
          updates.baseUrl = baseUrl;
        } catch {
          return res.status(400).json({ message: 'Invalid URL format' });
        }
      }
      if (isActive !== undefined) {
        updates.isActive = isActive;
        
        // If setting as active, deactivate other domains
        if (isActive) {
          await db.update(domainConfig)
            .set({ isActive: false })
            .where(eq(domainConfig.isActive, true));
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
      }

      const [updatedDomain] = await db.update(domainConfig)
        .set(updates)
        .where(eq(domainConfig.id, Number(id)))
        .returning();

      if (!updatedDomain) {
        return res.status(404).json({ message: 'Domain configuration not found' });
      }

      console.log('✅ DOMAIN_UPDATED', { 
        domainId: updatedDomain.id,
        name: updatedDomain.name,
        timestamp: new Date() 
      });

      res.json(updatedDomain);
    } catch (error) {
      console.error('❌ UPDATE_DOMAIN_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to update domain configuration' });
    }
  });

  // PATCH /api/admin/domains/:id/toggle
  app.patch('/api/admin/domains/:id/toggle', adminAuth, requireRole(['super_admin']), async (req, res) => {
    try {
      const { id } = req.params;

      console.log('🌐 TOGGLING_DOMAIN_STATUS', { 
        domainId: id,
        adminId: req.admin?.id,
        timestamp: new Date() 
      });

      // Get current domain
      const [currentDomain] = await db.select()
        .from(domainConfig)
        .where(eq(domainConfig.id, Number(id)));

      if (!currentDomain) {
        return res.status(404).json({ message: 'Domain configuration not found' });
      }

      const newActiveStatus = !currentDomain.isActive;

      // If activating this domain, deactivate others
      if (newActiveStatus) {
        await db.update(domainConfig)
          .set({ isActive: false })
          .where(eq(domainConfig.isActive, true));
      }

      // Update this domain
      const [updatedDomain] = await db.update(domainConfig)
        .set({ isActive: newActiveStatus })
        .where(eq(domainConfig.id, Number(id)))
        .returning();

      console.log('✅ DOMAIN_STATUS_TOGGLED', { 
        domainId: updatedDomain.id,
        newStatus: updatedDomain.isActive,
        timestamp: new Date() 
      });

      res.json(updatedDomain);
    } catch (error) {
      console.error('❌ TOGGLE_DOMAIN_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to toggle domain status' });
    }
  });

  // DELETE /api/admin/domains/:id
  app.delete('/api/admin/domains/:id', adminAuth, requireRole(['super_admin']), async (req, res) => {
    try {
      const { id } = req.params;

      console.log('🌐 DELETING_DOMAIN', { 
        domainId: id,
        adminId: req.admin?.id,
        timestamp: new Date() 
      });

      const [deletedDomain] = await db.delete(domainConfig)
        .where(eq(domainConfig.id, Number(id)))
        .returning();

      if (!deletedDomain) {
        return res.status(404).json({ message: 'Domain configuration not found' });
      }

      console.log('✅ DOMAIN_DELETED', { 
        domainId: deletedDomain.id,
        name: deletedDomain.name,
        timestamp: new Date() 
      });

      res.json({ message: 'Domain configuration deleted successfully' });
    } catch (error) {
      console.error('❌ DELETE_DOMAIN_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to delete domain configuration' });
    }
  });

  // GET /api/admin/dashboard/stats
  app.get('/api/admin/dashboard/stats', adminAuth, async (req, res) => {
    try {
      console.log('📊 FETCHING_ADMIN_DASHBOARD_STATS', { adminId: req.admin?.id, timestamp: new Date() });

      // Get basic platform statistics
      const [tenantCount] = await db.execute(`SELECT COUNT(*) as count FROM tenants`);
      const [userCount] = await db.execute(`SELECT COUNT(*) as count FROM users`);
      const [domainCount] = await db.execute(`SELECT COUNT(*) as count FROM domain_config`);
      const [subscriptionCount] = await db.execute(`SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'`);

      // Calculate revenue (mock calculation - would be more complex in real system)
      const [revenueResult] = await db.execute(`
        SELECT COALESCE(SUM(seats_included * price_per_seat), 0) as total_revenue 
        FROM subscriptions 
        WHERE status = 'active'
      `);

      const stats = {
        totalTenants: Number(tenantCount.count) || 0,
        activeTenants: Number(subscriptionCount.count) || 0,
        totalRevenue: Number(revenueResult.total_revenue) || 0,
        activeSubscriptions: Number(subscriptionCount.count) || 0,
        domainConfigs: Number(domainCount.count) || 0,
        systemHealth: "healthy" as const
      };

      console.log('✅ ADMIN_DASHBOARD_STATS_FETCHED', { stats, timestamp: new Date() });
      res.json(stats);
    } catch (error) {
      console.error('❌ ADMIN_DASHBOARD_STATS_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
    }
  });
}