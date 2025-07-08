import { Router } from 'express';
import { adminAuth } from '../../middleware/adminAuth';
import { db } from '../../db';

const router = Router();

// Get platform analytics overview
router.get('/overview', adminAuth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    console.log('📊 FETCHING_ANALYTICS_OVERVIEW', {
      adminId: req.admin?.id,
      period,
      timestamp: new Date()
    });

    // Calculate date range based on period
    let dateCondition = '';
    switch (period) {
      case '7d':
        dateCondition = "WHERE created_at >= NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        dateCondition = "WHERE created_at >= NOW() - INTERVAL '30 days'";
        break;
      case '90d':
        dateCondition = "WHERE created_at >= NOW() - INTERVAL '90 days'";
        break;
      case '1y':
        dateCondition = "WHERE created_at >= NOW() - INTERVAL '1 year'";
        break;
      default:
        dateCondition = "WHERE created_at >= NOW() - INTERVAL '30 days'";
    }

    // Get comprehensive analytics data
    const analyticsData = await db.execute(`
      SELECT 
        -- Tenant metrics
        (SELECT COUNT(*) FROM tenants ${dateCondition}) as new_tenants,
        (SELECT COUNT(*) FROM tenants) as total_tenants,
        (SELECT COUNT(*) FROM tenants WHERE created_at >= NOW() - INTERVAL '7 days') as weekly_new_tenants,
        
        -- User metrics  
        (SELECT COUNT(*) FROM users ${dateCondition}) as new_users,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
        
        -- Subscription metrics
        (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_subscriptions,
        (SELECT COUNT(*) FROM subscriptions WHERE status = 'trial') as trial_subscriptions,
        (SELECT SUM(seats_used * 3.00) FROM subscriptions WHERE status = 'active') as total_revenue,
        
        -- Support metrics
        (SELECT COUNT(*) FROM support_tickets ${dateCondition}) as new_tickets,
        (SELECT COUNT(*) FROM support_tickets WHERE status = 'open') as open_tickets,
        (SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) 
         FROM support_tickets 
         WHERE resolved_at IS NOT NULL ${dateCondition.replace('created_at', 'resolved_at')}) as avg_resolution_hours
    `);

    const data = analyticsData[0];
    
    const analytics = {
      tenants: {
        new: parseInt(data.new_tenants as string) || 0,
        total: parseInt(data.total_tenants as string) || 0,
        weeklyGrowth: parseInt(data.weekly_new_tenants as string) || 0
      },
      users: {
        new: parseInt(data.new_users as string) || 0,
        total: parseInt(data.total_users as string) || 0,
        active: parseInt(data.active_users as string) || 0
      },
      subscriptions: {
        active: parseInt(data.active_subscriptions as string) || 0,
        trial: parseInt(data.trial_subscriptions as string) || 0,
        revenue: parseFloat(data.total_revenue as string) || 0
      },
      support: {
        newTickets: parseInt(data.new_tickets as string) || 0,
        openTickets: parseInt(data.open_tickets as string) || 0,
        avgResolutionHours: parseFloat(data.avg_resolution_hours as string) || 0
      },
      period
    };

    console.log('✅ ANALYTICS_OVERVIEW_FETCHED', { 
      period,
      metrics: analytics,
      timestamp: new Date() 
    });
    
    res.json(analytics);
  } catch (error) {
    console.error('❌ ANALYTICS_OVERVIEW_ERROR', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch analytics overview' });
  }
});

// Get tenant growth chart data
router.get('/tenant-growth', adminAuth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    console.log('📈 FETCHING_TENANT_GROWTH', {
      adminId: req.admin?.id,
      period,
      timestamp: new Date()
    });

    let intervalClause = '';
    let dateFormat = '';
    
    switch (period) {
      case '7d':
        intervalClause = "generate_series(NOW() - INTERVAL '7 days', NOW(), INTERVAL '1 day')";
        dateFormat = 'YYYY-MM-DD';
        break;
      case '30d':
        intervalClause = "generate_series(NOW() - INTERVAL '30 days', NOW(), INTERVAL '1 day')";
        dateFormat = 'YYYY-MM-DD';
        break;
      case '90d':
        intervalClause = "generate_series(NOW() - INTERVAL '90 days', NOW(), INTERVAL '1 week')";
        dateFormat = 'YYYY-WW';
        break;
      case '1y':
        intervalClause = "generate_series(NOW() - INTERVAL '1 year', NOW(), INTERVAL '1 month')";
        dateFormat = 'YYYY-MM';
        break;
      default:
        intervalClause = "generate_series(NOW() - INTERVAL '30 days', NOW(), INTERVAL '1 day')";
        dateFormat = 'YYYY-MM-DD';
    }

    const growthData = await db.execute(`
      WITH date_series AS (
        SELECT ${intervalClause} as date
      ),
      tenant_counts AS (
        SELECT 
          date_trunc('day', created_at) as date,
          COUNT(*) as new_tenants
        FROM tenants 
        WHERE created_at >= NOW() - INTERVAL '${period === '7d' ? '7 days' : period === '30d' ? '30 days' : period === '90d' ? '90 days' : '1 year'}'
        GROUP BY date_trunc('day', created_at)
      )
      SELECT 
        to_char(ds.date, '${dateFormat}') as period,
        COALESCE(tc.new_tenants, 0) as new_tenants,
        SUM(COALESCE(tc.new_tenants, 0)) OVER (ORDER BY ds.date) as cumulative_tenants
      FROM date_series ds
      LEFT JOIN tenant_counts tc ON date_trunc('day', ds.date) = tc.date
      ORDER BY ds.date
    `);

    console.log('✅ TENANT_GROWTH_FETCHED', { 
      period,
      dataPoints: growthData.length,
      timestamp: new Date() 
    });
    
    res.json(growthData);
  } catch (error) {
    console.error('❌ TENANT_GROWTH_ERROR', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch tenant growth data' });
  }
});

