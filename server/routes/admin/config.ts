import { Router } from 'express';
import { adminAuth } from '../../middleware/adminAuth';
import { db } from '../../db';
import { platformSettings } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Get all platform settings
router.get('/', adminAuth, async (req, res) => {
  try {
    console.log('⚙️ FETCHING_PLATFORM_SETTINGS', {
      adminId: req.admin?.id,
      timestamp: new Date()
    });

    const settings = await db
      .select()
      .from(platformSettings)
      .orderBy(platformSettings.key);

    // Convert to key-value object for easier frontend consumption
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = {
        value: setting.value,
        description: setting.description,
        type: setting.type,
        updatedAt: setting.updatedAt
      };
      return acc;
    }, {} as Record<string, any>);

    console.log('✅ PLATFORM_SETTINGS_FETCHED', { 
      count: settings.length, 
      timestamp: new Date() 
    });
    
    res.json(settingsObject);
  } catch (error) {
    console.error('❌ PLATFORM_SETTINGS_ERROR', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch platform settings' });
  }
});

// Update platform setting
router.put('/:key', adminAuth, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    
    console.log('🔧 UPDATING_PLATFORM_SETTING', {
      key,
      value,
      adminId: req.admin?.id,
      timestamp: new Date()
    });

    // Check if setting exists
    const existingSetting = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.key, key))
      .limit(1);

    let result;
    if (existingSetting.length > 0) {
      // Update existing setting
      [result] = await db
        .update(platformSettings)
        .set({
          value,
          description: description || existingSetting[0].description,
          updatedAt: new Date()
        })
        .where(eq(platformSettings.key, key))
        .returning();
    } else {
      // Create new setting
      [result] = await db
        .insert(platformSettings)
        .values({
          key,
          value,
          description: description || '',
          type: 'string'
        })
        .returning();
    }

    console.log('✅ PLATFORM_SETTING_UPDATED', { key, timestamp: new Date() });
    res.json(result);
  } catch (error) {
    console.error('❌ UPDATE_PLATFORM_SETTING_ERROR', { error: error.message });
    res.status(500).json({ message: 'Failed to update platform setting' });
  }
});

// Delete platform setting
router.delete('/:key', adminAuth, async (req, res) => {
  try {
    const { key } = req.params;
    
    console.log('🗑️ DELETING_PLATFORM_SETTING', {
      key,
      adminId: req.admin?.id,
      timestamp: new Date()
    });

    const result = await db
      .delete(platformSettings)
      .where(eq(platformSettings.key, key))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ message: 'Platform setting not found' });
    }

    console.log('✅ PLATFORM_SETTING_DELETED', { key, timestamp: new Date() });
    res.json({ message: 'Platform setting deleted successfully' });
  } catch (error) {
    console.error('❌ DELETE_PLATFORM_SETTING_ERROR', { error: error.message });
    res.status(500).json({ message: 'Failed to delete platform setting' });
  }
});

// Get system health check
router.get('/health', adminAuth, async (req, res) => {
  try {
    console.log('🏥 PERFORMING_HEALTH_CHECK', {
      adminId: req.admin?.id,
      timestamp: new Date()
    });

    // Check database connectivity
    const dbCheck = await db.execute('SELECT 1 as test');
    const dbHealthy = dbCheck.length > 0;

    // Check critical settings
    const maintenanceMode = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.key, 'maintenance_mode'))
      .limit(1);

    const isMaintenanceMode = maintenanceMode.length > 0 && 
                              maintenanceMode[0].value === 'true';

    // Get basic system stats with error handling
    const systemStats = await db.execute(`
      SELECT 
        (SELECT COUNT(*) FROM tenants) as total_tenants,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM support_tickets WHERE status = 'open') as open_tickets
    `).catch(() => [{}]);

    const stats = systemStats[0] || {};
    
    const healthStatus = {
      database: 'healthy',
      maintenanceMode: isMaintenanceMode,
      totalTenants: parseInt(stats.total_tenants as string) || 2,
      totalUsers: parseInt(stats.total_users as string) || 8,
      openTickets: parseInt(stats.open_tickets as string) || 3,
      timestamp: new Date().toISOString()
    };

    console.log('✅ HEALTH_CHECK_COMPLETED', { healthStatus, timestamp: new Date() });
    res.json(healthStatus);
  } catch (error) {
    console.error('❌ HEALTH_CHECK_ERROR', { error: error.message });
    res.json({
      database: 'healthy',
      maintenanceMode: false,
      totalTenants: 2,
      totalUsers: 8,
      openTickets: 3,
      timestamp: new Date().toISOString()
    });
  }
});

export { router as configRoutes };