import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemStorage } from './storage';
import type { HolidayRequest, InsertHolidayRequest } from '@shared/schema';

describe('Holiday Requests Storage Layer', () => {
  let storage: MemStorage;
  let createdId: number;

  beforeEach(() => {
    storage = new MemStorage();
  });

  const testPayload: InsertHolidayRequest = {
    tenantId: 'test-tenant',
    requesterId: 123,
    startDate: '2025-08-01',
    endDate: '2025-08-03',
    reason: 'Family vacation',
    status: 'pending',
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: null,
  };

  describe('createHolidayRequest', () => {
    it('creates a new holiday request with all required fields', async () => {
      const result = await storage.createHolidayRequest(testPayload);
      
      expect(result).toMatchObject({
        tenantId: testPayload.tenantId,
        requesterId: testPayload.requesterId,
        startDate: testPayload.startDate,
        endDate: testPayload.endDate,
        reason: testPayload.reason,
        status: 'pending',
        reviewedBy: null,
        reviewedAt: null,
        reviewNotes: null,
      });
      
      expect(typeof result.id).toBe('number');
      expect(result.createdAt).toBeInstanceOf(Date);
      createdId = result.id;
    });

    it('creates holiday request with null optional fields', async () => {
      const minimalPayload: InsertHolidayRequest = {
        tenantId: 'test-tenant',
        requesterId: 456,
        startDate: '2025-09-01',
        endDate: '2025-09-03',
        reason: null,
        status: 'pending',
        reviewedBy: null,
        reviewedAt: null,
        reviewNotes: null,
      };

      const result = await storage.createHolidayRequest(minimalPayload);
      
      expect(result.reason).toBeNull();
      expect(result.reviewedBy).toBeNull();
      expect(result.reviewedAt).toBeNull();
      expect(result.reviewNotes).toBeNull();
    });

    it('creates holiday request with custom status', async () => {
      const approvedPayload: InsertHolidayRequest = {
        ...testPayload,
        status: 'approved',
        reviewedBy: 789,
        reviewedAt: new Date('2025-07-15'),
        reviewNotes: 'Approved with coverage arranged',
      };

      const result = await storage.createHolidayRequest(approvedPayload);
      
      expect(result.status).toBe('approved');
      expect(result.reviewedBy).toBe(789);
      expect(result.reviewedAt).toEqual(new Date('2025-07-15'));
      expect(result.reviewNotes).toBe('Approved with coverage arranged');
    });

    it('generates unique IDs for multiple requests', async () => {
      const result1 = await storage.createHolidayRequest(testPayload);
      const result2 = await storage.createHolidayRequest({
        ...testPayload,
        requesterId: 456,
      });

      expect(result1.id).not.toBe(result2.id);
      expect(result1.id).toBe(1);
      expect(result2.id).toBe(2);
    });
  });

  describe('getHolidayRequestsByTenant', () => {
    beforeEach(async () => {
      // Create test data
      await storage.createHolidayRequest(testPayload);
      await storage.createHolidayRequest({
        ...testPayload,
        requesterId: 456,
        reason: 'Medical appointment',
      });
      await storage.createHolidayRequest({
        ...testPayload,
        tenantId: 'other-tenant',
        requesterId: 789,
        reason: 'Conference attendance',
      });
    });

    it('returns only holiday requests for the specified tenant', async () => {
      const results = await storage.getHolidayRequestsByTenant('test-tenant');
      
      expect(results).toHaveLength(2);
      expect(results.every(r => r.tenantId === 'test-tenant')).toBe(true);
      expect(results.map(r => r.reason)).toEqual(['Family vacation', 'Medical appointment']);
    });

    it('returns empty array for tenant with no requests', async () => {
      const results = await storage.getHolidayRequestsByTenant('nonexistent-tenant');
      
      expect(results).toHaveLength(0);
      expect(Array.isArray(results)).toBe(true);
    });

    it('returns requests in creation order', async () => {
      const results = await storage.getHolidayRequestsByTenant('test-tenant');
      
      expect(results[0].requesterId).toBe(123);
      expect(results[1].requesterId).toBe(456);
    });
  });

  describe('updateHolidayRequest', () => {
    let holidayRequest: HolidayRequest;

    beforeEach(async () => {
      holidayRequest = await storage.createHolidayRequest(testPayload);
    });

    it('updates an existing holiday request', async () => {
      const updates: InsertHolidayRequest = {
        ...testPayload,
        status: 'approved',
        reviewedBy: 999,
        reviewedAt: new Date('2025-07-20'),
        reviewNotes: 'Approved - good timing',
        reason: 'Extended family vacation',
      };

      const result = await storage.updateHolidayRequest(holidayRequest.id, updates);
      
      expect(result).toBeDefined();
      expect(result?.status).toBe('approved');
      expect(result?.reviewedBy).toBe(999);
      expect(result?.reviewedAt).toEqual(new Date('2025-07-20'));
      expect(result?.reviewNotes).toBe('Approved - good timing');
      expect(result?.reason).toBe('Extended family vacation');
    });

    it('preserves original creation data when updating', async () => {
      const updates: InsertHolidayRequest = {
        ...testPayload,
        status: 'rejected',
        reviewNotes: 'Insufficient coverage',
      };

      const result = await storage.updateHolidayRequest(holidayRequest.id, updates);
      
      expect(result?.id).toBe(holidayRequest.id);
      expect(result?.tenantId).toBe(holidayRequest.tenantId);
      expect(result?.requesterId).toBe(holidayRequest.requesterId);
      expect(result?.createdAt).toEqual(holidayRequest.createdAt);
    });

    it('returns undefined for non-existent holiday request', async () => {
      const result = await storage.updateHolidayRequest(999, testPayload);
      
      expect(result).toBeUndefined();
    });

    it('updates with null values', async () => {
      const updates: InsertHolidayRequest = {
        ...testPayload,
        reason: null,
        reviewedBy: null,
        reviewedAt: null,
        reviewNotes: null,
      };

      const result = await storage.updateHolidayRequest(holidayRequest.id, updates);
      
      expect(result?.reason).toBeNull();
      expect(result?.reviewedBy).toBeNull();
      expect(result?.reviewedAt).toBeNull();
      expect(result?.reviewNotes).toBeNull();
    });
  });

  describe('deleteHolidayRequest', () => {
    let holidayRequest: HolidayRequest;

    beforeEach(async () => {
      holidayRequest = await storage.createHolidayRequest(testPayload);
    });

    it('deletes an existing holiday request', async () => {
      const result = await storage.deleteHolidayRequest(holidayRequest.id);
      
      expect(result).toBe(true);
      
      // Verify it's actually deleted
      const remaining = await storage.getHolidayRequestsByTenant('test-tenant');
      expect(remaining.find(r => r.id === holidayRequest.id)).toBeUndefined();
    });

    it('returns false for non-existent holiday request', async () => {
      const result = await storage.deleteHolidayRequest(999);
      
      expect(result).toBe(false);
    });

    it('does not affect other holiday requests', async () => {
      const otherRequest = await storage.createHolidayRequest({
        ...testPayload,
        requesterId: 456,
      });

      const result = await storage.deleteHolidayRequest(holidayRequest.id);
      
      expect(result).toBe(true);
      
      const remaining = await storage.getHolidayRequestsByTenant('test-tenant');
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(otherRequest.id);
    });
  });

  describe('getHolidayRequest', () => {
    let holidayRequest: HolidayRequest;

    beforeEach(async () => {
      holidayRequest = await storage.createHolidayRequest(testPayload);
    });

    it('returns holiday request by ID', async () => {
      const result = await storage.getHolidayRequest(holidayRequest.id);
      
      expect(result).toEqual(holidayRequest);
    });

    it('returns undefined for non-existent ID', async () => {
      const result = await storage.getHolidayRequest(999);
      
      expect(result).toBeUndefined();
    });
  });

  describe('Edge Cases and Data Integrity', () => {
    it('handles concurrent requests without ID conflicts', async () => {
      const requests = await Promise.all([
        storage.createHolidayRequest(testPayload),
        storage.createHolidayRequest({
          ...testPayload,
          requesterId: 456,
        }),
        storage.createHolidayRequest({
          ...testPayload,
          requesterId: 789,
        }),
      ]);

      const ids = requests.map(r => r.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(3);
      expect(Math.max(...ids)).toBe(3);
    });

    it('maintains data consistency across operations', async () => {
      // Create
      const created = await storage.createHolidayRequest(testPayload);
      
      // Update
      const updated = await storage.updateHolidayRequest(created.id, {
        ...testPayload,
        status: 'approved',
      });
      
      // Fetch
      const fetched = await storage.getHolidayRequest(created.id);
      
      expect(fetched).toEqual(updated);
    });

    it('handles empty tenant queries gracefully', async () => {
      const results = await storage.getHolidayRequestsByTenant('');
      
      expect(results).toHaveLength(0);
      expect(Array.isArray(results)).toBe(true);
    });
  });
});