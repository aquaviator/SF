import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { z } from 'zod';
import { insertHolidayRequestSchema } from '@shared/schema';
import type { HolidayRequest, InsertHolidayRequest } from '@shared/schema';

// Mock the storage layer
const mockStorage = {
  getHolidayRequestsByTenant: vi.fn(),
  createHolidayRequest: vi.fn(),
  updateHolidayRequest: vi.fn(),
  deleteHolidayRequest: vi.fn(),
};

// Mock holiday request data
const mockHolidayRequest: HolidayRequest = {
  id: 1,
  tenantId: 'test-tenant',
  requesterId: 2,
  startDate: '2025-08-01',
  endDate: '2025-08-03',
  reason: 'Family vacation',
  status: 'pending',
  reviewedBy: null,
  reviewedAt: null,
  reviewNotes: null,
  createdAt: new Date('2025-07-01'),
};

// Create Express app with holiday request routes
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Holiday Requests routes (copied from server/routes.ts)
  app.get("/api/holiday-requests", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const holidayRequests = await mockStorage.getHolidayRequestsByTenant(tenantId);
      res.json(holidayRequests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch holiday requests" });
    }
  });

  app.post("/api/holiday-requests", async (req, res) => {
    try {
      const validatedData = insertHolidayRequestSchema.parse(req.body);
      const holidayRequest = await mockStorage.createHolidayRequest(validatedData);
      res.status(201).json(holidayRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create holiday request" });
    }
  });

  app.put("/api/holiday-requests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertHolidayRequestSchema.parse(req.body);
      const holidayRequest = await mockStorage.updateHolidayRequest(id, validatedData);
      if (!holidayRequest) {
        return res.status(404).json({ message: "Holiday request not found" });
      }
      res.json(holidayRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update holiday request" });
    }
  });

  app.delete("/api/holiday-requests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await mockStorage.deleteHolidayRequest(id);
      if (!success) {
        return res.status(404).json({ message: "Holiday request not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete holiday request" });
    }
  });

  return app;
};

