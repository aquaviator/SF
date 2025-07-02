import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertShiftSchema, insertUserSchema, insertOpportunitySchema, insertSwapRequestSchema, insertScheduleTemplateSchema, insertAssignmentSchema, insertHolidayRequestSchema } from "../shared/schema";
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
      
      res.json({ message: "Shift deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete shift" });
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

  // Assignments routes
  app.get("/api/assignments", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const assignments = await storage.getAssignmentsByTenant(tenantId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.post("/api/assignments", async (req, res) => {
    try {
      const validatedData = insertAssignmentSchema.parse(req.body);
      const assignment = await storage.createAssignment(validatedData);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  app.put("/api/assignments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertAssignmentSchema.parse(req.body);
      const assignment = await storage.updateAssignment(id, validatedData);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update assignment" });
    }
  });

  app.delete("/api/assignments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAssignment(id);
      if (!success) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete assignment" });
    }
  });

  // Holiday Requests routes
  app.get("/api/holiday-requests", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const holidayRequests = await storage.getHolidayRequestsByTenant(tenantId);
      res.json(holidayRequests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch holiday requests" });
    }
  });

  app.post("/api/holiday-requests", async (req, res) => {
    try {
      const validatedData = insertHolidayRequestSchema.parse(req.body);
      const holidayRequest = await storage.createHolidayRequest(validatedData);
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
      const holidayRequest = await storage.updateHolidayRequest(id, validatedData);
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
      const success = await storage.deleteHolidayRequest(id);
      if (!success) {
        return res.status(404).json({ message: "Holiday request not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete holiday request" });
    }
  });

  // Schedule Templates routes
  app.get("/api/schedule-templates", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const templates = await storage.getScheduleTemplatesByTenant(tenantId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch schedule templates" });
    }
  });

  app.post("/api/schedule-templates", async (req, res) => {
    try {
      const result = insertScheduleTemplateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid template data", errors: result.error.issues });
      }
      
      const template = await storage.createScheduleTemplate(result.data);
      res.status(201).json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to create schedule template" });
    }
  });

  app.put("/api/schedule-templates/:id", async (req, res) => {
    try {
      const result = insertScheduleTemplateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid template data", errors: result.error.issues });
      }
      
      const id = parseInt(req.params.id);
      const template = await storage.updateScheduleTemplate(id, result.data);
      if (!template) {
        return res.status(404).json({ message: "Schedule template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to update schedule template" });
    }
  });

  app.delete("/api/schedule-templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteScheduleTemplate(id);
      if (!success) {
        return res.status(404).json({ message: "Schedule template not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete schedule template" });
    }
  });

  // Time entry routes for clock-in/out functionality
  app.get("/api/time-entries", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const entries = await storage.getTimeEntriesByTenant(tenantId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch time entries" });
    }
  });

  app.get("/api/time-entries/active", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      const userId = req.query.userId as string;
      
      if (!tenantId || !userId) {
        return res.status(400).json({ message: "Tenant ID and User ID are required" });
      }
      
      const entry = await storage.getActiveTimeEntry(tenantId, parseInt(userId));
      res.json(entry || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active time entry" });
    }
  });

  app.post("/api/time-entries", async (req, res) => {
    try {
      const validatedData = req.body; // Using any for now until we fix schema
      const entry = await storage.createTimeEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to create time entry" });
    }
  });

  app.patch("/api/time-entries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = req.body; // Using any for now
      const entry = await storage.updateTimeEntry(id, validatedData);
      if (!entry) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to update time entry" });
    }
  });

  // Operating Hours routes
  app.get("/api/operating-hours", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      // Mock data for operating hours
      const operatingHours = [
        { day: "Monday", open: "09:00", close: "17:00", isOpen: true },
        { day: "Tuesday", open: "09:00", close: "17:00", isOpen: true },
        { day: "Wednesday", open: "09:00", close: "17:00", isOpen: true },
        { day: "Thursday", open: "09:00", close: "17:00", isOpen: true },
        { day: "Friday", open: "09:00", close: "17:00", isOpen: true },
        { day: "Saturday", open: "10:00", close: "16:00", isOpen: true },
        { day: "Sunday", open: "12:00", close: "16:00", isOpen: false }
      ];
      
      res.json(operatingHours);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch operating hours" });
    }
  });

  app.post("/api/operating-hours", async (req, res) => {
    try {
      const tenantId = req.body.tenantId;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      // Mock response for updating operating hours
      res.json({ message: "Operating hours updated successfully", data: req.body });
    } catch (error) {
      res.status(500).json({ message: "Failed to update operating hours" });
    }
  });

  // Business Profile routes
  app.get("/api/business-profile", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      // Mock business profile data
      const businessProfile = {
        id: 1,
        tenantId,
        name: "Acme Corporation",
        description: "Leading provider of innovative solutions",
        address: "123 Business Street, City, State 12345",
        phone: "+1 (555) 123-4567",
        email: "contact@acme-corp.com",
        website: "https://acme-corp.com",
        industry: "Technology",
        timezone: "America/New_York"
      };
      
      res.json(businessProfile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business profile" });
    }
  });

  app.post("/api/business-profile", async (req, res) => {
    try {
      const tenantId = req.body.tenantId;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      // Mock response for creating/updating business profile
      const businessProfile = {
        id: 1,
        tenantId,
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      
      res.status(201).json(businessProfile);
    } catch (error) {
      res.status(500).json({ message: "Failed to update business profile" });
    }
  });

  // Shift Policies routes
  app.get("/api/shift-policies", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      // Mock shift policies data
      const shiftPolicies = [
        {
          id: 1,
          tenantId,
          name: "Minimum Notice Period",
          description: "Minimum time required to claim or cancel a shift",
          value: "24",
          unit: "hours",
          isActive: true
        },
        {
          id: 2,
          tenantId,
          name: "Maximum Daily Hours",
          description: "Maximum hours a staff member can work in a day",
          value: "8",
          unit: "hours",
          isActive: true
        },
        {
          id: 3,
          tenantId,
          name: "Break Duration",
          description: "Required break time for shifts over 6 hours",
          value: "30",
          unit: "minutes",
          isActive: true
        }
      ];
      
      res.json(shiftPolicies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shift policies" });
    }
  });

  app.patch("/api/shift-policies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tenantId = req.body.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      // Mock response for updating shift policy
      const updatedPolicy = {
        id,
        tenantId,
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      
      res.json(updatedPolicy);
    } catch (error) {
      res.status(500).json({ message: "Failed to update shift policy" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
