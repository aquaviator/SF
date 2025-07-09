import cron from 'node-cron';
import { storage } from './storage';
import { sendShiftReminderEmail, sendEmergencyShiftAlert } from './utils/email';

/**
 * Reminder Scheduler Service
 * Handles automated shift reminders and emergency alerts
 */
export class ReminderScheduler {
  private scheduledJobs: cron.ScheduledTask[] = [];
  
  /**
   * Start the reminder scheduler
   */
  start(): void {
    // Schedule shift reminders - runs every hour
    const reminderJob = cron.schedule('0 * * * *', async () => {
      await this.checkShiftReminders();
    });
    
    // Schedule emergency alerts - runs every 15 minutes
    const emergencyJob = cron.schedule('*/15 * * * *', async () => {
      await this.checkEmergencyShifts();
    });
    
    this.scheduledJobs.push(reminderJob, emergencyJob);
    
    console.log('📅 REMINDER_SCHEDULER_STARTED', {
      reminderJob: 'Every hour',
      emergencyJob: 'Every 15 minutes',
      timestamp: new Date()
    });
  }
  
  /**
   * Stop the reminder scheduler
   */
  stop(): void {
    this.scheduledJobs.forEach(job => job.stop());
    this.scheduledJobs = [];
    
    console.log('📅 REMINDER_SCHEDULER_STOPPED', {
      timestamp: new Date()
    });
  }
  
  /**
   * Check for shifts that need reminders
   */
  private async checkShiftReminders(): Promise<void> {
    try {
      const now = new Date();
      const reminderWindow = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // 24 hours ahead
      
      console.log('📅 CHECKING_SHIFT_REMINDERS', {
        now: now.toISOString(),
        reminderWindow: reminderWindow.toISOString()
      });
      
      // Get all confirmed shifts in the next 24 hours
      const allShifts = await storage.getAllShifts();
      const upcomingShifts = allShifts.filter(shift => {
        if (shift.status !== 'confirmed' || !shift.assignedTo) return false;
        
        const shiftStart = new Date(`${shift.date}T${shift.startTime}`);
        const hoursUntilShift = (shiftStart.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        // Send reminder 24 hours before shift
        return hoursUntilShift > 23 && hoursUntilShift <= 25;
      });
      
      console.log('📅 UPCOMING_SHIFTS_FOUND', {
        count: upcomingShifts.length,
        shifts: upcomingShifts.map(s => ({
          id: s.id,
          date: s.date,
          startTime: s.startTime,
          assignedTo: s.assignedTo,
          role: s.role
        }))
      });
      
      // Send reminders
      const reminderPromises = upcomingShifts.map(async (shift) => {
        try {
          const staff = await storage.getUser(shift.assignedTo!);
          if (staff) {
            await sendShiftReminderEmail(shift, staff);
            console.log('✅ SHIFT_REMINDER_SENT', {
              shiftId: shift.id,
              staffId: staff.id,
              staffName: `${staff.firstName} ${staff.lastName}`,
              shiftDate: shift.date,
              timestamp: new Date()
            });
          }
        } catch (error) {
          console.error('❌ SHIFT_REMINDER_FAILED', {
            shiftId: shift.id,
            error: error.message,
            timestamp: new Date()
          });
        }
      });
      
      await Promise.all(reminderPromises);
      
    } catch (error) {
      console.error('❌ REMINDER_CHECK_FAILED', {
        error: error.message,
        timestamp: new Date()
      });
    }
  }
  
  /**
   * Check for shifts that need emergency coverage
   */
  private async checkEmergencyShifts(): Promise<void> {
    try {
      const now = new Date();
      const emergencyWindow = new Date(now.getTime() + (4 * 60 * 60 * 1000)); // 4 hours ahead
      
      console.log('🚨 CHECKING_EMERGENCY_SHIFTS', {
        now: now.toISOString(),
        emergencyWindow: emergencyWindow.toISOString()
      });
      
      // Get all open shifts starting within 4 hours
      const allShifts = await storage.getAllShifts();
      const emergencyShifts = allShifts.filter(shift => {
        if (shift.status !== 'open' || shift.assignmentType !== 'opportunity') return false;
        
        const shiftStart = new Date(`${shift.date}T${shift.startTime}`);
        const hoursUntilShift = (shiftStart.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        // Emergency alert for shifts starting within 4 hours
        return hoursUntilShift > 0 && hoursUntilShift <= 4;
      });
      
      console.log('🚨 EMERGENCY_SHIFTS_FOUND', {
        count: emergencyShifts.length,
        shifts: emergencyShifts.map(s => ({
          id: s.id,
          date: s.date,
          startTime: s.startTime,
          role: s.role,
          hoursUntilStart: Math.ceil((new Date(`${s.date}T${s.startTime}`).getTime() - now.getTime()) / (1000 * 60 * 60))
        }))
      });
      
      // Send emergency alerts
      const emergencyPromises = emergencyShifts.map(async (shift) => {
        try {
          // Get all eligible staff for this shift
          const tenantUsers = await storage.getUsersByTenant(shift.tenantId);
          const eligibleStaff = tenantUsers.filter(user => 
            user.role === 'staff' && 
            user.active && 
            user.id !== shift.assignedTo // Don't alert the person who cancelled
          );
          
          if (eligibleStaff.length > 0) {
            await sendEmergencyShiftAlert(shift, eligibleStaff, 'Urgent coverage needed');
            console.log('✅ EMERGENCY_ALERT_SENT', {
              shiftId: shift.id,
              staffCount: eligibleStaff.length,
              shiftDate: shift.date,
              timestamp: new Date()
            });
          }
        } catch (error) {
          console.error('❌ EMERGENCY_ALERT_FAILED', {
            shiftId: shift.id,
            error: error.message,
            timestamp: new Date()
          });
        }
      });
      
      await Promise.all(emergencyPromises);
      
    } catch (error) {
      console.error('❌ EMERGENCY_CHECK_FAILED', {
        error: error.message,
        timestamp: new Date()
      });
    }
  }
  
  /**
   * Manually trigger reminder check (for testing)
   */
  async triggerReminderCheck(): Promise<void> {
    console.log('🔧 MANUAL_REMINDER_CHECK_TRIGGERED', {
      timestamp: new Date()
    });
    await this.checkShiftReminders();
  }
  
  /**
   * Manually trigger emergency check (for testing)
   */
  async triggerEmergencyCheck(): Promise<void> {
    console.log('🔧 MANUAL_EMERGENCY_CHECK_TRIGGERED', {
      timestamp: new Date()
    });
    await this.checkEmergencyShifts();
  }
}

export const reminderScheduler = new ReminderScheduler();