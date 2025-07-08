import type { Express } from "express";
import { db } from "../../db";
import { domainConfig } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { adminAuth, requireRole } from "../../middleware/adminAuth";

export function setupAdminDomainRoutes(app: Express) {
  // GET /api/admin/domains - Get domain configurations
  app.get('/api/admin/domains', adminAuth, requireRole(['super_admin']), async (req, res) => {
    try {
      console.log('🌐 FETCHING_DOMAINS', { adminId: (req as any).admin?.id, timestamp: new Date() });

      const domains = await db
        .select()
        .from(domainConfig)
        .orderBy(desc(domainConfig.createdAt));

      console.log('✅ DOMAINS_FETCHED', { count: domains.length, timestamp: new Date() });

      res.json(domains);
    } catch (error: any) {
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
        adminId: (req as any).admin?.id, 
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
    } catch (error: any) {
      console.error('❌ DOMAIN_CREATE_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to create domain configuration' });
    }
  });
}