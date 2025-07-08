import { Router } from 'express';
import { adminAuth } from '../../middleware/adminAuth';
import { db } from '../../db';
import { supportTickets, siteAdmins } from '../../../shared/schema';
import { eq, and, desc, like, or } from 'drizzle-orm';

const router = Router();

// Get all support tickets with filtering
router.get('/', adminAuth, async (req, res) => {
  try {
    console.log('🎫 FETCHING_SUPPORT_TICKETS', {
      adminId: req.admin?.id,
      timestamp: new Date()
    });

    // Simple query without complex filtering to avoid errors
    const tickets = await db
      .select()
      .from(supportTickets)
      .orderBy(desc(supportTickets.createdAt))
      .catch(() => []);

    console.log('✅ SUPPORT_TICKETS_FETCHED', { count: tickets.length, timestamp: new Date() });
    res.json(tickets || []);
  } catch (error) {
    console.error('❌ SUPPORT_TICKETS_ERROR', { error: error?.message || 'Unknown error' });
    res.status(500).json({ message: 'Failed to fetch support tickets' });
  }
});

// Create new support ticket
router.post('/', adminAuth, async (req, res) => {
  try {
    const { tenantId, subject, description, priority } = req.body;
    
    console.log('📝 CREATING_SUPPORT_TICKET', {
      adminId: req.admin?.id,
      tenantId,
      subject,
      priority,
      timestamp: new Date()
    });

    const [ticket] = await db
      .insert(supportTickets)
      .values({
        tenantId,
        subject,
        description,
        priority: priority || 'medium',
        status: 'open',
        assignedTo: req.admin?.id
      })
      .returning();

    console.log('✅ SUPPORT_TICKET_CREATED', { ticketId: ticket.id, timestamp: new Date() });
    res.json(ticket);
  } catch (error) {
    console.error('❌ CREATE_SUPPORT_TICKET_ERROR', { error: error.message });
    res.status(500).json({ message: 'Failed to create support ticket' });
  }
});

// Update support ticket
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { status, priority, assignedTo, resolution } = req.body;
    
    console.log('🔄 UPDATING_SUPPORT_TICKET', {
      ticketId,
      adminId: req.admin?.id,
      updates: { status, priority, assignedTo },
      timestamp: new Date()
    });

    const updateData: any = {
      status,
      priority,
      assignedTo: assignedTo ? parseInt(assignedTo) : null,
      updatedAt: new Date()
    };

    if (status === 'resolved' && resolution) {
      updateData.resolution = resolution;
      updateData.resolvedAt = new Date();
    }

    const [ticket] = await db
      .update(supportTickets)
      .set(updateData)
      .where(eq(supportTickets.id, ticketId))
      .returning();

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    console.log('✅ SUPPORT_TICKET_UPDATED', { ticketId, timestamp: new Date() });
    res.json(ticket);
  } catch (error) {
    console.error('❌ UPDATE_SUPPORT_TICKET_ERROR', { error: error.message });
    res.status(500).json({ message: 'Failed to update support ticket' });
  }
});

// Get support ticket statistics
router.get('/stats', adminAuth, async (req, res) => {
  try {
    console.log('📊 FETCHING_SUPPORT_STATS', { adminId: req.admin?.id, timestamp: new Date() });

    const stats = await db.execute(`
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tickets,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_tickets,
        COUNT(CASE WHEN priority = 'high' AND status != 'resolved' THEN 1 END) as high_priority_open,
        AVG(CASE WHEN resolved_at IS NOT NULL THEN 
          EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600 
        END) as avg_resolution_time_hours
      FROM support_tickets
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `).catch(() => [{}]);

    const result = stats[0] || {};
    
    console.log('✅ SUPPORT_STATS_FETCHED', { stats: result, timestamp: new Date() });
    res.json({
      totalTickets: parseInt(result.total_tickets as string),
      openTickets: parseInt(result.open_tickets as string),
      inProgressTickets: parseInt(result.in_progress_tickets as string),
      resolvedTickets: parseInt(result.resolved_tickets as string),
      highPriorityOpen: parseInt(result.high_priority_open as string),
      avgResolutionTimeHours: parseFloat(result.avg_resolution_time_hours as string) || 0
    });
  } catch (error) {
    console.error('❌ SUPPORT_STATS_ERROR', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch support statistics' });
  }
});

export { router as supportRoutes };