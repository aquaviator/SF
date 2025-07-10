import { strikeService } from './strike-service';

/**
 * Simple cron-like scheduler for strike detection jobs
 * In production, use node-cron or similar library
 */
export class CronScheduler {
  private intervals: NodeJS.Timeout[] = [];

  /**
   * Start all scheduled jobs
   */
  start(): void {
    console.log("🕒 CRON_SCHEDULER_START", { timestamp: new Date() });
    
    // Check for no-show strikes every 30 minutes
    const noShowInterval = setInterval(async () => {
      try {
        await strikeService.checkNoShowStrikes();
      } catch (error) {
        console.error("Error in no-show check:", error);
      }
    }, 30 * 60 * 1000); // 30 minutes
    
    // Reset expired strikes daily at 2 AM
    const resetInterval = setInterval(async () => {
      const now = new Date();
      if (now.getHours() === 2 && now.getMinutes() < 30) {
        try {
          await strikeService.resetExpiredStrikes();
        } catch (error) {
          console.error("Error in strike reset:", error);
        }
      }
    }, 30 * 60 * 1000); // Check every 30 minutes but only run at 2 AM
    
    this.intervals = [noShowInterval, resetInterval];
    
    console.log("🕒 CRON_JOBS_STARTED", { 
      jobs: ["no-show-check", "strike-reset"], 
      timestamp: new Date() 
    });
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    console.log("🕒 CRON_SCHEDULER_STOP", { timestamp: new Date() });
  }

  /**
   * Manually trigger no-show check (for testing)
   */
  async triggerNoShowCheck(): Promise<void> {
    console.log("🔧 MANUAL_NO_SHOW_CHECK", { timestamp: new Date() });
    await strikeService.checkNoShowStrikes();
  }

  /**
   * Manually trigger strike reset (for testing)
   */
  async triggerStrikeReset(): Promise<void> {
    console.log("🔧 MANUAL_STRIKE_RESET", { timestamp: new Date() });
    await strikeService.resetExpiredStrikes();
  }
}

// Export singleton instance
export const cronScheduler = new CronScheduler();