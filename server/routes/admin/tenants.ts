import type { Express } from "express";
import { db } from "../../db";
import { 
  tenants, 
  users, 
  subscriptions, 
  shifts, 
  timeEntries, 
  activityLogs,
  holidayRequests,
  assignments,
  swapRequests,
  businessProfiles,
  staffStrikes,
  usageMetrics,
  seatAllocation
} from "@shared/schema";
import { eq, sql, and, desc, lt } from "drizzle-orm";
import { adminAuth, requireRole } from "../../middleware/adminAuth";

export function setupAdminTenantRoutes(app: Express) {
  // GET /api/admin/tenants - List all tenants with filtering and search
  app.get('/api/admin/tenants', adminAuth, requireRole(['super_admin', 'support']), async (req, res) => {
    try {
      const { search, status } = req.query;
      
      console.log('🏢 FETCHING_TENANTS', { 
        adminId: req.admin?.id, 
        search: search || 'none',
        status: status || 'all',
        timestamp: new Date() 
      });

      let whereConditions = [];
      
      if (search) {
        whereConditions.push(sql`(${tenants.name} ILIKE ${`%${search}%`} OR ${tenants.subdomain} ILIKE ${`%${search}%`})`);
      }

      // Fetch tenants with comprehensive metrics
      let query = db
        .select({
          id: tenants.id,
          name: tenants.name,
          subdomain: tenants.subdomain,
          createdAt: tenants.created_at,
          userCount: sql<number>`(SELECT COUNT(*) FROM users WHERE tenant_id = ${tenants.subdomain})`,
          subscriptionStatus: sql<string>`COALESCE((SELECT status FROM subscriptions WHERE tenant_id = ${tenants.subdomain}), 'inactive')`,
          seatsUsed: sql<number>`COALESCE((SELECT seats_used FROM subscriptions WHERE tenant_id = ${tenants.subdomain}), 0)`,
          seatsIncluded: sql<number>`COALESCE((SELECT seats_included FROM subscriptions WHERE tenant_id = ${tenants.subdomain}), 5)`,
        })
        .from(tenants);

      if (whereConditions.length > 0) {
        query = query.where(sql.raw(whereConditions.join(' AND ')));
      }

      const tenantsData = await query.orderBy(desc(tenants.created_at));

      console.log('✅ TENANTS_FETCHED', { count: tenantsData.length, timestamp: new Date() });

      res.json(tenantsData);
    } catch (error) {
      console.error('❌ ADMIN_TENANTS_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to fetch tenants' });
    }
  });

  // GET /api/admin/tenants/:id/details - Get detailed tenant information
  app.get('/api/admin/tenants/:id/details', adminAuth, requireRole(['super_admin', 'support']), async (req, res) => {
    try {
      const tenantId = parseInt(req.params.id);
      
      console.log('🔍 FETCHING_TENANT_DETAILS', { tenantId, adminId: req.admin?.id, timestamp: new Date() });

      // Get tenant basic info
      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId));

      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      // Get comprehensive metrics
      const [metrics] = await db
        .select({
          totalShifts: sql<number>`(SELECT COUNT(*) FROM shifts WHERE tenant_id = ${tenant.subdomain})`,
          activeUsers: sql<number>`(SELECT COUNT(*) FROM users WHERE tenant_id = ${tenant.subdomain} AND is_active = true)`,
          lastActivity: sql<string>`(
            SELECT MAX(created_at) FROM (
              SELECT created_at FROM shifts WHERE tenant_id = ${tenant.subdomain}
              UNION ALL
              SELECT created_at FROM time_entries WHERE tenant_id = ${tenant.subdomain}
              UNION ALL
              SELECT created_at FROM activity_logs WHERE tenant_id = ${tenant.subdomain}
            ) activities
          )`,
          subscriptionStatus: sql<string>`COALESCE((SELECT status FROM subscriptions WHERE tenant_id = ${tenant.subdomain}), 'inactive')`,
          subscriptionPlan: sql<string>`COALESCE((SELECT plan_type FROM subscriptions WHERE tenant_id = ${tenant.subdomain}), 'free')`,
          seatsIncluded: sql<number>`COALESCE((SELECT seats_included FROM subscriptions WHERE tenant_id = ${tenant.subdomain}), 5)`,
          revenue: sql<number>`COALESCE((SELECT SUM(amount) FROM usage_metrics WHERE tenant_id = ${tenant.subdomain}), 0)`,
        })
        .from(sql`(SELECT 1) as dummy`);

      const tenantDetails = {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          createdAt: tenant.created_at,
          userCount: metrics.activeUsers,
          subscriptionStatus: metrics.subscriptionStatus,
          seatsUsed: metrics.activeUsers,
          seatsIncluded: metrics.seatsIncluded,
        },
        revenue: metrics.revenue,
        lastActivity: metrics.lastActivity,
        totalShifts: metrics.totalShifts,
        activeUsers: metrics.activeUsers,
        subscriptionInfo: {
          plan: metrics.subscriptionPlan,
          billingCycle: 'monthly',
          nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          totalPaid: metrics.revenue,
        },
      };

      console.log('✅ TENANT_DETAILS_FETCHED', { tenantId, revenue: metrics.revenue, timestamp: new Date() });

      res.json(tenantDetails);
    } catch (error) {
      console.error('❌ TENANT_DETAILS_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to fetch tenant details' });
    }
  });

  // GET /api/admin/tenants/cleanup-candidates
  app.get('/api/admin/tenants/cleanup-candidates', adminAuth, requireRole(['super_admin', 'support']), async (req, res) => {
    try {
      console.log('🏢 FETCHING_CLEANUP_CANDIDATES', { adminId: req.admin?.id, timestamp: new Date() });

      // Get tenants with comprehensive data
      const tenantsData = await db
        .select({
          id: tenants.id,
          name: tenants.name,
          subdomain: tenants.subdomain,
          createdAt: tenants.created_at,
          userCount: sql<number>`(SELECT COUNT(*) FROM users WHERE tenant_id = ${tenants.subdomain})`,
          shiftCount: sql<number>`(SELECT COUNT(*) FROM shifts WHERE tenant_id = ${tenants.subdomain})`,
          lastActivity: sql<string>`(
            SELECT MAX(created_at) FROM (
              SELECT created_at FROM shifts WHERE tenant_id = ${tenants.subdomain}
              UNION ALL
              SELECT created_at FROM time_entries WHERE tenant_id = ${tenants.subdomain}
              UNION ALL
              SELECT created_at FROM holiday_requests WHERE tenant_id = ${tenants.subdomain}
            ) activities
          )`,
          subscriptionStatus: sql<string>`COALESCE((SELECT status FROM subscriptions WHERE tenant_id = ${tenants.subdomain}), 'inactive')`,
        })
        .from(tenants)
        .orderBy(desc(tenants.created_at));

      // Calculate additional metrics
      const enrichedTenants = await Promise.all(tenantsData.map(async (tenant) => {
        // Count total records across all tenant tables
        const [totalDataResult] = await db.execute(sql`
          SELECT 
            (SELECT COUNT(*) FROM users WHERE tenant_id = ${tenant.subdomain}) +
            (SELECT COUNT(*) FROM shifts WHERE tenant_id = ${tenant.subdomain}) +
            (SELECT COUNT(*) FROM time_entries WHERE tenant_id = ${tenant.subdomain}) +
            (SELECT COUNT(*) FROM holiday_requests WHERE tenant_id = ${tenant.subdomain}) +
            (SELECT COUNT(*) FROM assignments WHERE tenant_id = ${tenant.subdomain}) +
            (SELECT COUNT(*) FROM swap_requests WHERE tenant_id = ${tenant.subdomain}) +
            (SELECT COUNT(*) FROM business_profiles WHERE tenant_id = ${tenant.subdomain}) +
            (SELECT COUNT(*) FROM staff_strikes WHERE tenant_id = ${tenant.subdomain}) +
            (SELECT COUNT(*) FROM usage_metrics WHERE tenant_id = ${tenant.subdomain}) +
            (SELECT COUNT(*) FROM seat_allocation WHERE tenant_id = ${tenant.subdomain})
          AS total_records
        `);

        const totalData = Number(totalDataResult.total_records) || 0;
        const lastActivity = tenant.lastActivity;
        const daysSinceActivity = lastActivity 
          ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
          : 999; // Very high number for tenants with no activity

        return {
          ...tenant,
          totalData,
          daysSinceActivity,
          lastActivity
        };
      }));

      console.log('✅ CLEANUP_CANDIDATES_FETCHED', { 
        count: enrichedTenants.length,
        timestamp: new Date() 
      });

      res.json(enrichedTenants);
    } catch (error) {
      console.error('❌ CLEANUP_CANDIDATES_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to fetch cleanup candidates' });
    }
  });

  // POST /api/admin/tenants/cleanup-preview
  app.post('/api/admin/tenants/cleanup-preview', adminAuth, requireRole(['super_admin']), async (req, res) => {
    try {
      const { tenantIds } = req.body;
      
      console.log('📋 GENERATING_CLEANUP_PREVIEW', { 
        tenantIds, 
        adminId: req.admin?.id, 
        timestamp: new Date() 
      });

      if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
        return res.status(400).json({ message: 'Invalid tenant IDs provided' });
      }

      const previews = await Promise.all(tenantIds.map(async (tenantId: number) => {
        // Get tenant info
        const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
        
        if (!tenant) {
          throw new Error(`Tenant ${tenantId} not found`);
        }

        // Count records in each table
        const tableQueries = [
          { name: 'users', query: db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.tenantId, tenant.subdomain)) },
          { name: 'shifts', query: db.select({ count: sql<number>`count(*)` }).from(shifts).where(eq(shifts.tenantId, tenant.subdomain)) },
          { name: 'time_entries', query: db.select({ count: sql<number>`count(*)` }).from(timeEntries).where(eq(timeEntries.tenantId, tenant.subdomain)) },
          { name: 'holiday_requests', query: db.select({ count: sql<number>`count(*)` }).from(holidayRequests).where(eq(holidayRequests.tenantId, tenant.subdomain)) },
          { name: 'assignments', query: db.select({ count: sql<number>`count(*)` }).from(assignments).where(eq(assignments.tenantId, tenant.subdomain)) },
          { name: 'swap_requests', query: db.select({ count: sql<number>`count(*)` }).from(swapRequests).where(eq(swapRequests.tenantId, tenant.subdomain)) },
          { name: 'business_profiles', query: db.select({ count: sql<number>`count(*)` }).from(businessProfiles).where(eq(businessProfiles.tenantId, tenant.subdomain)) },
          { name: 'staff_strikes', query: db.select({ count: sql<number>`count(*)` }).from(staffStrikes).where(eq(staffStrikes.tenantId, tenant.subdomain)) },
          { name: 'usage_metrics', query: db.select({ count: sql<number>`count(*)` }).from(usageMetrics).where(eq(usageMetrics.tenantId, tenant.subdomain)) },
          { name: 'seat_allocation', query: db.select({ count: sql<number>`count(*)` }).from(seatAllocation).where(eq(seatAllocation.tenantId, tenant.subdomain)) },
          { name: 'subscriptions', query: db.select({ count: sql<number>`count(*)` }).from(subscriptions).where(eq(subscriptions.tenantId, tenant.subdomain)) },
        ];

        const affectedTables = await Promise.all(
          tableQueries.map(async ({ name, query }) => {
            const [result] = await query;
            return {
              tableName: name,
              recordCount: result.count
            };
          })
        );

        const totalRecords = affectedTables.reduce((sum, table) => sum + table.recordCount, 0);

        return {
          tenant: {
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain
          },
          affectedTables: affectedTables.filter(table => table.recordCount > 0),
          totalRecords
        };
      }));

      console.log('✅ CLEANUP_PREVIEW_GENERATED', { 
        previewCount: previews.length,
        timestamp: new Date() 
      });

      res.json(previews);
    } catch (error) {
      console.error('❌ CLEANUP_PREVIEW_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to generate cleanup preview' });
    }
  });

  // DELETE /api/admin/tenants/cleanup
  app.delete('/api/admin/tenants/cleanup', adminAuth, requireRole(['super_admin']), async (req, res) => {
    try {
      const { tenantIds } = req.body;
      
      console.log('🗑️ EXECUTING_TENANT_CLEANUP', { 
        tenantIds, 
        adminId: req.admin?.id, 
        timestamp: new Date() 
      });

      if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
        return res.status(400).json({ message: 'Invalid tenant IDs provided' });
      }

      let totalRecordsDeleted = 0;
      let deletedTenants = 0;

      // Process each tenant deletion
      for (const tenantId of tenantIds) {
        const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
        
        if (!tenant) {
          console.warn(`⚠️ TENANT_NOT_FOUND`, { tenantId, timestamp: new Date() });
          continue;
        }

        // Log cleanup activity
        await db.insert(activityLogs).values({
          tenantId: 'system',
          userId: req.admin?.id || 0,
          action: 'tenant_cleanup',
          description: `Cleaning up tenant: ${tenant.name} (${tenant.subdomain})`,
          metadata: JSON.stringify({ 
            tenantId: tenant.id,
            tenantName: tenant.name,
            subdomain: tenant.subdomain,
            adminId: req.admin?.id 
          })
        });

        // Count records before deletion
        const [recordCount] = await db.execute(sql`
          SELECT 
            (SELECT COUNT(*) FROM users WHERE tenant_id = ${tenant.subdomain}) +
            (SELECT COUNT(*) FROM shifts WHERE tenant_id = ${tenant.subdomain}) +
            (SELECT COUNT(*) FROM time_entries WHERE tenant_id = ${tenant.subdomain}) +
            (SELECT COUNT(*) FROM holiday_requests WHERE tenant_id = ${tenant.subdomain}) +
            (SELECT COUNT(*) FROM assignments WHERE tenant_id = ${tenant.subdomain}) +
            (SELECT COUNT(*) FROM swap_requests WHERE tenant_id = ${tenant.subdomain}) +
            (SELECT COUNT(*) FROM business_profiles WHERE tenant_id = ${tenant.subdomain}) +
            (SELECT COUNT(*) FROM staff_strikes WHERE tenant_id = ${tenant.subdomain}) +
            (SELECT COUNT(*) FROM usage_metrics WHERE tenant_id = ${tenant.subdomain}) +
            (SELECT COUNT(*) FROM seat_allocation WHERE tenant_id = ${tenant.subdomain}) +
            (SELECT COUNT(*) FROM subscriptions WHERE tenant_id = ${tenant.subdomain})
          AS total_records
        `);

        const tenantRecords = Number(recordCount.total_records) || 0;
        totalRecordsDeleted += tenantRecords;

        // Delete all tenant data (cascade deletes will handle relationships)
        await db.delete(users).where(eq(users.tenantId, tenant.subdomain));
        await db.delete(shifts).where(eq(shifts.tenantId, tenant.subdomain));
        await db.delete(timeEntries).where(eq(timeEntries.tenantId, tenant.subdomain));
        await db.delete(holidayRequests).where(eq(holidayRequests.tenantId, tenant.subdomain));
        await db.delete(assignments).where(eq(assignments.tenantId, tenant.subdomain));
        await db.delete(swapRequests).where(eq(swapRequests.tenantId, tenant.subdomain));
        await db.delete(businessProfiles).where(eq(businessProfiles.tenantId, tenant.subdomain));
        await db.delete(staffStrikes).where(eq(staffStrikes.tenantId, tenant.subdomain));
        await db.delete(usageMetrics).where(eq(usageMetrics.tenantId, tenant.subdomain));
        await db.delete(seatAllocation).where(eq(seatAllocation.tenantId, tenant.subdomain));
        await db.delete(subscriptions).where(eq(subscriptions.tenantId, tenant.subdomain));

        // Finally delete the tenant record itself
        await db.delete(tenants).where(eq(tenants.id, tenantId));

        deletedTenants++;

        console.log('✅ TENANT_DELETED', { 
          tenantId,
          tenantName: tenant.name,
          recordsDeleted: tenantRecords,
          timestamp: new Date() 
        });
      }

      console.log('✅ CLEANUP_COMPLETED', { 
        deletedTenants,
        totalRecordsDeleted,
        adminId: req.admin?.id,
        timestamp: new Date() 
      });

      res.json({
        message: 'Tenant cleanup completed successfully',
        deletedTenants,
        totalRecordsDeleted
      });

    } catch (error) {
      console.error('❌ TENANT_CLEANUP_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to cleanup tenants' });
    }
  });

  // POST /api/admin/tenants/cleanup-report
  app.post('/api/admin/tenants/cleanup-report', adminAuth, requireRole(['super_admin', 'support']), async (req, res) => {
    try {
      const { tenantIds, filterDays, filterStatus } = req.body;
      
      console.log('📊 GENERATING_CLEANUP_REPORT', { 
        tenantIds, 
        filterDays, 
        filterStatus,
        timestamp: new Date() 
      });

      // Generate CSV report
      const headers = [
        'Tenant ID',
        'Tenant Name', 
        'Subdomain',
        'Created Date',
        'User Count',
        'Shift Count',
        'Total Records',
        'Last Activity',
        'Days Inactive',
        'Subscription Status'
      ];

      const csvRows = [headers.join(',')];

      for (const tenantId of tenantIds) {
        const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
        
        if (tenant) {
          const [userCount] = await db.select({ count: sql<number>`count(*)` })
            .from(users).where(eq(users.tenantId, tenant.subdomain));
          
          const [shiftCount] = await db.select({ count: sql<number>`count(*)` })
            .from(shifts).where(eq(shifts.tenantId, tenant.subdomain));

          const [subscription] = await db.select()
            .from(subscriptions).where(eq(subscriptions.tenantId, tenant.subdomain));

          const row = [
            tenant.id,
            `"${tenant.name}"`,
            tenant.subdomain,
            tenant.createdAt.toISOString().split('T')[0],
            userCount.count,
            shiftCount.count,
            userCount.count + shiftCount.count,
            '', // Last activity calculation would go here
            '', // Days inactive calculation would go here
            subscription?.status || 'inactive'
          ];

          csvRows.push(row.join(','));
        }
      }

      const csvContent = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="tenant-cleanup-report-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);

    } catch (error) {
      console.error('❌ CLEANUP_REPORT_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to generate cleanup report' });
    }
  });

  // GET /api/admin/tenants - List all tenants with filtering and search
  app.get('/api/admin/tenants', adminAuth, requireRole(['super_admin', 'support', 'finance']), async (req, res) => {
    try {
      const { search, status, page = 1, limit = 50 } = req.query;
      
      console.log('🏢 FETCHING_ADMIN_TENANTS', { 
        search, 
        status, 
        page, 
        limit,
        adminId: req.admin?.id,
        timestamp: new Date() 
      });

      const offset = (Number(page) - 1) * Number(limit);

      let query = db
        .select({
          id: tenants.id,
          name: tenants.name,
          subdomain: tenants.subdomain,
          createdAt: tenants.created_at,
          userCount: sql<number>`(SELECT COUNT(*) FROM users WHERE tenant_id = ${tenants.subdomain})`,
          subscriptionStatus: sql<string>`COALESCE((SELECT status FROM subscriptions WHERE tenant_id = ${tenants.subdomain}), 'inactive')`,
          seatsUsed: sql<number>`COALESCE((SELECT seats_used FROM subscriptions WHERE tenant_id = ${tenants.subdomain}), 0)`,
          seatsIncluded: sql<number>`COALESCE((SELECT seats_included FROM subscriptions WHERE tenant_id = ${tenants.subdomain}), 0)`,
        })
        .from(tenants)
        .orderBy(desc(tenants.created_at))
        .limit(Number(limit))
        .offset(offset);

      const results = await query;

      // Get total count for pagination
      const [totalCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tenants);

      console.log('✅ ADMIN_TENANTS_FETCHED', { 
        count: results.length,
        total: totalCount.count,
        timestamp: new Date() 
      });

      res.json({
        tenants: results,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount.count,
          pages: Math.ceil(totalCount.count / Number(limit))
        }
      });

    } catch (error) {
      console.error('❌ ADMIN_TENANTS_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to fetch tenants' });
    }
  });

  // PUT /api/admin/tenants/:id - Update tenant information
  app.put('/api/admin/tenants/:id', adminAuth, requireRole(['super_admin']), async (req, res) => {
    try {
      const tenantId = parseInt(req.params.id);
      const { name, subdomain, status, seatsIncluded } = req.body;
      
      console.log('🔧 UPDATING_TENANT', { 
        tenantId, 
        adminId: req.admin?.id, 
        changes: { name, subdomain, status, seatsIncluded },
        timestamp: new Date() 
      });

      // Update tenant
      const [updatedTenant] = await db
        .update(tenants)
        .set({ 
          name: name || undefined,
          subdomain: subdomain || undefined 
        })
        .where(eq(tenants.id, tenantId))
        .returning();

      if (!updatedTenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      // Update subscription status if provided
      if (status || seatsIncluded) {
        await db
          .insert(subscriptions)
          .values({
            tenantId: updatedTenant.subdomain,
            status: status || 'active',
            seatsIncluded: seatsIncluded || 5,
            planType: 'basic',
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .onConflictDoUpdate({
            target: subscriptions.tenantId,
            set: {
              status: status || subscriptions.status,
              seatsIncluded: seatsIncluded || subscriptions.seatsIncluded,
              updatedAt: new Date()
            }
          });
      }

      console.log('✅ TENANT_UPDATED', { tenantId, timestamp: new Date() });

      res.json(updatedTenant);
    } catch (error) {
      console.error('❌ TENANT_UPDATE_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to update tenant' });
    }
  });

  // DELETE /api/admin/tenants/:id - Delete single tenant
  app.delete('/api/admin/tenants/:id', adminAuth, requireRole(['super_admin']), async (req, res) => {
    try {
      const tenantId = parseInt(req.params.id);
      
      console.log('🗑️ DELETING_SINGLE_TENANT', { 
        tenantId, 
        adminId: req.admin?.id, 
        timestamp: new Date() 
      });

      // Get tenant first
      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId));

      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      // Delete all tenant data (cascade deletes will handle relationships)
      await db.delete(users).where(eq(users.tenantId, tenant.subdomain));
      await db.delete(shifts).where(eq(shifts.tenantId, tenant.subdomain));
      await db.delete(timeEntries).where(eq(timeEntries.tenantId, tenant.subdomain));
      await db.delete(holidayRequests).where(eq(holidayRequests.tenantId, tenant.subdomain));
      await db.delete(assignments).where(eq(assignments.tenantId, tenant.subdomain));
      await db.delete(swapRequests).where(eq(swapRequests.tenantId, tenant.subdomain));
      await db.delete(businessProfiles).where(eq(businessProfiles.tenantId, tenant.subdomain));
      await db.delete(staffStrikes).where(eq(staffStrikes.tenantId, tenant.subdomain));
      await db.delete(usageMetrics).where(eq(usageMetrics.tenantId, tenant.subdomain));
      await db.delete(seatAllocation).where(eq(seatAllocation.tenantId, tenant.subdomain));
      await db.delete(subscriptions).where(eq(subscriptions.tenantId, tenant.subdomain));

      // Finally delete the tenant record itself
      await db.delete(tenants).where(eq(tenants.id, tenantId));

      console.log('✅ SINGLE_TENANT_DELETED', { tenantId, subdomain: tenant.subdomain, timestamp: new Date() });

      res.json({ message: 'Tenant deleted successfully' });
    } catch (error) {
      console.error('❌ SINGLE_TENANT_DELETE_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: 'Failed to delete tenant' });
    }
  });
}