// Get revenue analytics
router.get('/revenue', adminAuth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    console.log('💰 FETCHING_REVENUE_ANALYTICS', {
      adminId: req.admin?.id,
      period,
      timestamp: new Date()
    });

    const revenueData = await db.execute(`
      SELECT 
        to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
        COUNT(*) as active_subscriptions,
        SUM(seats_used * 3.00) as monthly_revenue,
        AVG(seats_used) as avg_seats_per_tenant
      FROM subscriptions 
      WHERE status = 'active' 
        AND created_at >= NOW() - INTERVAL '${period === '7d' ? '7 days' : period === '30d' ? '30 days' : period === '90d' ? '90 days' : '1 year'}'
      GROUP BY date_trunc('month', created_at)
      ORDER BY month
    `);

    const revenue = revenueData.map(row => ({
      month: row.month,
      subscriptions: parseInt(row.active_subscriptions as string),
      revenue: parseFloat(row.monthly_revenue as string) || 0,
      avgSeats: parseFloat(row.avg_seats_per_tenant as string) || 0
    }));

    console.log('✅ REVENUE_ANALYTICS_FETCHED', { 
      period,
      months: revenue.length,
      timestamp: new Date() 
    });
    
    res.json(revenue);
  } catch (error) {
    console.error('❌ REVENUE_ANALYTICS_ERROR', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch revenue analytics' });
  }
});

// Get usage statistics
router.get('/usage', adminAuth, async (req, res) => {
  try {
    console.log('📋 FETCHING_USAGE_STATS', {
      adminId: req.admin?.id,
      timestamp: new Date()
    });

    const usageStats = await db.execute(`
      SELECT 
        -- Overall usage
        (SELECT COUNT(*) FROM shifts WHERE created_at >= NOW() - INTERVAL '30 days') as shifts_created,
        (SELECT COUNT(*) FROM time_entries WHERE created_at >= NOW() - INTERVAL '30 days') as time_entries,
        (SELECT COUNT(*) FROM swap_requests WHERE created_at >= NOW() - INTERVAL '30 days') as swap_requests,
        (SELECT COUNT(*) FROM holiday_requests WHERE created_at >= NOW() - INTERVAL '30 days') as holiday_requests,
        
        -- Feature adoption
        (SELECT COUNT(DISTINCT tenant_id) FROM shifts WHERE created_at >= NOW() - INTERVAL '30 days') as tenants_using_shifts,
        (SELECT COUNT(DISTINCT tenant_id) FROM time_entries WHERE created_at >= NOW() - INTERVAL '30 days') as tenants_using_time_tracking,
        (SELECT COUNT(*) FROM tenants) as total_tenants,
        
        -- User engagement
        (SELECT COUNT(DISTINCT user_id) FROM time_entries WHERE created_at >= NOW() - INTERVAL '7 days') as weekly_active_users,
        (SELECT COUNT(*) FROM users WHERE is_active = true) as total_active_users
    `);

    const data = usageStats[0];
    
    const usage = {
      activity: {
        shiftsCreated: parseInt(data.shifts_created as string) || 0,
        timeEntries: parseInt(data.time_entries as string) || 0,
        swapRequests: parseInt(data.swap_requests as string) || 0,
        holidayRequests: parseInt(data.holiday_requests as string) || 0
      },
      adoption: {
        shiftsAdoption: (parseInt(data.tenants_using_shifts as string) / parseInt(data.total_tenants as string) * 100) || 0,
        timeTrackingAdoption: (parseInt(data.tenants_using_time_tracking as string) / parseInt(data.total_tenants as string) * 100) || 0
      },
      engagement: {
        weeklyActiveUsers: parseInt(data.weekly_active_users as string) || 0,
        totalActiveUsers: parseInt(data.total_active_users as string) || 0,
        engagementRate: (parseInt(data.weekly_active_users as string) / parseInt(data.total_active_users as string) * 100) || 0
      }
    };

    console.log('✅ USAGE_STATS_FETCHED', { 
      usage,
      timestamp: new Date() 
    });
    
    res.json(usage);
  } catch (error) {
    console.error('❌ USAGE_STATS_ERROR', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch usage statistics' });
  }
});

export { router as analyticsRoutes };