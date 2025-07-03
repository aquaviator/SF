import { storage } from './storage';
import { shifts, timeEntries, shiftPolicies } from '../shared/schema';
import { db } from './db';
import { eq, and, sql } from 'drizzle-orm';

export class StrikeService {
  /**
   * Check for no-show strikes - called by cron job after shift start time + cancellation deadline
   */
  async checkNoShowStrikes(): Promise<void> {
    console.log("🔍 CHECKING_NO_SHOW_STRIKES", { timestamp: new Date() });
    
    // Get all shifts that started more than cancellation deadline ago
    const currentTime = new Date();
    
    // Get all tenants' policies
    const policies = await db.select().from(shiftPolicies);
    
    for (const policy of policies) {
      const deadlineHours = policy.minNoticeHours; // Using minNoticeHours as cancellation deadline
      const deadlineTime = new Date(currentTime.getTime() - deadlineHours * 60 * 60 * 1000);
      
      // Get shifts that should have started by now
      const shiftsToCheck = await db
        .select()
        .from(shifts)
        .where(
          and(
            eq(shifts.tenantId, policy.tenantId),
            eq(shifts.status, "assigned"),
            sql`${shifts.date} || ' ' || ${shifts.startTime} < ${deadlineTime.toISOString()}`
          )
        );
      
      for (const shift of shiftsToCheck) {
        // Check if there's a time entry for this shift
        const timeEntry = await db
          .select()
          .from(timeEntries)
          .where(
            and(
              eq(timeEntries.tenantId, shift.tenantId),
              eq(timeEntries.shiftId, shift.id),
              eq(timeEntries.userId, shift.assignedTo!)
            )
          );
        
        // If no time entry exists, this is a no-show
        if (timeEntry.length === 0) {
          await this.assignNoShowStrike(shift.tenantId, shift.assignedTo!, shift.id);
        }
      }
    }
  }

  /**
   * Assign a no-show strike to a user
   */
  async assignNoShowStrike(tenantId: string, userId: number, shiftId: number): Promise<void> {
    // Get the policy for this tenant
    const policy = await db
      .select()
      .from(shiftPolicies)
      .where(eq(shiftPolicies.tenantId, tenantId))
      .limit(1);
    
    if (policy.length === 0) {
      console.log("⚠️ NO_POLICY_FOUND", { tenantId, userId, shiftId, timestamp: new Date() });
      return;
    }
    
    const noShowPoints = 2; // Default points for no-show
    const resetPeriodDays = policy[0].resetPeriodDays || 90;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + resetPeriodDays);
    
    // Create the strike
    await storage.createStaffStrike({
      tenantId,
      userId,
      points: noShowPoints,
      reason: "no_show",
      shiftId,
      expiresAt,
      notes: `No-show for shift on ${new Date().toISOString()}`,
      isActive: true
    });
    
    console.log("⚠️ STRIKE_ASSIGNED", { 
      userId, 
      shiftId, 
      points: noShowPoints, 
      reason: "no_show", 
      timestamp: new Date() 
    });
  }

  /**
   * Assign a late cancellation strike
   */
  async assignLateCancellationStrike(tenantId: string, userId: number, shiftId: number): Promise<void> {
    // Get the policy for this tenant
    const policy = await db
      .select()
      .from(shiftPolicies)
      .where(eq(shiftPolicies.tenantId, tenantId))
      .limit(1);
    
    if (policy.length === 0) {
      console.log("⚠️ NO_POLICY_FOUND", { tenantId, userId, shiftId, timestamp: new Date() });
      return;
    }
    
    const lateCancelPoints = 1; // Default points for late cancellation
    const resetPeriodDays = policy[0].resetPeriodDays || 90;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + resetPeriodDays);
    
    // Create the strike
    await storage.createStaffStrike({
      tenantId,
      userId,
      points: lateCancelPoints,
      reason: "late_cancellation",
      shiftId,
      expiresAt,
      notes: `Late cancellation for shift on ${new Date().toISOString()}`,
      isActive: true
    });
    
    console.log("⚠️ LATE_CANCEL_STRIKE", { 
      userId, 
      shiftId, 
      points: lateCancelPoints, 
      timestamp: new Date() 
    });
  }

  /**
   * Check if a user can claim a shift (strike points validation)
   */
  async canClaimShift(tenantId: string, userId: number): Promise<{ canClaim: boolean; reason?: string }> {
    // Get the policy for this tenant
    const policy = await db
      .select()
      .from(shiftPolicies)
      .where(eq(shiftPolicies.tenantId, tenantId))
      .limit(1);
    
    if (policy.length === 0) {
      return { canClaim: true }; // No policy means no restrictions
    }
    
    const maxStrikePoints = 5; // Default max strike points
    const totalPoints = await storage.getTotalStrikePoints(tenantId, userId);
    
    console.log("🔐 CLAIM_GUARD", { 
      userId, 
      totalPoints, 
      maxPoints: maxStrikePoints, 
      timestamp: new Date() 
    });
    
    if (totalPoints >= maxStrikePoints) {
      return { 
        canClaim: false, 
        reason: `You have ${totalPoints} strike points. Maximum allowed is ${maxStrikePoints}.` 
      };
    }
    
    return { canClaim: true };
  }

  /**
   * Reset expired strikes for all tenants
   */
  async resetExpiredStrikes(): Promise<void> {
    console.log("🔄 STRIKE_RESET_START", { timestamp: new Date() });
    
    // Get all tenants with policies
    const policies = await db.select().from(shiftPolicies);
    
    for (const policy of policies) {
      const removedCount = await storage.resetExpiredStrikes(policy.tenantId);
      
      if (removedCount > 0) {
        console.log("🔄 STRIKE_RESET", { 
          tenantId: policy.tenantId,
          removedPoints: removedCount, 
          timestamp: new Date() 
        });
      }
    }
  }
}

// Export singleton instance
export const strikeService = new StrikeService();