describe('Holiday Requests API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/holiday-requests', () => {
    it('returns 400 when tenantId is missing', async () => {
      const response = await request(app)
        .get('/api/holiday-requests')
        .expect(400);

      expect(response.body).toEqual({
        message: "Tenant ID is required"
      });
    });

    it('returns holiday requests for valid tenantId', async () => {
      const mockRequests = [mockHolidayRequest];
      mockStorage.getHolidayRequestsByTenant.mockResolvedValue(mockRequests);

      const response = await request(app)
        .get('/api/holiday-requests')
        .query({ tenantId: 'test-tenant' })
        .expect(200);

      expect(response.body).toEqual(mockRequests);
      expect(mockStorage.getHolidayRequestsByTenant).toHaveBeenCalledWith('test-tenant');
    });

    it('returns 500 when storage throws an error', async () => {
      mockStorage.getHolidayRequestsByTenant.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/holiday-requests')
        .query({ tenantId: 'test-tenant' })
        .expect(500);

      expect(response.body).toEqual({
        message: "Failed to fetch holiday requests"
      });
    });
  });

  describe('POST /api/holiday-requests', () => {
    const validRequestData: InsertHolidayRequest = {
      tenantId: 'test-tenant',
      requesterId: 2,
      startDate: '2025-08-01',
      endDate: '2025-08-03',
      reason: 'Family vacation',
      status: 'pending',
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
    };

    it('creates a new holiday request with valid data', async () => {
      mockStorage.createHolidayRequest.mockResolvedValue(mockHolidayRequest);

      const response = await request(app)
        .post('/api/holiday-requests')
        .send(validRequestData)
        .expect(201);

      expect(response.body).toEqual(mockHolidayRequest);
      expect(mockStorage.createHolidayRequest).toHaveBeenCalledWith(validRequestData);
    });

    it('returns 400 for invalid data with validation errors', async () => {
      const invalidData = {
        tenantId: 'test-tenant',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/holiday-requests')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Invalid data');
      expect(response.body.errors).toBeDefined();
    });

    it('validates required fields', async () => {
      const invalidData = {
        tenantId: '',
        requesterId: 'invalid', // Should be number
        startDate: '',
        endDate: '',
      };

      const response = await request(app)
        .post('/api/holiday-requests')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Invalid data');
      expect(response.body.errors).toHaveLength(4); // tenantId, requesterId, startDate, endDate
    });

    it('returns 500 when storage throws an error', async () => {
      mockStorage.createHolidayRequest.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/holiday-requests')
        .send(validRequestData)
        .expect(500);

      expect(response.body).toEqual({
        message: "Failed to create holiday request"
      });
    });
  });

  describe('PUT /api/holiday-requests/:id', () => {
    const updateData: InsertHolidayRequest = {
      tenantId: 'test-tenant',
      requesterId: 2,
      startDate: '2025-08-01',
      endDate: '2025-08-05', // Extended vacation
      reason: 'Extended family vacation',
      status: 'approved',
      reviewedBy: 1,
      reviewedAt: new Date('2025-07-15'),
      reviewNotes: 'Approved with coverage arranged',
    };

    it('updates an existing holiday request', async () => {
      const updatedRequest = { ...mockHolidayRequest, ...updateData };
      mockStorage.updateHolidayRequest.mockResolvedValue(updatedRequest);

      const response = await request(app)
        .put('/api/holiday-requests/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(updatedRequest);
      expect(mockStorage.updateHolidayRequest).toHaveBeenCalledWith(1, updateData);
    });

    it('returns 404 when holiday request is not found', async () => {
      mockStorage.updateHolidayRequest.mockResolvedValue(undefined);

      const response = await request(app)
        .put('/api/holiday-requests/999')
        .send(updateData)
        .expect(404);

      expect(response.body).toEqual({
        message: "Holiday request not found"
      });
    });

    it('returns 400 for invalid data', async () => {
      const invalidData = {
        tenantId: '',
        requesterId: 'invalid',
      };

      const response = await request(app)
        .put('/api/holiday-requests/1')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Invalid data');
    });

    it('returns 500 when storage throws an error', async () => {
      mockStorage.updateHolidayRequest.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/holiday-requests/1')
        .send(updateData)
        .expect(500);

      expect(response.body).toEqual({
        message: "Failed to update holiday request"
      });
    });
  });

  describe('DELETE /api/holiday-requests/:id', () => {
    it('deletes an existing holiday request', async () => {
      mockStorage.deleteHolidayRequest.mockResolvedValue(true);

      await request(app)
        .delete('/api/holiday-requests/1')
        .expect(204);

      expect(mockStorage.deleteHolidayRequest).toHaveBeenCalledWith(1);
    });

    it('returns 404 when holiday request is not found', async () => {
      mockStorage.deleteHolidayRequest.mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/holiday-requests/999')
        .expect(404);

      expect(response.body).toEqual({
        message: "Holiday request not found"
      });
    });

    it('returns 500 when storage throws an error', async () => {
      mockStorage.deleteHolidayRequest.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/holiday-requests/1')
        .expect(500);

      expect(response.body).toEqual({
        message: "Failed to delete holiday request"
      });
    });
  });

  describe('Schema Validation', () => {
    it('validates status field values', async () => {
      const dataWithInvalidStatus = {
        tenantId: 'test-tenant',
        requesterId: 2,
        startDate: '2025-08-01',
        endDate: '2025-08-03',
        reason: 'Test',
        status: 'invalid-status', // Invalid status value
      };

      const response = await request(app)
        .post('/api/holiday-requests')
        .send(dataWithInvalidStatus)
        .expect(400);

      expect(response.body.message).toBe('Invalid data');
    });

    it('allows optional fields to be null', async () => {
      const dataWithNullOptionals = {
        tenantId: 'test-tenant',
        requesterId: 2,
        startDate: '2025-08-01',
        endDate: '2025-08-03',
        reason: null,
        status: 'pending',
        reviewedBy: null,
        reviewedAt: null,
        reviewNotes: null,
      };

      mockStorage.createHolidayRequest.mockResolvedValue(mockHolidayRequest);

      await request(app)
        .post('/api/holiday-requests')
        .send(dataWithNullOptionals)
        .expect(201);

      expect(mockStorage.createHolidayRequest).toHaveBeenCalledWith(dataWithNullOptionals);
    });
  });
});