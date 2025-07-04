import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertShiftSchema, insertUserSchema, insertOpportunitySchema, insertSwapRequestSchema, insertScheduleTemplateSchema, insertAssignmentSchema, insertHolidayRequestSchema, insertBusinessProfileSchema, insertJobRoleSchema, insertLocationSchema, insertDepartmentSchema, insertOperatingHoursSchema, insertHolidayEntitlementSchema, insertStaffStrikeSchema, type HolidayRequest, type InsertHolidayRequest } from "../shared/schema";
import { z } from "zod";
import { strikeService } from "./strike-service";

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

  app.post("/api/shifts", async (req, res) => {
    try {
      const validatedData = insertShiftSchema.parse(req.body);
      
      // Check for scheduling conflicts if a user is assigned
      if (validatedData.assignedTo && validatedData.tenantId && validatedData.date) {
        const conflictingShifts = await storage.getShiftsByUserAndDate(
          validatedData.tenantId, 
          validatedData.assignedTo, 
          validatedData.date
        );
        
        if (conflictingShifts.length > 0) {
          return res.status(400).json({ 
            message: "Schedule conflict: User already has a shift assigned on this date",
            conflictingShifts: conflictingShifts.map(s => ({
              id: s.id,
              role: s.role,
              startTime: s.startTime,
              endTime: s.endTime,
              location: s.location
            }))
          });
        }
      }
      
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
      
      // Check for scheduling conflicts if assignedTo is changing
      if (validatedData.assignedTo && validatedData.tenantId && validatedData.date) {
        const conflictingShifts = await storage.getShiftsByUserAndDate(
          validatedData.tenantId, 
          validatedData.assignedTo, 
          validatedData.date
        );
        
        // Filter out the current shift being updated
        const otherShifts = conflictingShifts.filter(s => s.id !== id);
        
        if (otherShifts.length > 0) {
          return res.status(400).json({ 
            message: "Schedule conflict: User already has a shift assigned on this date",
            conflictingShifts: otherShifts.map(s => ({
              id: s.id,
              role: s.role,
              startTime: s.startTime,
              endTime: s.endTime,
              location: s.location
            }))
          });
        }
      }
      
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
      
      // Fetch shifts with assignmentType="opportunity"
      const opportunityShifts = await storage.getShiftsByTenantAndType(tenantId, "opportunity");
      res.json(opportunityShifts);
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

  app.post("/api/opportunities/:id/claim", async (req, res) => {
    try {
      const tenantId = req.body.tenantId as string;
      const userId = req.body.userId as number;
      
      if (!tenantId || !userId) {
        return res.status(400).json({ message: "Tenant ID and User ID are required" });
      }
      
      const id = parseInt(req.params.id);
      const opportunity = await storage.getShift(id);
      
      if (!opportunity) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
      
      if (opportunity.status !== "open") {
        return res.status(400).json({ message: "Opportunity is no longer available" });
      }
      
      if (opportunity.assignmentType !== "opportunity") {
        return res.status(400).json({ message: "This is not an opportunity shift" });
      }
      
      // Check if user can claim shifts (strike system validation)
      const canClaim = await strikeService.canClaimShift(userId.toString(), tenantId);
      if (!canClaim.canClaim) {
        return res.status(403).json({ message: canClaim.reason || "Cannot claim shifts due to strikes" });
      }

      // Check for scheduling conflicts
      const conflictingShifts = await storage.getShiftsByUserAndDate(tenantId, userId, opportunity.date);
      if (conflictingShifts.length > 0) {
        return res.status(400).json({ 
          message: "Schedule conflict: You already have a shift assigned on this date",
          conflictingShifts: conflictingShifts.map(s => ({
            id: s.id,
            role: s.role,
            startTime: s.startTime,
            endTime: s.endTime,
            location: s.location
          }))
        });
      }
      
      // Convert opportunity to confirmed shift by updating the shift
      const updatedShift = await storage.updateShift(id, {
        ...opportunity,
        assignedTo: userId,
        assignmentType: "assigned",
        status: "confirmed"
      });
      
      res.json({ 
        message: "Successfully claimed opportunity", 
        shift: updatedShift 
      });
    } catch (error) {
      console.error("Error claiming opportunity:", error);
      res.status(500).json({ message: "Failed to claim opportunity" });
    }
  });

  // Swap requests routes
  app.get("/api/swap-requests", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      const userId = req.query.userId as string;
      const userRole = req.query.userRole as string;
      
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      let swapRequests;
      if (userRole === "staff" && userId) {
        // Staff users see only requests involving them (either as requester or target)
        swapRequests = await storage.getSwapRequestsByUser(tenantId, parseInt(userId));
      } else {
        // Owner users see all tenant requests
        swapRequests = await storage.getSwapRequestsByTenant(tenantId);
      }
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

  // New policy-driven swap action endpoint
  app.post("/api/shift-actions/request-swap", async (req, res) => {
    try {
      const { tenantId, shiftId, requestedBy, reason } = req.body;
      
      if (!tenantId || !shiftId || !requestedBy) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const { shiftSwapService } = await import("./shift-swap-service");
      const result = await shiftSwapService.requestSwap({
        tenantId,
        shiftId: parseInt(shiftId),
        requestedBy: parseInt(requestedBy),
        reason
      });

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error processing swap request:", error);
      res.status(500).json({ 
        success: false, 
        action: "denied", 
        message: "Failed to process swap request" 
      });
    }
  });

  // Accept a peer swap
  app.post("/api/shift-actions/accept-swap", async (req, res) => {
    try {
      const { swapRequestId, acceptingUserId } = req.body;
      
      const { shiftSwapService } = await import("./shift-swap-service");
      const result = await shiftSwapService.acceptSwap(
        parseInt(swapRequestId), 
        parseInt(acceptingUserId)
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error accepting swap:", error);
      res.status(500).json({ 
        success: false, 
        action: "denied", 
        message: "Failed to accept swap" 
      });
    }
  });

  // Manager escalation actions
  app.post("/api/shift-actions/manager-resolve", async (req, res) => {
    try {
      const { swapRequestId, managerId, action, newUserId } = req.body;
      
      const { shiftSwapService } = await import("./shift-swap-service");
      const result = await shiftSwapService.managerApprove(
        parseInt(swapRequestId),
        parseInt(managerId),
        action,
        newUserId ? parseInt(newUserId) : undefined
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error resolving escalated swap:", error);
      res.status(500).json({ 
        success: false, 
        action: "denied", 
        message: "Failed to resolve escalated swap" 
      });
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
      const userId = req.query.userId as string;
      const userRole = req.query.userRole as string;
      
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      let assignments;
      if (userRole === "staff" && userId) {
        // Staff users see only their own assignments
        assignments = await storage.getAssignmentsByUser(tenantId, parseInt(userId));
      } else {
        // Owner users see all tenant assignments
        assignments = await storage.getAssignmentsByTenant(tenantId);
      }
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
      const userId = req.query.userId as string;
      const userRole = req.query.userRole as string;
      
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      let holidayRequests;
      if (userRole === "staff" && userId) {
        // Staff users see only their own requests
        holidayRequests = await storage.getHolidayRequestsByUser(tenantId, parseInt(userId));
      } else {
        // Owner users see all tenant requests
        holidayRequests = await storage.getHolidayRequestsByTenant(tenantId);
      }
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

  // Time Entry Override route for owners
  app.patch("/api/time-entries/:id/override", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { in: clockInTime, out: clockOutTime, note } = req.body;
      
      // Validate request body - clock-out is now optional for active entries
      if (!clockInTime || !note) {
        return res.status(400).json({ message: "Clock in time and note are required" });
      }
      
      // Get the existing time entry to validate tenant access
      const existingEntry = await storage.getTimeEntryById(id);
      if (!existingEntry) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      
      // TODO: Add role validation - ensure caller has "owner" role for the entry's tenant
      // This would require passing user context or adding authentication middleware
      
      // Update the time entry with override data
      const updateData: any = {
        tenantId: existingEntry.tenantId,
        userId: existingEntry.userId,
        clockInTime: new Date(clockInTime),
        overrideNote: note,
        status: "adjusted" as const,
        adjustedAt: new Date(),
        // TODO: Add adjustedBy when user context is available
      };

      // Only update clock-out time if provided
      if (clockOutTime) {
        updateData.clockOutTime = new Date(clockOutTime);
      }
      
      const updatedEntry = await storage.updateTimeEntry(id, updateData);
      if (!updatedEntry) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      
      const logMessage = clockOutTime 
        ? `TIME_ENTRY_OVERRIDE: Entry ${id} overridden - ${clockInTime} to ${clockOutTime}`
        : `TIME_ENTRY_OVERRIDE: Entry ${id} clock-in overridden - ${clockInTime} (clock-out unchanged)`;
      console.log(logMessage);
      res.json(updatedEntry);
    } catch (error) {
      console.error("Override time entry error:", error);
      res.status(500).json({ message: "Failed to override time entry" });
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

  // Activity logs route
  app.get("/api/activity-logs", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      console.log("📝 FETCH_ACTIVITY_LOGS", { tenantId, timestamp: new Date() });
      
      const activityLogs = await storage.getActivityLogsByTenant(tenantId);
      
      console.log("✅ ACTIVITY_LOGS_SUCCESS", { 
        tenantId, 
        logCount: activityLogs.length,
        timestamp: new Date() 
      });
      
      res.json(activityLogs);
    } catch (error) {
      console.error("❌ ACTIVITY_LOGS_ERROR", { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: "Failed to fetch activity logs" });
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
      console.log("=== SHIFT POLICY UPDATE DEBUG ===");
      console.log("Raw request body:", JSON.stringify(req.body, null, 2));
      
      const normalizedData = {
        tenantId: req.body.tenantId,
        minNoticeHours: parseInt(req.body.minNoticeHours),
        maxAdvanceBookingDays: parseInt(req.body.maxAdvanceBookingDays),
        cancellationDeadlineHours: parseInt(req.body.cancellationDeadlineHours),
        maxStrikePoints: parseInt(req.body.maxStrikePoints),
        strikePointsNoShow: parseInt(req.body.strikePointsNoShow),
        strikePointsLateCancellation: parseInt(req.body.strikePointsLateCancellation),
        resetPeriodDays: parseInt(req.body.resetPeriodDays),
        lateGracePeriodMinutes: parseInt(req.body.lateGracePeriodMinutes),
        clockInBufferMinutes: parseInt(req.body.clockInBufferMinutes),
        clockOutBufferMinutes: parseInt(req.body.clockOutBufferMinutes),
      };
      
      console.log("Normalized data for database:", JSON.stringify(normalizedData, null, 2));
      
      if (!normalizedData.tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const policy = await storage.upsertShiftPolicy(normalizedData);
      console.log("Database response:", JSON.stringify(policy, null, 2));
      console.log("=== END SHIFT POLICY UPDATE DEBUG ===");
      
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

  // Time Entries routes
  app.get("/api/time-entries", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      const userId = req.query.userId as string;
      const date = req.query.date as string;
      
      console.log("Time entries request:", { tenantId, userId, date });
      
      if (!tenantId || !userId) {
        return res.status(400).json({ message: "Tenant ID and User ID are required" });
      }
      
      let timeEntries;
      if (date) {
        console.log("Fetching time entries by user and date");
        timeEntries = await storage.getTimeEntriesByUserAndDate(tenantId, parseInt(userId), date);
      } else {
        console.log("Fetching time entries by user");
        timeEntries = await storage.getTimeEntriesByUser(tenantId, parseInt(userId));
      }
      
      console.log("Time entries result:", timeEntries);
      res.json(timeEntries || []);
    } catch (error) {
      console.error("Get time entries error:", error);
      console.error("Error details:", error?.message || error);
      console.error("Stack trace:", error?.stack);
      res.status(500).json({ message: "Failed to fetch time entries", error: error?.message || "Unknown error" });
    }
  });

  app.post("/api/time-entries", async (req, res) => {
    try {
      const timeEntryData = {
        tenantId: req.body.tenantId,
        userId: parseInt(req.body.userId),
        date: req.body.date,
        clockInTime: req.body.clockInTime,
        status: "clocked_in",
        shiftId: req.body.shiftId || null,
      };
      
      if (!timeEntryData.tenantId || !timeEntryData.userId || !timeEntryData.date) {
        return res.status(400).json({ message: "Tenant ID, User ID, and date are required" });
      }
      
      const timeEntry = await storage.createTimeEntry(timeEntryData);
      res.status(201).json(timeEntry);
    } catch (error) {
      console.error("Create time entry error:", error);
      res.status(500).json({ message: "Failed to create time entry" });
    }
  });

  app.put("/api/time-entries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = {
        tenantId: req.body.tenantId,
        status: req.body.status || "clocked_out",
        userId: req.body.userId,
        clockOutTime: req.body.clockOutTime,
        breakMinutes: req.body.breakMinutes,
        notes: req.body.notes,
      };
      
      const timeEntry = await storage.updateTimeEntry(id, updateData);
      if (!timeEntry) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      
      res.json(timeEntry);
    } catch (error) {
      console.error("Update time entry error:", error);
      res.status(500).json({ message: "Failed to update time entry" });
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

  // Staff strikes endpoints
  app.get("/api/staff/:userId/strikes", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const tenantId = req.query.tenantId as string;
      
      console.log("🏷️ GET_STRIKES", { userId, timestamp: new Date() });
      
      if (!tenantId) {
        return res.status(400).json({ message: "tenantId is required" });
      }
      
      const strikes = await storage.getStaffStrikesByUser(tenantId, userId);
      const totalPoints = await storage.getTotalStrikePoints(tenantId, userId);
      
      res.json({ 
        totalPoints, 
        strikes: strikes.map(strike => ({
          id: strike.id,
          points: strike.points,
          reason: strike.reason,
          issuedAt: strike.issuedAt,
          notes: strike.notes,
          isActive: strike.isActive
        }))
      });
    } catch (error) {
      console.error("Error getting strikes:", error);
      res.status(500).json({ message: "Failed to get strikes" });
    }
  });

  // Enhanced claim endpoint with strike validation
  app.post("/api/shifts/:id/claim", async (req, res) => {
    try {
      const shiftId = parseInt(req.params.id);
      const { userId, tenantId } = req.body;
      
      if (!userId || !tenantId) {
        return res.status(400).json({ message: "userId and tenantId are required" });
      }
      
      // Check strike points before allowing claim
      const claimCheck = await strikeService.canClaimShift(tenantId, userId);
      
      if (!claimCheck.canClaim) {
        console.log("🚫 CLAIM_BLOCKED", { 
          userId, 
          shiftId, 
          totalPoints: await storage.getTotalStrikePoints(tenantId, userId), 
          timestamp: new Date() 
        });
        return res.status(403).json({ message: claimCheck.reason });
      }
      
      // Get the shift to update
      const shift = await storage.getShift(shiftId);
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      
      // Update shift status to claimed and assign to user
      const updatedShift = await storage.updateShift(shiftId, {
        ...shift,
        status: "claimed",
        assignedTo: userId
      });
      
      res.json(updatedShift);
    } catch (error) {
      console.error("Error claiming shift:", error);
      res.status(500).json({ message: "Failed to claim shift" });
    }
  });

  // Enhanced shift cancellation with late cancellation strike logic
  app.post("/api/shifts/:id/cancel", async (req, res) => {
    try {
      const shiftId = parseInt(req.params.id);
      const { userId, tenantId, reason } = req.body;
      
      if (!userId || !tenantId) {
        return res.status(400).json({ message: "userId and tenantId are required" });
      }
      
      // Get the shift to check timing
      const shift = await storage.getShift(shiftId);
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      
      // Check if this is a late cancellation
      const shiftDateTime = new Date(`${shift.date} ${shift.startTime}`);
      const currentTime = new Date();
      const hoursUntilShift = (shiftDateTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
      
      // Get policy to check cancellation deadline
      const policy = await storage.getShiftPolicyByTenant(tenantId);
      const cancellationDeadlineHours = policy?.minNoticeHours || 24;
      
      if (hoursUntilShift < cancellationDeadlineHours) {
        // This is a late cancellation - assign strike
        await strikeService.assignLateCancellationStrike(tenantId, userId, shiftId);
      }
      
      // Cancel the shift
      const updatedShift = await storage.updateShift(shiftId, {
        ...shift,
        status: "cancelled",
        notes: reason ? `Cancelled: ${reason}` : "Cancelled by staff member"
      });
      
      res.json(updatedShift);
    } catch (error) {
      console.error("Error cancelling shift:", error);
      res.status(500).json({ message: "Failed to cancel shift" });
    }
  });

  // Get strikes for a user
  app.get("/api/staff/:userId/strikes", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const tenantId = req.query.tenantId as string;
      
      console.log("📡 GET_STRIKES", { userId, tenantId, timestamp: new Date() });
      
      if (!tenantId) {
        return res.status(400).json({ message: "tenantId is required" });
      }
      
      const strikes = await storage.getStaffStrikesByUser(tenantId, userId);
      
      // Calculate total points from active strikes
      const totalPoints = strikes
        .filter(strike => strike.isActive)
        .reduce((sum, strike) => sum + strike.points, 0);
      
      const result = {
        totalPoints,
        strikes
      };
      
      console.log("✅ GET_STRIKES SUCCESS", { 
        userId, 
        totalPoints,
        strikeCount: strikes.length,
        timestamp: new Date() 
      });
      
      res.json(result);
    } catch (error) {
      console.error("❌ GET_STRIKES ERROR", { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: "Failed to fetch strike data" });
    }
  });

  // Create a new strike
  app.post("/api/staff/:userId/strikes", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { tenantId, reason, points, shiftId, notes, expiresAt } = req.body;
      
      console.log("📝 CREATE_STRIKE", { 
        userId, 
        reason, 
        points, 
        tenantId,
        timestamp: new Date() 
      });
      
      if (!tenantId) {
        return res.status(400).json({ message: "tenantId is required" });
      }
      
      // Calculate expiry date if not provided
      let calculatedExpiresAt = expiresAt;
      if (!calculatedExpiresAt) {
        const policy = await storage.getShiftPolicyByTenant(tenantId);
        const resetPeriodDays = policy?.resetPeriodDays || 90;
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + resetPeriodDays);
        calculatedExpiresAt = expiry;
      }
      
      const strike = await storage.createStaffStrike({
        tenantId,
        userId,
        points,
        reason: reason as "no_show" | "late_cancellation" | "manual_adjustment",
        shiftId,
        notes,
        expiresAt: calculatedExpiresAt,
        isActive: true
      });
      
      console.log("✅ STRIKE_CREATED", { 
        strikeId: strike.id,
        userId, 
        points,
        timestamp: new Date() 
      });
      
      res.json(strike);
    } catch (error) {
      console.error("Error creating strike:", error);
      res.status(500).json({ message: "Failed to create strike" });
    }
  });

  // Update a strike
  app.put("/api/staff/:userId/strikes/:strikeId", async (req, res) => {
    try {
      const strikeId = parseInt(req.params.strikeId);
      const { isActive, notes, expiresAt } = req.body;
      
      console.log("📝 UPDATE_STRIKE", { 
        strikeId, 
        isActive, 
        timestamp: new Date() 
      });
      
      const strike = await storage.updateStaffStrike(strikeId, {
        isActive,
        notes,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      });
      
      if (!strike) {
        return res.status(404).json({ message: "Strike not found" });
      }
      
      console.log("✅ STRIKE_UPDATED", { 
        strikeId, 
        isActive,
        timestamp: new Date() 
      });
      
      res.json(strike);
    } catch (error) {
      console.error("Error updating strike:", error);
      res.status(500).json({ message: "Failed to update strike" });
    }
  });

  // Check if user can claim shifts (strike validation)
  app.get("/api/staff/:userId/can-claim", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const tenantId = req.query.tenantId as string;
      
      console.log("🔐 CAN_CLAIM_CHECK", { userId, tenantId, timestamp: new Date() });
      
      if (!tenantId) {
        return res.status(400).json({ message: "tenantId is required" });
      }
      
      const result = await strikeService.canClaimShift(tenantId, userId);
      
      console.log("✅ CAN_CLAIM_RESULT", { 
        userId, 
        canClaim: result.canClaim,
        reason: result.reason,
        timestamp: new Date() 
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error checking claim eligibility:", error);
      res.status(500).json({ message: "Failed to check claim eligibility" });
    }
  });

  // Get all staff strikes summary (owner only)
  app.get("/api/staff/strikes/all", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      
      console.log("📡 GET_ALL_STAFF_STRIKES", { tenantId, timestamp: new Date() });
      
      if (!tenantId) {
        return res.status(400).json({ message: "tenantId is required" });
      }
      
      // Get all staff members
      const staff = await storage.getStaffByTenant(tenantId);
      
      // Get strikes for each staff member
      const strikePromises = staff.map(async (member) => {
        const strikes = await storage.getStaffStrikesByUser(tenantId, member.id);
        const totalPoints = strikes.filter(s => s.isActive).reduce((sum, s) => sum + s.points, 0);
        const activeStrikes = strikes.filter(s => s.isActive).length;
        const lastIssued = strikes.length > 0 ? 
          Math.max(...strikes.map(s => new Date(s.issuedAt).getTime())) : null;
        
        return {
          userId: member.id,
          userFirstName: member.firstName,
          userLastName: member.lastName,
          totalPoints,
          activeStrikes,
          lastIssued: lastIssued ? new Date(lastIssued).toISOString() : null
        };
      });
      
      const strikesSummary = await Promise.all(strikePromises);
      
      console.log("✅ GET_ALL_STAFF_STRIKES SUCCESS", { 
        tenantId,
        staffCount: staff.length,
        timestamp: new Date() 
      });
      
      res.json({ strikes: strikesSummary });
    } catch (error) {
      console.error("❌ GET_ALL_STAFF_STRIKES ERROR", { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: "Failed to fetch staff strikes" });
    }
  });

  // Test endpoint for manual strike assignment (development only)
  app.post("/api/test/assign-strike", async (req, res) => {
    try {
      const { tenantId, userId, reason, shiftId } = req.body;
      
      if (reason === 'no_show') {
        await strikeService.assignNoShowStrike(tenantId, userId, shiftId);
      } else if (reason === 'late_cancellation') {
        await strikeService.assignLateCancellationStrike(tenantId, userId, shiftId);
      }
      
      res.json({ message: "Strike assigned successfully" });
    } catch (error) {
      console.error("Error assigning test strike:", error);
      res.status(500).json({ message: "Failed to assign strike" });
    }
  });

  // Live Operations Dashboard API Endpoints
  app.get("/api/dashboard/shift-coverage", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      
      console.log("📊 DASHBOARD_SHIFT_COVERAGE", { tenantId, timestamp: new Date() });
      
      if (!tenantId) {
        return res.status(400).json({ message: "tenantId is required" });
      }
      
      // Get all shifts from today through next 7 days
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      nextWeek.setHours(23, 59, 59, 999); // End of next week
      
      const shifts = await storage.getShiftsByTenant(tenantId);
      // Check what dates we actually have in the shifts
      const shiftDates = shifts.map(s => s.date).sort();
      const todayShifts = shifts.filter(s => s.date === '2025-07-04');
      
      console.log("🔍 SHIFTS_RAW_DATA", { 
        tenantId, 
        totalShifts: shifts.length, 
        todayShifts: todayShifts.length,
        sampleTodayShift: todayShifts[0],
        allDates: shiftDates.slice(0, 10), // First 10 dates
        today: today.toISOString().split('T')[0],
        nextWeek: nextWeek.toISOString().split('T')[0]
      });
      
      const filteredShifts = shifts.filter(shift => {
        // Parse the shift date and set to start of day
        const shiftDate = new Date(shift.date);
        shiftDate.setHours(0, 0, 0, 0);
        
        const isInRange = shiftDate >= today && shiftDate <= nextWeek;
        
        // Special debug for July 4th shifts
        if (shift.date === '2025-07-04') {
          console.log("🎯 JULY_4TH_SHIFT_DEBUG", { 
            shiftId: shift.id,
            shiftDate: shift.date,
            shiftTime: shiftDate.getTime(),
            todayTime: today.getTime(),
            nextWeekTime: nextWeek.getTime(),
            isAfterToday: shiftDate >= today,
            isBeforeNextWeek: shiftDate <= nextWeek,
            isInRange,
            status: shift.status,
            assignedTo: shift.assignedTo
          });
        }
        
        return isInRange;
      });
      
      // Calculate coverage statistics
      const active = filteredShifts.filter(s => s.status === "confirmed" || s.status === "assigned").length;
      const upcoming = filteredShifts.filter(s => s.status === "claimed").length;
      const unfilled = filteredShifts.filter(s => s.status === "open").length;
      const underUtilized = filteredShifts.filter(s => !s.assignedTo && s.status !== "open").length;
      
      console.log("📊 COVERAGE_CALCULATION_DEBUG", {
        tenantId,
        totalFiltered: filteredShifts.length,
        active,
        upcoming, 
        unfilled,
        underUtilized,
        statusBreakdown: filteredShifts.reduce((acc, s) => {
          acc[s.status] = (acc[s.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      });
      
      // Group by date for details
      const detailsByDate = filteredShifts.reduce((acc, shift) => {
        const date = shift.date;
        if (!acc[date]) {
          acc[date] = { date, shifts: 0, filled: 0, understaffed: false };
        }
        acc[date].shifts++;
        if (shift.assignedTo) acc[date].filled++;
        return acc;
      }, {} as Record<string, any>);
      
      // Mark understaffed days
      Object.values(detailsByDate).forEach((day: any) => {
        day.understaffed = day.filled / day.shifts < 0.8; // Less than 80% filled
      });
      
      const coverageData = {
        active,
        upcoming,
        unfilled,
        underUtilized,
        details: Object.values(detailsByDate)
      };
      
      console.log("✅ SHIFT_COVERAGE_SUCCESS", { 
        tenantId,
        active,
        unfilled,
        timestamp: new Date() 
      });
      
      res.json(coverageData);
    } catch (error) {
      console.error("❌ SHIFT_COVERAGE_ERROR", { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: "Failed to fetch shift coverage data" });
    }
  });

  app.get("/api/dashboard/strikes-summary", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      
      console.log("🚨 DASHBOARD_STRIKES_SUMMARY", { tenantId, timestamp: new Date() });
      
      if (!tenantId) {
        return res.status(400).json({ message: "tenantId is required" });
      }
      
      // Get all staff members and their strikes
      const staff = await storage.getStaffByTenant(tenantId);
      const policy = await storage.getShiftPolicyByTenant(tenantId);
      const maxStrikePoints = policy?.maxStrikePoints || 5;
      
      let totalPoints = 0;
      let staffWithStrikes = 0;
      const recentStrikes = [];
      
      for (const member of staff) {
        const strikes = await storage.getStaffStrikesByUser(tenantId, member.id);
        const activeStrikes = strikes.filter(s => s.isActive);
        const memberPoints = activeStrikes.reduce((sum, s) => sum + s.points, 0);
        
        totalPoints += memberPoints;
        if (activeStrikes.length > 0) staffWithStrikes++;
        
        // Add recent strikes (last 7 days)
        const recentMemberStrikes = activeStrikes
          .filter(s => new Date(s.issuedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
          .map(s => ({
            userId: member.id,
            userName: `${member.firstName} ${member.lastName}`,
            reason: s.reason,
            points: s.points,
            issuedAt: s.issuedAt
          }));
        
        recentStrikes.push(...recentMemberStrikes);
      }
      
      // Sort recent strikes by date
      recentStrikes.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
      
      const strikesData = {
        totalPoints,
        maxStrikePoints,
        staffWithStrikes,
        totalStaff: staff.length,
        recentStrikes: recentStrikes.slice(0, 10) // Last 10 recent strikes
      };
      
      console.log("✅ STRIKES_SUMMARY_SUCCESS", { 
        tenantId,
        totalPoints,
        staffWithStrikes,
        timestamp: new Date() 
      });
      
      res.json(strikesData);
    } catch (error) {
      console.error("❌ STRIKES_SUMMARY_ERROR", { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: "Failed to fetch strikes summary" });
    }
  });

  app.get("/api/dashboard/live-time-entries", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      
      console.log("⏰ DASHBOARD_LIVE_TIME_ENTRIES", { tenantId, timestamp: new Date() });
      
      if (!tenantId) {
        return res.status(400).json({ message: "tenantId is required" });
      }
      
      // Get all staff and their current time entries
      const staff = await storage.getStaffByTenant(tenantId);
      const today = new Date().toISOString().split('T')[0];
      const liveEntries = [];
      
      for (const member of staff) {
        try {
          const timeEntries = await storage.getTimeEntriesByUserAndDate(tenantId, member.id, today);
          const activeEntry = timeEntries.find(entry => 
            entry.status === "clocked_in" || entry.status === "on_break"
          );
          
          if (activeEntry) {
            // Get current shift information
            const shifts = await storage.getShiftsByTenant(tenantId);
            const currentShift = shifts.find(shift => 
              shift.date === today && 
              shift.assignedTo === member.id
            );
            
            const entry = {
              userId: member.id,
              userName: `${member.firstName} ${member.lastName}`,
              status: activeEntry.status,
              currentShift: currentShift ? {
                startTime: currentShift.startTime,
                endTime: currentShift.endTime,
                role: currentShift.role,
                location: currentShift.location
              } : undefined,
              lastActivity: activeEntry.clockInTime || new Date().toISOString()
            };
            
            liveEntries.push(entry);
          }
        } catch (error) {
          console.log(`Error getting time entries for user ${member.id}:`, error.message);
        }
      }
      
      console.log("✅ LIVE_TIME_ENTRIES_SUCCESS", { 
        tenantId,
        activeEntries: liveEntries.length,
        timestamp: new Date() 
      });
      
      res.json(liveEntries);
    } catch (error) {
      console.error("❌ LIVE_TIME_ENTRIES_ERROR", { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: "Failed to fetch live time entries" });
    }
  });

  app.get("/api/dashboard/pending-requests", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      
      console.log("📋 DASHBOARD_PENDING_REQUESTS", { tenantId, timestamp: new Date() });
      
      if (!tenantId) {
        return res.status(400).json({ message: "tenantId is required" });
      }
      
      // Get pending holiday requests
      const holidayRequests = await storage.getHolidayRequestsByTenant(tenantId);
      const pendingRequests = holidayRequests
        .filter(request => request.status === "pending")
        .map(request => ({
          id: request.id,
          type: request.type,
          requesterName: `User ${request.requesterId}`, // In real app, join with users table
          startDate: request.startDate,
          endDate: request.endDate,
          priority: request.type === "sick" ? "high" : "normal",
          requestedAt: request.requestedAt || new Date().toISOString()
        }));
      
      console.log("✅ PENDING_REQUESTS_SUCCESS", { 
        tenantId,
        pendingCount: pendingRequests.length,
        timestamp: new Date() 
      });
      
      res.json(pendingRequests);
    } catch (error) {
      console.error("❌ PENDING_REQUESTS_ERROR", { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: "Failed to fetch pending requests" });
    }
  });

  // Escalation management endpoints
  app.post("/api/escalations/:id/reassign", async (req, res) => {
    try {
      const escalationId = parseInt(req.params.id);
      const { tenantId, action, priority } = req.body;
      
      console.log("🔄 ESCALATION_REASSIGN", { escalationId, tenantId, action, timestamp: new Date() });
      
      // Convert shift to high-priority opportunity
      const shift = await storage.getShiftById(escalationId);
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      
      // Create opportunity from unfilled shift
      const opportunity = await storage.createOpportunity({
        tenantId: shift.tenantId,
        role: shift.role,
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        description: `URGENT: ${shift.description}`,
        location: shift.location,
        requiredStaff: 1,
        hourlyRate: "25.00", // Premium rate for urgent coverage
        status: "open",
        assignmentType: "opportunity",
        claimedBy: null,
        notes: "Escalated from coverage gap - urgent coverage needed",
        createdBy: 1
      });
      
      console.log("✅ ESCALATION_REASSIGN_SUCCESS", { escalationId, opportunityId: opportunity.id, timestamp: new Date() });
      res.json({ success: true, opportunityId: opportunity.id });
    } catch (error) {
      console.error("❌ ESCALATION_REASSIGN_FAILED", { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: "Failed to reassign escalation" });
    }
  });

  app.post("/api/escalations/:id/notify", async (req, res) => {
    try {
      const escalationId = parseInt(req.params.id);
      const { tenantId, action, message } = req.body;
      
      console.log("📢 ESCALATION_NOTIFY", { escalationId, tenantId, action, timestamp: new Date() });
      
      // In real implementation, this would send notifications to staff
      // For now, we'll log the notification
      const shift = await storage.getShiftById(escalationId);
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      
      console.log("📱 URGENT_NOTIFICATION_SENT", {
        escalationId,
        shiftRole: shift.role,
        shiftDate: shift.date,
        message: `Urgent coverage needed for ${shift.role} shift on ${shift.date}`,
        timestamp: new Date()
      });
      
      console.log("✅ ESCALATION_NOTIFY_SUCCESS", { escalationId, timestamp: new Date() });
      res.json({ success: true, notificationsSent: 5 }); // Mock notification count
    } catch (error) {
      console.error("❌ ESCALATION_NOTIFY_FAILED", { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: "Failed to notify staff" });
    }
  });

  app.post("/api/escalations/:id/dismiss", async (req, res) => {
    try {
      const escalationId = parseInt(req.params.id);
      const { tenantId, reason } = req.body;
      
      console.log("✖️ ESCALATION_DISMISS", { escalationId, tenantId, reason, timestamp: new Date() });
      
      // In real implementation, this would mark escalation as resolved
      // For demo, we'll just log the dismissal
      const shift = await storage.getShiftById(escalationId);
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      
      console.log("📝 ESCALATION_DISMISSED", {
        escalationId,
        shiftRole: shift.role,
        shiftDate: shift.date,
        reason,
        dismissedBy: "Owner",
        timestamp: new Date()
      });
      
      console.log("✅ ESCALATION_DISMISS_SUCCESS", { escalationId, timestamp: new Date() });
      res.json({ success: true });
    } catch (error) {
      console.error("❌ ESCALATION_DISMISS_FAILED", { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: "Failed to dismiss escalation" });
    }
  });

  app.get("/api/dashboard/escalations", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      
      console.log("🚨 DASHBOARD_ESCALATIONS", { tenantId, timestamp: new Date() });
      
      if (!tenantId) {
        return res.status(400).json({ message: "tenantId is required" });
      }
      
      // Get swap requests and identify escalations
      const swapRequests = await storage.getSwapRequestsByTenant(tenantId);
      const shifts = await storage.getShiftsByTenant(tenantId);
      
      const escalations = [];
      
      // Identify urgent swap requests (requested more than 24 hours ago)
      const urgentSwaps = swapRequests.filter(swap => {
        const requestedAt = new Date(swap.requestedAt || Date.now());
        const hoursSinceRequest = (Date.now() - requestedAt.getTime()) / (1000 * 60 * 60);
        return hoursSinceRequest > 24 && swap.status === "pending";
      });
      
      urgentSwaps.forEach(swap => {
        escalations.push({
          id: swap.id,
          type: "swap_request",
          description: `Swap request pending for ${Math.round((Date.now() - new Date(swap.requestedAt || Date.now()).getTime()) / (1000 * 60 * 60))} hours`,
          affectedShifts: 2,
          urgency: "high",
          createdAt: swap.requestedAt || new Date().toISOString()
        });
      });
      
      // Identify coverage gaps (shifts starting in <12 hours with no assignment)
      const now = new Date();
      const next12Hours = new Date(now.getTime() + 12 * 60 * 60 * 1000);
      
      const upcomingUnfilledShifts = shifts.filter(shift => {
        const shiftDateTime = new Date(`${shift.date} ${shift.startTime}`);
        return shiftDateTime >= now && 
               shiftDateTime <= next12Hours && 
               !shift.assignedTo && 
               shift.status === "open";
      });
      
      upcomingUnfilledShifts.forEach(shift => {
        const shiftDateTime = new Date(`${shift.date} ${shift.startTime}`);
        const hoursUntil = Math.round((shiftDateTime.getTime() - now.getTime()) / (1000 * 60 * 60));
        
        escalations.push({
          id: shift.id,
          type: "coverage_gap",
          description: `Unfilled ${shift.role} shift starting in ${hoursUntil} hours`,
          affectedShifts: 1,
          urgency: hoursUntil < 4 ? "critical" : "high",
          createdAt: shift.createdAt || new Date().toISOString()
        });
      });
      
      // Sort by urgency and creation date
      escalations.sort((a, b) => {
        const urgencyOrder = { critical: 3, high: 2, medium: 1, low: 0 };
        if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
          return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      console.log("✅ ESCALATIONS_SUCCESS", { 
        tenantId,
        escalationCount: escalations.length,
        criticalCount: escalations.filter(e => e.urgency === 'critical').length,
        timestamp: new Date() 
      });
      
      res.json(escalations);
    } catch (error) {
      console.error("❌ ESCALATIONS_ERROR", { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: "Failed to fetch escalations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
