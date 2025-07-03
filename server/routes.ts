import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertShiftSchema, insertUserSchema, insertOpportunitySchema, insertSwapRequestSchema, insertScheduleTemplateSchema, insertAssignmentSchema, insertHolidayRequestSchema, insertBusinessProfileSchema, insertJobRoleSchema, insertLocationSchema, insertDepartmentSchema, insertOperatingHoursSchema, insertHolidayEntitlementSchema, type HolidayRequest, type InsertHolidayRequest } from "../shared/schema";
import { z } from "zod";

// Helper function to calculate days between dates
function calculateRequestDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDiff = end.getTime() - start.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
}

// Helper function to update holiday entitlements when request status changes
async function updateHolidayEntitlements(
  originalRequest: HolidayRequest, 
  updatedData: InsertHolidayRequest, 
  storage: any
): Promise<void> {
  const currentYear = new Date().getFullYear();
  const requestDays = calculateRequestDays(originalRequest.startDate, originalRequest.endDate);
  
  console.log(`ENTITLEMENTS: Request ${originalRequest.id} status change: ${originalRequest.status} → ${updatedData.status}, ${requestDays} days`);

  // Get current entitlements for the user
  const entitlements = await storage.getHolidayEntitlementByUser(
    originalRequest.tenantId, 
    originalRequest.requesterId, 
    currentYear
  );
  
  if (!entitlements) {
    console.log(`ENTITLEMENTS: No entitlement found for user ${originalRequest.requesterId}`);
    return;
  }

  let newUsedDays = entitlements.usedDays;
  let newPendingDays = entitlements.pendingDays;

  // Handle status transitions
  if (originalRequest.status === 'pending' && updatedData.status === 'approved') {
    // Pending → Approved: Move from pending to used
    newPendingDays = Math.max(0, newPendingDays - requestDays);
    newUsedDays = newUsedDays + requestDays;
    console.log(`ENTITLEMENTS: Approved - Moving ${requestDays} days from pending to used`);
  } else if (originalRequest.status === 'pending' && updatedData.status === 'rejected') {
    // Pending → Rejected: Remove from pending
    newPendingDays = Math.max(0, newPendingDays - requestDays);
    console.log(`ENTITLEMENTS: Rejected - Removing ${requestDays} days from pending`);
  } else if (originalRequest.status === 'approved' && updatedData.status === 'rejected') {
    // Approved → Rejected: Move from used back to available
    newUsedDays = Math.max(0, newUsedDays - requestDays);
    console.log(`ENTITLEMENTS: Approved→Rejected - Returning ${requestDays} days from used`);
  } else if (originalRequest.status === 'approved' && updatedData.status === 'pending') {
    // Approved → Pending: Move from used to pending
    newUsedDays = Math.max(0, newUsedDays - requestDays);
    newPendingDays = newPendingDays + requestDays;
    console.log(`ENTITLEMENTS: Approved→Pending - Moving ${requestDays} days from used to pending`);
  }

  // Update the entitlements
  await storage.updateHolidayEntitlementByUser(
    originalRequest.tenantId,
    originalRequest.requesterId,
    currentYear,
    {
      usedDays: newUsedDays,
      pendingDays: newPendingDays,
    }
  );
  
  console.log(`ENTITLEMENTS: Updated - Used: ${newUsedDays}, Pending: ${newPendingDays}`);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Shifts routes
  app.get("/api/shifts", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      const date = req.query.date as string;
      
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      let shifts;
      if (date) {
        // Filter by specific date
        shifts = await storage.getShiftsByTenantAndDate(tenantId, date);
      } else {
        // Get all shifts for tenant
        shifts = await storage.getShiftsByTenant(tenantId);
      }
      
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
      
      // Guard against undefined or invalid IDs
      if (isNaN(id) || req.params.id === 'undefined') {
        return res.status(400).json({ message: "Invalid shift ID provided" });
      }
      
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

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.updateUser(id, validatedData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
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

  // Utility function for backward-compatible status normalization
  const normalizeHolidayRequestStatus = (status: string) => {
    const statusMap: Record<string, "pending" | "approved" | "rejected"> = {
      "pending": "pending",
      "approved": "approved", 
      "rejected": "rejected",
      "declined": "rejected", // Handle legacy seed data
    };
    return statusMap[status] || "pending";
  };

  // Utility function for adding default values for new fields
  const normalizeHolidayRequestData = (data: any) => {
    return {
      ...data,
      status: normalizeHolidayRequestStatus(data.status || "pending"),
      type: data.type || "vacation",
      priority: data.priority || "normal",
    };
  };

  // Holiday Requests routes
  app.get("/api/holiday-requests", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const holidayRequests = await storage.getHolidayRequestsByTenant(tenantId);
      // Normalize data for backward compatibility
      const normalizedRequests = holidayRequests.map(request => ({
        ...request,
        status: normalizeHolidayRequestStatus(request.status),
        type: request.type || "vacation",
        priority: request.priority || "normal",
      }));
      res.json(normalizedRequests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch holiday requests" });
    }
  });

  app.post("/api/holiday-requests", async (req, res) => {
    try {
      const normalizedData = normalizeHolidayRequestData(req.body);
      const validatedData = insertHolidayRequestSchema.parse(normalizedData);
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
      const normalizedData = normalizeHolidayRequestData(req.body);
      const validatedData = insertHolidayRequestSchema.parse(normalizedData);
      
      // Get the original request to compare status changes
      const originalRequest = await storage.getHolidayRequest(id);
      if (!originalRequest) {
        return res.status(404).json({ message: "Holiday request not found" });
      }
      
      const holidayRequest = await storage.updateHolidayRequest(id, validatedData);
      if (!holidayRequest) {
        return res.status(404).json({ message: "Holiday request not found" });
      }

      // Update holiday entitlements if status changed
      if (originalRequest.status !== validatedData.status) {
        await updateHolidayEntitlements(originalRequest, validatedData, storage);
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

  // Holiday Entitlements routes
  app.get("/api/holiday-entitlements", async (req, res) => {
    try {
      console.log('OWNER: fetching holiday entitlements…');
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const entitlements = await storage.getHolidayEntitlementsByTenant(tenantId);
      console.log('OWNER: entitlement data →', entitlements);
      res.json(entitlements);
    } catch (error) {
      console.error('OWNER: entitlement fetch failed', error);
      res.status(500).json({ message: "Failed to fetch holiday entitlements" });
    }
  });

  app.put("/api/holiday-entitlements/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const tenantId = req.body.tenantId as string;
      const year = req.body.year || new Date().getFullYear();
      
      console.log(`OWNER: saving entitlement for ${userId} → ${req.body.entitlementDays}`);
      
      const entitlement = await storage.updateHolidayEntitlementByUser(tenantId, userId, year, req.body);
      if (!entitlement) {
        return res.status(404).json({ message: "Holiday entitlement not found" });
      }
      res.json(entitlement);
    } catch (error) {
      console.error('OWNER: entitlement save failed', error);
      res.status(500).json({ message: "Failed to update holiday entitlement" });
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
      console.error("Schedule templates error:", error);
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

  // Generate shifts from template
  app.post("/api/schedule-templates/:id/use", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const { startDate, endDate } = req.body;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      const createdShifts = await storage.generateShiftsFromTemplate(templateId, startDate, endDate);
      
      // Count assigned vs opportunity shifts
      const assignedShifts = createdShifts.filter(shift => shift.assignedTo !== null);
      const opportunityShifts = createdShifts.filter(shift => shift.assignedTo === null);
      
      res.status(201).json({ 
        assignedCreated: assignedShifts.length,
        opportunitiesCreated: opportunityShifts.length,
        totalShifts: createdShifts.length,
        shifts: createdShifts
      });
    } catch (error) {
      console.error("Failed to generate shifts from template:", error);
      res.status(500).json({ message: "Failed to generate shifts from template" });
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

  // Business Profile routes
  app.get("/api/business-profile", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const businessProfile = await storage.getBusinessProfile(tenantId);
      if (!businessProfile) {
        return res.status(404).json({ message: "Business profile not found" });
      }
      res.json(businessProfile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business profile" });
    }
  });

  app.post("/api/business-profile", async (req, res) => {
    try {
      const result = insertBusinessProfileSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid business profile data", errors: result.error.issues });
      }
      
      const businessProfile = await storage.createBusinessProfile(result.data);
      res.status(201).json(businessProfile);
    } catch (error) {
      res.status(500).json({ message: "Failed to create business profile" });
    }
  });

  app.put("/api/business-profile", async (req, res) => {
    try {
      const result = insertBusinessProfileSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid business profile data", errors: result.error.issues });
      }
      
      const businessProfile = await storage.updateBusinessProfile(result.data.tenantId, result.data);
      if (!businessProfile) {
        return res.status(404).json({ message: "Business profile not found" });
      }
      res.json(businessProfile);
    } catch (error) {
      res.status(500).json({ message: "Failed to update business profile" });
    }
  });

  // Job Roles routes
  app.get("/api/job-roles", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const jobRoles = await storage.getJobRolesByTenant(tenantId);
      res.json(jobRoles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job roles" });
    }
  });

  app.post("/api/job-roles", async (req, res) => {
    try {
      const result = insertJobRoleSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid job role data", errors: result.error.issues });
      }
      
      const jobRole = await storage.createJobRole(result.data);
      res.status(201).json(jobRole);
    } catch (error) {
      res.status(500).json({ message: "Failed to create job role" });
    }
  });

  app.put("/api/job-roles/:id", async (req, res) => {
    try {
      const result = insertJobRoleSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid job role data", errors: result.error.issues });
      }
      
      const id = parseInt(req.params.id);
      const jobRole = await storage.updateJobRole(id, result.data);
      if (!jobRole) {
        return res.status(404).json({ message: "Job role not found" });
      }
      res.json(jobRole);
    } catch (error) {
      res.status(500).json({ message: "Failed to update job role" });
    }
  });

  app.delete("/api/job-roles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteJobRole(id);
      if (!success) {
        return res.status(404).json({ message: "Job role not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete job role" });
    }
  });

  // Locations routes
  app.get("/api/locations", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const locations = await storage.getLocationsByTenant(tenantId);
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  app.post("/api/locations", async (req, res) => {
    try {
      const result = insertLocationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid location data", errors: result.error.issues });
      }
      
      const location = await storage.createLocation(result.data);
      res.status(201).json(location);
    } catch (error) {
      res.status(500).json({ message: "Failed to create location" });
    }
  });

  app.put("/api/locations/:id", async (req, res) => {
    try {
      const result = insertLocationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid location data", errors: result.error.issues });
      }
      
      const id = parseInt(req.params.id);
      const location = await storage.updateLocation(id, result.data);
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      res.json(location);
    } catch (error) {
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  app.delete("/api/locations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteLocation(id);
      if (!success) {
        return res.status(404).json({ message: "Location not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete location" });
    }
  });

  // Departments routes
  app.get("/api/departments", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const departments = await storage.getDepartmentsByTenant(tenantId);
      res.json(departments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  app.post("/api/departments", async (req, res) => {
    try {
      const result = insertDepartmentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid department data", errors: result.error.issues });
      }
      
      const department = await storage.createDepartment(result.data);
      res.status(201).json(department);
    } catch (error) {
      res.status(500).json({ message: "Failed to create department" });
    }
  });

  app.put("/api/departments/:id", async (req, res) => {
    try {
      const result = insertDepartmentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid department data", errors: result.error.issues });
      }
      
      const id = parseInt(req.params.id);
      const department = await storage.updateDepartment(id, result.data);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      res.json(department);
    } catch (error) {
      res.status(500).json({ message: "Failed to update department" });
    }
  });

  app.delete("/api/departments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDepartment(id);
      if (!success) {
        return res.status(404).json({ message: "Department not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete department" });
    }
  });

  // Operating Hours routes
  app.get("/api/operating-hours", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const operatingHours = await storage.getOperatingHoursByTenant(tenantId);
      res.json(operatingHours);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch operating hours" });
    }
  });

  app.post("/api/operating-hours", async (req, res) => {
    try {
      const result = insertOperatingHoursSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid operating hours data", errors: result.error.issues });
      }
      
      const operatingHours = await storage.createOperatingHours(result.data);
      res.status(201).json(operatingHours);
    } catch (error) {
      res.status(500).json({ message: "Failed to create operating hours" });
    }
  });

  app.put("/api/operating-hours/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertOperatingHoursSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid operating hours data", errors: result.error.issues });
      }
      
      const operatingHours = await storage.updateOperatingHours(id, result.data);
      if (!operatingHours) {
        return res.status(404).json({ message: "Operating hours not found" });
      }
      res.json(operatingHours);
    } catch (error) {
      res.status(500).json({ message: "Failed to update operating hours" });
    }
  });

  app.delete("/api/operating-hours/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteOperatingHours(id);
      if (!success) {
        return res.status(404).json({ message: "Operating hours not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete operating hours" });
    }
  });

  // Subscription routes
  app.get("/api/subscription", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const subscription = await storage.getSubscription(tenantId);
      res.json(subscription);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.get("/api/subscription/plans", async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  app.post("/api/subscription", async (req, res) => {
    try {
      const tenantId = req.body.tenantId;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const subscription = await storage.createSubscription(req.body);
      res.status(201).json(subscription);
    } catch (error) {
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  app.put("/api/subscription", async (req, res) => {
    try {
      const tenantId = req.body.tenantId;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const subscription = await storage.updateSubscription(tenantId, req.body);
      res.json(subscription);
    } catch (error) {
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  app.post("/api/subscription/change-plan", async (req, res) => {
    try {
      const { tenantId, planId } = req.body;
      if (!tenantId || !planId) {
        return res.status(400).json({ message: "Tenant ID and Plan ID are required" });
      }
      
      const subscription = await storage.updateSubscription(tenantId, { planId });
      res.json(subscription);
    } catch (error) {
      res.status(500).json({ message: "Failed to change subscription plan" });
    }
  });

  app.get("/api/billing-info", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const billingInfo = await storage.getBillingInfo(tenantId);
      res.json(billingInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch billing info" });
    }
  });

  app.get("/api/invoices", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const invoices = await storage.getInvoicesByTenant(tenantId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/usage-metrics", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const usageMetrics = await storage.getUsageMetrics(tenantId);
      res.json(usageMetrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch usage metrics" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/reports", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const reports = await storage.getAnalyticsReportsByTenant(tenantId);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics reports" });
    }
  });

  app.post("/api/analytics/reports", async (req, res) => {
    try {
      const tenantId = req.body.tenantId;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const report = await storage.createAnalyticsReport(req.body);
      res.status(201).json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to create analytics report" });
    }
  });

  app.get("/api/analytics/metrics", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const metrics = await storage.getAnalyticsMetricsByTenant(tenantId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics metrics" });
    }
  });

  app.get("/api/activity-logs", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const logs = await storage.getActivityLogsByTenant(tenantId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // Performance metrics routes
  app.get("/api/performance-metrics", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      const userId = req.query.userId as string;
      
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      let metrics;
      if (userId) {
        metrics = await storage.getPerformanceMetricsByUser(tenantId, parseInt(userId));
      } else {
        metrics = await storage.getPerformanceMetricsByTenant(tenantId);
      }
      
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch performance metrics" });
    }
  });

  // Shift Policy routes
  app.get("/api/shift-policy", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const policy = await storage.getShiftPolicyByTenant(tenantId);
      if (!policy) {
        // Return default policy if none exists
        const defaultPolicy = {
          tenantId,
          minNoticeHours: 24,
          maxAdvanceBookingDays: 30,
          cancellationDeadlineHours: 4,
          maxStrikePoints: 5,
          strikePointsNoShow: 2,
          strikePointsLateCancellation: 1,
        };
        return res.json(defaultPolicy);
      }
      
      res.json(policy);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shift policy" });
    }
  });

  app.put("/api/shift-policy", async (req, res) => {
    try {
      const normalizedData = {
        tenantId: req.body.tenantId,
        minNoticeHours: parseInt(req.body.minNoticeHours),
        maxAdvanceBookingDays: parseInt(req.body.maxAdvanceBookingDays),
        cancellationDeadlineHours: parseInt(req.body.cancellationDeadlineHours),
        maxStrikePoints: parseInt(req.body.maxStrikePoints),
        strikePointsNoShow: parseInt(req.body.strikePointsNoShow),
        strikePointsLateCancellation: parseInt(req.body.strikePointsLateCancellation),
      };
      
      if (!normalizedData.tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const policy = await storage.upsertShiftPolicy(normalizedData);
      res.json(policy);
    } catch (error) {
      console.error("Shift policy update error:", error);
      res.status(500).json({ message: "Failed to update shift policy" });
    }
  });

  // Notification Settings routes
  app.get("/api/notification-settings", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      // Mock notification settings for now
      const notificationSettings = [
        {
          id: 1,
          tenantId,
          type: "shift_assigned",
          enabled: true,
          method: "email",
          description: "Notify when shifts are assigned"
        },
        {
          id: 2,
          tenantId,
          type: "shift_reminder",
          enabled: true,
          method: "push",
          description: "Send shift reminders 2 hours before"
        },
        {
          id: 3,
          tenantId,
          type: "swap_request",
          enabled: false,
          method: "email",
          description: "Notify about shift swap requests"
        }
      ];
      
      res.json(notificationSettings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notification settings" });
    }
  });

  app.post("/api/notification-settings", async (req, res) => {
    try {
      const tenantId = req.body.tenantId;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const newSetting = {
        id: Date.now(),
        tenantId,
        ...req.body,
        createdAt: new Date().toISOString()
      };
      
      res.status(201).json(newSetting);
    } catch (error) {
      res.status(500).json({ message: "Failed to create notification setting" });
    }
  });

  app.patch("/api/notification-settings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tenantId = req.body.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const updatedSetting = {
        id,
        tenantId,
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      
      res.json(updatedSetting);
    } catch (error) {
      res.status(500).json({ message: "Failed to update notification setting" });
    }
  });

  // Debug endpoint to clear all data
  app.delete("/api/debug/clear-all", async (req, res) => {
    try {
      // Clear all data by calling storage clear methods
      await storage.clearAllData();
      res.json({ message: "All data cleared successfully" });
    } catch (error) {
      console.error("Failed to clear data:", error);
      res.status(500).json({ message: "Failed to clear data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
