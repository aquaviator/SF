import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';
import { strikeService } from './strike-service';
import { storage } from './storage';
import { cronScheduler } from './cron-scheduler';

// Mock console.log to capture logs for testing
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('Strike Detection System', () => {
  beforeAll(async () => {
    // Clear all data before tests
    await storage.clearAllData();
  });

  beforeEach(() => {
    mockConsoleLog.mockClear();
  });

  afterAll(async () => {
    cronScheduler.stop();
    mockConsoleLog.mockRestore();
  });

  describe('Staff Strikes Storage', () => {
    it('should create and retrieve staff strikes', async () => {
      const strike = await storage.createStaffStrike({
        tenantId: 'test-tenant',
        userId: 1,
        points: 2,
        reason: 'no_show',
        shiftId: 1,
        notes: 'Test no-show strike',
        isActive: true,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
      });

      expect(strike).toBeDefined();
      expect(strike.points).toBe(2);
      expect(strike.reason).toBe('no_show');
    });

    it('should calculate total strike points correctly', async () => {
      // Create multiple strikes for the same user
      await storage.createStaffStrike({
        tenantId: 'test-tenant',
        userId: 2,
        points: 2,
        reason: 'no_show',
        isActive: true,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      });

      await storage.createStaffStrike({
        tenantId: 'test-tenant',
        userId: 2,
        points: 1,
        reason: 'late_cancellation',
        isActive: true,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      });

      const totalPoints = await storage.getTotalStrikePoints('test-tenant', 2);
      expect(totalPoints).toBe(3);
    });

    it('should only count active strikes in total', async () => {
      await storage.createStaffStrike({
        tenantId: 'test-tenant',
        userId: 3,
        points: 2,
        reason: 'no_show',
        isActive: false, // Inactive strike
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      });

      const totalPoints = await storage.getTotalStrikePoints('test-tenant', 3);
      expect(totalPoints).toBe(0);
    });
  });

  describe('Strike Service Logic', () => {
    beforeEach(async () => {
      // Create a test shift policy
      await storage.createShiftPolicy({
        tenantId: 'test-tenant',
        minNoticeHours: 24,
        maxAdvanceBookingDays: 30,
        allowSelfAssignment: true,
        requireApproval: false,
        autoAssignEnabled: false,
        notificationSettings: {},
        resetPeriodDays: 90,
        lateGracePeriodMinutes: 10,
        clockInBufferMinutes: 30,
        clockOutBufferMinutes: 15
      });
    });

    it('should assign no-show strike correctly', async () => {
      await strikeService.assignNoShowStrike('test-tenant', 4, 1);

      const strikes = await storage.getStaffStrikesByUser('test-tenant', 4);
      expect(strikes).toHaveLength(1);
      expect(strikes[0].reason).toBe('no_show');
      expect(strikes[0].points).toBe(2);

      // Check console log
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ STRIKE_ASSIGNED'),
        expect.objectContaining({
          userId: 4,
          shiftId: 1,
          points: 2,
          reason: 'no_show'
        })
      );
    });

    it('should assign late cancellation strike correctly', async () => {
      await strikeService.assignLateCancellationStrike('test-tenant', 5, 2);

      const strikes = await storage.getStaffStrikesByUser('test-tenant', 5);
      expect(strikes).toHaveLength(1);
      expect(strikes[0].reason).toBe('late_cancellation');
      expect(strikes[0].points).toBe(1);

      // Check console log
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ LATE_CANCEL_STRIKE'),
        expect.objectContaining({
          userId: 5,
          shiftId: 2,
          points: 1
        })
      );
    });

    it('should allow claim when strike points are below limit', async () => {
      const result = await strikeService.canClaimShift('test-tenant', 6);
      expect(result.canClaim).toBe(true);

      // Check console log
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('🔐 CLAIM_GUARD'),
        expect.objectContaining({
          userId: 6,
          totalPoints: 0,
          maxPoints: 5
        })
      );
    });

    it('should block claim when strike points exceed limit', async () => {
      // Add strikes to exceed limit
      for (let i = 0; i < 3; i++) {
        await storage.createStaffStrike({
          tenantId: 'test-tenant',
          userId: 7,
          points: 2,
          reason: 'no_show',
          isActive: true,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        });
      }

      const result = await strikeService.canClaimShift('test-tenant', 7);
      expect(result.canClaim).toBe(false);
      expect(result.reason).toContain('6 strike points');
    });
  });

  describe('No-Show Detection', () => {
    beforeEach(async () => {
      // Create test users
      await storage.createUser({
        username: 'testuser',
        password: 'password',
        role: 'staff',
        tenantId: 'test-tenant',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        isActive: true,
        phone: null,
        address: null,
        dateOfBirth: null,
        hireDate: null,
        employeeId: null,
        emergencyContactName: null,
        emergencyContactPhone: null,
        photoUrl: null,
        bio: null
      });

      // Create shift policy
      await storage.createShiftPolicy({
        tenantId: 'test-tenant',
        minNoticeHours: 24,
        maxAdvanceBookingDays: 30,
        allowSelfAssignment: true,
        requireApproval: false,
        autoAssignEnabled: false,
        notificationSettings: {},
        resetPeriodDays: 90,
        lateGracePeriodMinutes: 10,
        clockInBufferMinutes: 30,
        clockOutBufferMinutes: 15
      });
    });

    it('should detect no-show when shift started but no time entry exists', async () => {
      // Create a shift that started yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const shift = await storage.createShift({
        tenantId: 'test-tenant',
        date: yesterday.toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        role: 'Server',
        description: 'Test shift',
        location: 'Main Location',
        status: 'assigned',
        assignedTo: 1,
        assignmentType: 'assigned',
        requiredStaff: 1,
        createdBy: 1
      });

      await strikeService.checkNoShowStrikes();

      // Check that a strike was assigned
      const strikes = await storage.getStaffStrikesByUser('test-tenant', 1);
      expect(strikes.length).toBeGreaterThan(0);

      // Check console logs
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('🔍 CHECKING_NO_SHOW_STRIKES'),
        expect.any(Object)
      );
    });
  });

  describe('Strike Reset Functionality', () => {
    it('should reset expired strikes', async () => {
      // Create an expired strike
      const expiredStrike = await storage.createStaffStrike({
        tenantId: 'test-tenant',
        userId: 8,
        points: 2,
        reason: 'no_show',
        isActive: true,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Expired yesterday
      });

      await strikeService.resetExpiredStrikes();

      // Check that the strike was deactivated
      const updatedStrike = await storage.getStaffStrike(expiredStrike.id);
      expect(updatedStrike?.isActive).toBe(false);

      // Check console logs
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('🔄 STRIKE_RESET_START'),
        expect.any(Object)
      );
    });
  });

  describe('Cron Scheduler', () => {
    it('should start and stop scheduler correctly', () => {
      cronScheduler.start();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('🕒 CRON_SCHEDULER_START'),
        expect.any(Object)
      );

      cronScheduler.stop();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('🕒 CRON_SCHEDULER_STOP'),
        expect.any(Object)
      );
    });

    it('should manually trigger no-show check', async () => {
      await cronScheduler.triggerNoShowCheck();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('🔧 MANUAL_NO_SHOW_CHECK'),
        expect.any(Object)
      );
    });

    it('should manually trigger strike reset', async () => {
      await cronScheduler.triggerStrikeReset();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('🔧 MANUAL_STRIKE_RESET'),
        expect.any(Object)
      );
    });
  });

  describe('API Integration Tests', () => {
    beforeEach(async () => {
      // Create test policy for API tests
      await storage.createShiftPolicy({
        tenantId: 'api-test-tenant',
        minNoticeHours: 24,
        maxAdvanceBookingDays: 30,
        allowSelfAssignment: true,
        requireApproval: false,
        autoAssignEnabled: false,
        notificationSettings: {},
        resetPeriodDays: 90,
        lateGracePeriodMinutes: 10,
        clockInBufferMinutes: 30,
        clockOutBufferMinutes: 15
      });
    });

    it('should log GET strikes endpoint correctly', async () => {
      const strikes = await storage.getStaffStrikesByUser('api-test-tenant', 9);
      const totalPoints = await storage.getTotalStrikePoints('api-test-tenant', 9);
      
      expect(Array.isArray(strikes)).toBe(true);
      expect(typeof totalPoints).toBe('number');
    });

    it('should validate claim guard functionality', async () => {
      const result = await strikeService.canClaimShift('api-test-tenant', 10);
      expect(result).toHaveProperty('canClaim');
      expect(typeof result.canClaim).toBe('boolean');
    });
  });

  describe('Console Output Validation', () => {
    it('should log all required strike events', async () => {
      // Test no-show strike assignment
      await strikeService.assignNoShowStrike('test-tenant', 11, 3);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ STRIKE_ASSIGNED'),
        expect.objectContaining({ reason: 'no_show' })
      );

      // Test late cancellation strike
      await strikeService.assignLateCancellationStrike('test-tenant', 12, 4);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ LATE_CANCEL_STRIKE'),
        expect.any(Object)
      );

      // Test claim guard check
      await strikeService.canClaimShift('test-tenant', 13);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('🔐 CLAIM_GUARD'),
        expect.any(Object)
      );

      // Test strike reset
      await strikeService.resetExpiredStrikes();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('🔄 STRIKE_RESET_START'),
        expect.any(Object)
      );
    });
  });
});