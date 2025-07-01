import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertShiftSchema, insertUserSchema, insertOpportunitySchema, insertSwapRequestSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Shifts routes
  app.get("/api/shifts", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const shifts = await storage.getShiftsByTenant(tenantId);
      res.json(shifts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shifts" });
    }
  });

  app.get("/api/my-shifts", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      const userId = req.query.userId as string;
      
      if (!tenantId || !userId) {
        return res.status(400).json({ message: "Tenant ID and User ID are required" });
      }
      
      const shifts = await storage.getShiftsByUser(tenantId, parseInt(userId));
      res.json(shifts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user shifts" });
    }
  });

  app.post("/api/shifts", async (req, res) => {
    try {
      const validatedData = insertShiftSchema.parse(req.body);
      const shift = await storage.createShift(validatedData);
      res.status(201).json(shift);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create shift" });
    }
  });

  app.put("/api/shifts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertShiftSchema.parse(req.body);
      const shift = await storage.updateShift(id, validatedData);
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      res.json(shift);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update shift" });
    }
  });

  app.delete("/api/shifts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteShift(id);
      if (!success) {
        return res.status(404).json({ message: "Shift not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete shift" });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Staff routes
  app.get("/api/staff", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const staff = await storage.getStaffByTenant(tenantId);
      res.json(staff);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.post("/api/staff", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create staff member" });
    }
  });

  app.put("/api/staff/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.updateUser(id, validatedData);
      if (!user) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update staff member" });
    }
  });

  app.delete("/api/staff/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete staff member" });
    }
  });

  // My shifts routes
  app.get("/api/my-shifts", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      const userId = req.query.userId as string;
      
      if (!tenantId || !userId) {
        return res.status(400).json({ message: "Tenant ID and User ID are required" });
      }
      
      const shifts = await storage.getShiftsByUser(tenantId, parseInt(userId));
      res.json(shifts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user shifts" });
    }
  });

  // Opportunities routes
  app.get("/api/opportunities", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const opportunities = await storage.getOpportunitiesByTenant(tenantId);
      res.json(opportunities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch opportunities" });
    }
  });

  app.post("/api/opportunities", async (req, res) => {
    try {
      const validatedData = insertOpportunitySchema.parse(req.body);
      const opportunity = await storage.createOpportunity(validatedData);
      res.status(201).json(opportunity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create opportunity" });
    }
  });

  app.post("/api/opportunities/:id/apply", async (req, res) => {
    try {
      const tenantId = req.headers.tenantid as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const id = parseInt(req.params.id);
      const opportunity = await storage.getOpportunity(id);
      if (!opportunity) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
      
      // For now, just return success - could implement actual application logic
      res.json({ message: "Successfully applied to opportunity", opportunityId: id });
    } catch (error) {
      res.status(500).json({ message: "Failed to apply to opportunity" });
    }
  });

  // Swap requests routes
  app.get("/api/swap-requests", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const swapRequests = await storage.getSwapRequestsByTenant(tenantId);
      res.json(swapRequests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch swap requests" });
    }
  });

  app.post("/api/swap-requests", async (req, res) => {
    try {
      const validatedData = insertSwapRequestSchema.parse(req.body);
      const swapRequest = await storage.createSwapRequest(validatedData);
      res.status(201).json(swapRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create swap request" });
    }
  });

  app.put("/api/swap-requests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSwapRequestSchema.parse(req.body);
      const swapRequest = await storage.updateSwapRequest(id, validatedData);
      if (!swapRequest) {
        return res.status(404).json({ message: "Swap request not found" });
      }
      res.json(swapRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update swap request" });
    }
  });

  app.delete("/api/swap-requests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSwapRequest(id);
      if (!success) {
        return res.status(404).json({ message: "Swap request not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete swap request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
