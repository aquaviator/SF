import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertShiftSchema, insertUserSchema, updateUserSchema, insertOpportunitySchema, insertSwapRequestSchema, insertScheduleTemplateSchema, insertAssignmentSchema, insertHolidayRequestSchema, insertBusinessProfileSchema, insertJobRoleSchema, insertLocationSchema, insertDepartmentSchema, insertOperatingHoursSchema, insertHolidayEntitlementSchema, insertStaffStrikeSchema, type HolidayRequest, type InsertHolidayRequest, shifts, users, tenants, businessProfiles, subscriptions, seatPricing, campaigns, locations, jobRoles, shiftPolicies, departments, operatingHours, domainConfig, mailingList, siteAdmins, landingPages, platformSettings, supportTickets, promoCodes } from "../shared/schema";
import { z } from "zod";
import { strikeService } from "./strike-service";
import { db } from "./db";
import { eq, and, gt, lte, gte, or, isNull, sql } from "drizzle-orm";
import Stripe from "stripe";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { sendActivationEmail, sendEmailChangeConfirmation, sendPasswordResetEmail, sendUpgradeConfirmationEmail } from "./utils/mailer";
import session from "express-session";
import { setupAdminAuthRoutes } from "./routes/admin/auth";
import { setup2FARoutes } from "./routes/admin/2fa";
import { setupAdminSeatPricingRoutes } from "./routes/admin/seat-pricing";
import { setupAdminTenantRoutes } from "./routes/admin/tenants";
import { setupAdminPricingRoutes } from "./routes/admin/pricing";
// import { setupAdminDomainRoutes } from "./routes/admin/domains"; // Legacy function not needed
import { setupSeatPricingRoutes } from "./routes/seat-pricing";
import { adminAuth, requireRole } from "./middleware/adminAuth";
import adminDatabaseRoutes from "./routes/admin/database";
import { supportRoutes } from "./routes/admin/support";
import { configRoutes } from "./routes/admin/config";
import { domainRoutes } from "./routes/admin/domains";
import { analyticsRoutes } from "./routes/admin/analytics";

declare module 'express-session' {
  interface SessionData {
    userId: number;
    tenantId: string;
  }
}

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
  : null;

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

// Helper function to get active domain configuration
async function getActiveDomain(): Promise<string> {
  try {
    const [config] = await db
      .select()
      .from(domainConfig)
      .where(eq(domainConfig.isActive, true))
      .limit(1);
    
    return config?.baseUrl || 'http://localhost:5000';
  } catch (error) {
    console.error('Error fetching domain config:', error);
    return 'http://localhost:5000';
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Setup admin authentication and 2FA routes
  setupAdminAuthRoutes(app);
  setup2FARoutes(app);
  
  // Setup seat pricing routes
  setupAdminSeatPricingRoutes(app);
  setupSeatPricingRoutes(app);
  
  // Database management routes
  app.use('/api/admin/database', adminDatabaseRoutes);
  
  // Database management routes
  app.use('/api/admin/database', adminDatabaseRoutes);

  // Authentication endpoints
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Find user by email (using getUserByUsername since we store email as username)
      const user = await storage.getUserByUsername(email);
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password using bcrypt
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Store user in session
      req.session.userId = user.id;
      req.session.tenantId = user.tenantId;

      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/auth/me', async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: 'User not found' });
      }

      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Auth check error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Could not log out' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

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

  app.get("/api/shifts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const shift = await storage.getShift(id);
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      res.json(shift);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shift" });
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
          const conflictDetails = conflictingShifts[0]; // Show details of first conflicting shift
          const user = await storage.getUser(validatedData.assignedTo);
          const staffName = user ? `${user.firstName} ${user.lastName}` : `User ${validatedData.assignedTo}`;
          
          return res.status(400).json({ 
            message: `Schedule conflict: ${staffName} already has a shift on ${validatedData.date}`,
            conflict: {
              staffName,
              existingShift: {
                id: conflictDetails.id,
                role: conflictDetails.role,
                time: `${conflictDetails.startTime} - ${conflictDetails.endTime}`,
                location: conflictDetails.location,
                status: conflictDetails.status
              }
            },
            suggestion: `${staffName} is scheduled as ${conflictDetails.role} from ${conflictDetails.startTime}-${conflictDetails.endTime} at ${conflictDetails.location}. Choose a different date or staff member.`
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
      const validatedData = updateUserSchema.parse(req.body);
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
      
      // For staff updates, we only allow partial updates of specific fields
      const staffUpdateSchema = z.object({
        firstName: z.string().min(1, "First name is required").optional(),
        lastName: z.string().min(1, "Last name is required").optional(),
        email: z.string().email("Valid email is required").optional(),
        phone: z.string().nullable().optional(),
        address: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
        employeeId: z.string().nullable().optional(),
        emergencyContactName: z.string().nullable().optional(),
        emergencyContactPhone: z.string().nullable().optional(),
        photoUrl: z.string().nullable().optional(),
        bio: z.string().nullable().optional(),
      });
      
      const validatedData = staffUpdateSchema.parse(req.body);
      const user = await storage.updateUser(id, validatedData);
      if (!user) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Staff update error:", error);
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

  // Pending assignments (shifts with "assigned" status requiring staff confirmation)
  app.get("/api/pending-assignments", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      const userId = req.query.userId as string;
      
      if (!tenantId || !userId) {
        return res.status(400).json({ message: "Tenant ID and User ID are required" });
      }
      
      const shifts = await storage.getShiftsByUser(tenantId, parseInt(userId));
      const pendingAssignments = shifts.filter(shift => shift.status === "assigned");
      res.json(pendingAssignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending assignments" });
    }
  });

  // Staff assignment response (accept/decline assigned shifts)
  app.post("/api/assignments/:shiftId/respond", async (req, res) => {
    try {
      const shiftId = parseInt(req.params.shiftId);
      const { response, userId, tenantId } = req.body; // response: "accept" | "decline"
      
      if (!response || !userId || !tenantId) {
        return res.status(400).json({ message: "Response, user ID, and tenant ID are required" });
      }
      
      if (!["accept", "decline"].includes(response)) {
        return res.status(400).json({ message: "Response must be 'accept' or 'decline'" });
      }
      
      // Get the shift to verify it's assigned to this user
      const shift = await storage.getShift(shiftId);
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      
      if (shift.assignedTo !== userId) {
        return res.status(403).json({ message: "You can only respond to shifts assigned to you" });
      }
      
      if (shift.status !== "assigned") {
        return res.status(400).json({ message: "This shift assignment has already been responded to" });
      }
      
      // Update shift status based on response
      const newStatus = response === "accept" ? "confirmed" : "declined";
      const updatedShift = await storage.updateShift(shiftId, {
        date: shift.date,
        tenantId: shift.tenantId,
        role: shift.role,
        status: newStatus,
        startTime: shift.startTime,
        endTime: shift.endTime,
        description: shift.description,
        location: shift.location,
        createdBy: shift.createdBy,
        assignedTo: shift.assignedTo,
        assignmentType: shift.assignmentType,
        requiredStaff: shift.requiredStaff,
        claimedBy: shift.claimedBy,
        templateId: shift.templateId,
        notes: shift.notes
      });
      
      // If assignment accepted, remove any corresponding opportunity for the same shift
      if (response === "accept") {
        console.log("✅ ASSIGNMENT_ACCEPTED", {
          shiftId,
          userId: userId,
          role: shift.role,
          date: shift.date,
          timestamp: new Date()
        });
        
        // Assignment acceptance automatically removes opportunity availability
        // No need to delete opportunity records - the shift is now confirmed
      }
      
      // Auto-escalation: Convert declined assignments to opportunities
      if (response === "decline") {
        // Check if this is a policy violation (declined outside acceptable window)
        const shiftDate = new Date(shift.date);
        const now = new Date();
        const hoursUntilShift = (shiftDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        // Auto-convert to opportunity if declined with sufficient notice (>24 hours)
        if (hoursUntilShift > 24) {
          console.log("🤖 AUTO_ESCALATION_TRIGGERED", {
            shiftId,
            hoursUntilShift: Math.round(hoursUntilShift),
            reason: "declined_with_notice",
            timestamp: new Date()
          });
          
          // Convert to opportunity automatically
          await storage.updateShift(shiftId, {
            date: shift.date,
            tenantId: shift.tenantId,
            role: shift.role,
            status: "open",
            startTime: shift.startTime,
            endTime: shift.endTime,
            description: `Available opportunity - ${shift.role} position`,
            location: shift.location,
            createdBy: shift.createdBy,
            assignedTo: null,
            assignmentType: "opportunity",
            requiredStaff: shift.requiredStaff,
            claimedBy: shift.claimedBy,
            templateId: shift.templateId,
            notes: shift.notes
          });
          
          console.log("✅ AUTO_OPPORTUNITY_CREATED", {
            shiftId,
            originalRole: shift.role,
            date: shift.date,
            timestamp: new Date()
          });
        }
      }
      
      // Log the assignment response
      await storage.createActivityLog({
        tenantId,
        userId,
        action: response === "accept" ? "assignment_accepted" : "assignment_declined",
        resourceType: "shift",
        resourceId: shiftId.toString(),
        details: `${response === "accept" ? "Accepted" : "Declined"} assigned ${shift.role} shift on ${shift.date}`,
        ipAddress: req.ip || "127.0.0.1",
        userAgent: "ShiftFlo App"
      });
      
      res.json({ 
        message: `Assignment ${response}ed successfully`,
        shift: updatedShift,
        status: newStatus
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to respond to assignment" });
    }
  });

  // Opportunities routes
  app.get("/api/opportunities", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      const userId = req.query.userId as string;
      
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      // Fetch all shifts with assignmentType="opportunity"
      const allOpportunityShifts = await storage.getShiftsByTenantAndType(tenantId, "opportunity");
      
      // If userId provided, filter out opportunities on dates when user already has shifts
      if (userId && !isNaN(parseInt(userId))) {
        const userShifts = await storage.getShiftsByUser(tenantId, parseInt(userId));
        const userShiftDates = new Set(
          userShifts
            .filter(shift => shift.status === "assigned" || shift.status === "confirmed")
            .map(shift => shift.date)
        );
        
        // Filter out opportunities on dates where user already has shifts
        const availableOpportunities = allOpportunityShifts.filter(opportunity => {
          const hasConflict = userShiftDates.has(opportunity.date);
          if (hasConflict) {
            console.log("🚫 OPPORTUNITY_FILTERED", {
              opportunityId: opportunity.id,
              date: opportunity.date,
              userId: parseInt(userId),
              reason: "user_has_shift_on_date",
              timestamp: new Date()
            });
          }
          return !hasConflict;
        });
        
        console.log("✅ OPPORTUNITIES_FILTERED", {
          userId: parseInt(userId),
          totalOpportunities: allOpportunityShifts.length,
          availableOpportunities: availableOpportunities.length,
          filteredOut: allOpportunityShifts.length - availableOpportunities.length,
          timestamp: new Date()
        });
        
        res.json(availableOpportunities);
      } else {
        // Return all opportunities if no userId specified
        res.json(allOpportunityShifts);
      }
    } catch (error) {
      console.error("Opportunities API error:", error);
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

  // New policy-driven cancel action endpoint
  app.post("/api/shift-actions/request-cancel", async (req, res) => {
    try {
      const { tenantId, shiftId, requestedBy, reason } = req.body;
      
      if (!tenantId || !shiftId || !requestedBy) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // For now, directly update the shift status to cancelled
      const shift = await storage.getShift(parseInt(shiftId));
      if (!shift) {
        return res.status(404).json({ 
          success: false, 
          action: "denied", 
          message: "Shift not found" 
        });
      }

      // Check if it's a past shift
      const shiftDate = new Date(shift.date);
      const now = new Date();
      if (shiftDate < now) {
        return res.status(400).json({ 
          success: false, 
          action: "denied", 
          message: "Cannot cancel a past shift" 
        });
      }

      // Step 1: Update shift status to cancelled and remove assignment
      const updatedShift = await storage.updateShift(parseInt(shiftId), {
        ...shift,
        status: "cancelled",
        assignedTo: null,
        assignmentType: "opportunity"
      });

      // Step 2: Create an opportunity for other staff to claim this shift
      await storage.createOpportunity({
        tenantId: shift.tenantId,
        shiftId: parseInt(shiftId),
        description: `${shift.role} shift available - was cancelled by staff`,
        requirements: `${shift.role} position needed for ${shift.date} ${shift.startTime}-${shift.endTime}`,
        isActive: true
      });

      // Step 3: Log activity for owner visibility
      await storage.createActivityLog({
        tenantId: shift.tenantId,
        userId: parseInt(requestedBy),
        action: "shift_cancelled",
        resourceType: "shift",
        resourceId: shiftId.toString(),
        details: `Staff cancelled ${shift.role} shift on ${shift.date}. Reason: ${reason || "No reason provided"}`,
        ipAddress: "127.0.0.1",
        userAgent: "ShiftFlo App"
      });

      res.status(200).json({
        success: true,
        action: "approved",
        message: "Shift cancelled successfully and made available for other staff to claim"
      });
    } catch (error) {
      console.error("Error processing cancel request:", error);
      res.status(500).json({ 
        success: false, 
        action: "denied", 
        message: "Failed to process cancel request" 
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

  // Get pending assignments for staff (shifts with "assigned" status)
  app.get("/api/pending-assignments", async (req, res) => {
    try {
      const { tenantId, userId } = req.query;
      
      if (!tenantId || !userId) {
        return res.status(400).json({ message: "Tenant ID and User ID are required" });
      }
      
      console.log("📋 PENDING_ASSIGNMENTS_REQUEST", { tenantId, userId });
      
      // Get shifts assigned to this user with "assigned" status
      const pendingShifts = await storage.getShiftsByUserAndStatus(tenantId as string, parseInt(userId as string), "assigned");
      console.log("📋 PENDING_ASSIGNMENTS_FOUND", { count: pendingShifts.length, shifts: pendingShifts });
      
      res.json(pendingShifts || []);
    } catch (error) {
      console.error("Get pending assignments error:", error);
      res.status(500).json({ message: "Failed to fetch pending assignments" });
    }
  });

  // Get assignment tracking for owners (all shifts with assignment status)
  app.get("/api/assignment-tracking", async (req, res) => {
    try {
      const { tenantId } = req.query;
      
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      console.log("📊 ASSIGNMENT_TRACKING_REQUEST", { tenantId });
      
      // Get all shifts with assignment-related statuses
      const trackingData = await storage.getAssignmentTrackingData(tenantId as string);
      console.log("📊 ASSIGNMENT_TRACKING_DATA", { count: trackingData.length });
      
      res.json(trackingData || []);
    } catch (error) {
      console.error("Get assignment tracking error:", error);
      res.status(500).json({ message: "Failed to fetch assignment tracking data" });
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
      console.log("🕒 TIME_ENTRY_CREATE_REQUEST", {
        data: validatedData,
        timestamp: new Date()
      });
      
      const entry = await storage.createTimeEntry(validatedData);
      
      console.log("✅ TIME_ENTRY_CREATED", {
        entryId: entry.id,
        userId: entry.userId,
        action: entry.clockIn ? "clock_in" : "clock_out",
        timestamp: new Date()
      });
      
      res.status(201).json(entry);
    } catch (error) {
      console.error("❌ TIME_ENTRY_CREATE_ERROR", {
        error: error.message,
        data: req.body,
        timestamp: new Date()
      });
      res.status(500).json({ message: "Failed to create time entry", error: error.message });
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
      console.log("🔧 JOB_ROLE_UPDATE", { roleId: req.params.id, requestBody: req.body });
      
      const result = insertJobRoleSchema.safeParse(req.body);
      if (!result.success) {
        console.log("❌ JOB_ROLE_VALIDATION_FAILED", { errors: result.error.issues });
        return res.status(400).json({ message: "Invalid job role data", errors: result.error.issues });
      }
      
      console.log("✅ JOB_ROLE_VALIDATION_SUCCESS", { validatedData: result.data });
      
      const id = parseInt(req.params.id);
      const jobRole = await storage.updateJobRole(id, result.data);
      if (!jobRole) {
        console.log("❌ JOB_ROLE_NOT_FOUND", { roleId: id });
        return res.status(404).json({ message: "Job role not found" });
      }
      
      console.log("✅ JOB_ROLE_UPDATE_SUCCESS", { roleId: id, updatedRole: jobRole });
      res.json(jobRole);
    } catch (error) {
      console.error("❌ JOB_ROLE_UPDATE_FAILED", { error: error.message, stack: error.stack });
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

  // Subscription routes - Database-driven seat-based billing
  app.get("/api/subscription", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const subscription = await storage.getSubscriptionByTenantId(tenantId);
      console.log(`🔍 SUBSCRIPTION_LOOKUP: tenantId: ${tenantId}, found: ${!!subscription}`, subscription);
      
      // Calculate current seat usage dynamically (same logic as seat-usage endpoint)
      const tenantUsers = await storage.getStaffByTenant(tenantId);
      const activeStaff = tenantUsers.filter(u => u.isActive).length;
      const currentSeatsUsed = activeStaff; // Only active staff count toward paid seats
      
      if (!subscription) {
        // Return default trial subscription if none exists
        const defaultSubscription = {
          id: 1,
          status: "trial",
          seatsIncluded: 5,
          seatsUsed: currentSeatsUsed,
          pricePerSeat: 3, // £3.00
          monthlyTotal: currentSeatsUsed * 3,
          trialDaysRemaining: 14,
          nextBillingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          features: [
            "Unlimited shift scheduling",
            "Time tracking & reporting",
            "Staff mobile app access", 
            "Real-time notifications",
            "Basic analytics & insights",
            "Email support"
          ]
        };
        return res.json(defaultSubscription);
      }
      
      // Format response with dynamic seat usage calculation
      const formattedSubscription = {
        id: subscription.id,
        status: subscription.status,
        seatsIncluded: subscription.seatsIncluded,
        seatsUsed: currentSeatsUsed, // Use calculated value instead of static database value
        pricePerSeat: subscription.pricePerSeat / 100, // Convert pence to pounds for display
        monthlyTotal: subscription.monthlyTotal, // Already in pounds in database
        trialDaysRemaining: subscription.trialDaysRemaining,
        nextBillingDate: subscription.nextBillingDate,
        features: [
          "Unlimited shift scheduling",
          "Time tracking & reporting",
          "Staff mobile app access", 
          "Real-time notifications",
          "Basic analytics & insights",
          "Email support"
        ]
      };
      
      console.log(`📊 SUBSCRIPTION_WITH_DYNAMIC_SEATS: seatsUsed updated from ${subscription.seatsUsed} to ${currentSeatsUsed}`);
      res.json(formattedSubscription);
    } catch (error) {
      console.error("Subscription fetch error:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // Seat-based billing - no subscription plans endpoint needed

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

  // Seat Usage endpoint with seat-based enforcement
  app.get("/api/seat-usage", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      // Get subscription to know seat limit
      const subscription = await storage.getSubscriptionByTenantId(tenantId);
      const totalSeats = subscription?.seatsIncluded || 5;
      
      // Get active staff count from database
      let activeStaff = 2; // Default for template business
      let pendingInvites = 0;
      
      try {
        // Query users directly from database to get staff count
        const allUsers = await storage.getAllUsers();
        const tenantUsers = allUsers.filter(u => u.tenantId === tenantId);
        activeStaff = tenantUsers.filter(u => u.role === 'staff' && u.isActive).length;
        pendingInvites = tenantUsers.filter(u => u.role === 'staff' && !u.isActive).length;
      } catch (error) {
        console.log("Using default staff count for seat usage calculation");
      }
      
      const seatsUsed = activeStaff + pendingInvites;
      const isOverLimit = seatsUsed > totalSeats;
      const excessSeats = isOverLimit ? seatsUsed - totalSeats : 0;
      
      const seatUsage = {
        totalSeats,
        activeStaff,
        pendingInvites,
        seatsUsed,
        availableSeats: Math.max(0, totalSeats - seatsUsed),
        utilizationPercentage: Math.round((seatsUsed / totalSeats) * 100),
        isOverLimit,
        excessSeats
      };
      
      console.log(`💺 SEAT_USAGE_CALCULATED: ${JSON.stringify(seatUsage)}`);
      res.json(seatUsage);
    } catch (error) {
      console.error("Seat usage API error:", error);
      res.status(500).json({ message: "Failed to fetch seat usage" });
    }
  });

  // Check seat limit for staff operations
  app.get("/api/seat-limit-check", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }

      const subscription = await storage.getSubscriptionByTenantId(tenantId);
      const totalSeats = subscription?.seatsIncluded || 5;
      
      const allUsers = await storage.getAllUsers();
      const tenantUsers = allUsers.filter(u => u.tenantId === tenantId);
      const seatsUsed = tenantUsers.filter(u => u.role === 'staff').length; // active + pending
      
      const isOverLimit = seatsUsed > totalSeats;
      const availableSeats = Math.max(0, totalSeats - seatsUsed);
      
      if (isOverLimit) {
        const excessSeats = seatsUsed - totalSeats;
        return res.json({
          canAddStaff: false,
          message: `You have ${seatsUsed} active staff but only ${totalSeats} seats. Please deactivate ${excessSeats} staff members to restore service.`,
          isOverLimit: true,
          excessSeats
        });
      }
      
      if (availableSeats <= 0) {
        return res.json({
          canAddStaff: false,
          message: `Seat limit reached (${seatsUsed}/${totalSeats}). Upgrade your subscription or deactivate staff to add more users.`,
          isOverLimit: false,
          excessSeats: 0
        });
      }
      
      res.json({ 
        canAddStaff: true, 
        availableSeats,
        isOverLimit: false,
        excessSeats: 0
      });
    } catch (error) {
      console.error("Seat limit check error:", error);
      res.status(500).json({ message: "Failed to check seat limit" });
    }
  });

  // Create or retrieve Stripe customer
  async function getOrCreateStripeCustomer(userId: number, tenantId: string) {
    try {
      const user = await storage.getUser(userId);
      if (!user) throw new Error("User not found");

      // Check if user already has a Stripe customer ID
      if (user.stripeCustomerId) {
        return user.stripeCustomerId;
      }

      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: userId.toString(),
          tenantId
        }
      });

      // Save customer ID to user
      await storage.updateUser(userId, { stripeCustomerId: customer.id });
      return customer.id;
    } catch (error) {
      console.error("Error creating Stripe customer:", error);
      throw error;
    }
  }

  // Create payment intent for seat upgrades
  app.post("/api/subscription/create-payment-intent", async (req, res) => {
    try {
      const { seatsToAdd, tenantId } = req.body;
      const userId = req.session.userId;
      console.log(`💳 CREATE_PAYMENT_INTENT_REQUEST: userId: ${userId}, seatsToAdd: ${seatsToAdd}, tenantId: ${tenantId}`);
      
      if (!stripe) {
        console.log(`❌ STRIPE_NOT_CONFIGURED`);
        return res.status(500).json({ message: "Stripe not configured" });
      }
      
      if (!userId) {
        console.log(`❌ USER_NOT_AUTHENTICATED`);
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (!seatsToAdd || seatsToAdd < 1) {
        console.log(`❌ INVALID_SEATS_COUNT: ${seatsToAdd}`);
        return res.status(400).json({ message: "Must add at least 1 seat" });
      }
      
      const pricePerSeat = 300; // £3.00 in pence
      const totalAmount = seatsToAdd * pricePerSeat;
      console.log(`💰 PAYMENT_CALCULATION: ${seatsToAdd} seats × £3.00 = £${(totalAmount / 100).toFixed(2)} (${totalAmount} pence)`);
      
      // Get or create Stripe customer
      console.log(`👤 GETTING_STRIPE_CUSTOMER: userId: ${userId}, tenantId: ${tenantId}`);
      const customerId = await getOrCreateStripeCustomer(userId, tenantId);
      console.log(`✅ STRIPE_CUSTOMER_READY: customerId: ${customerId}`);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: "gbp",
        customer: customerId,
        metadata: {
          tenantId,
          userId: userId.toString(),
          seatsToAdd: seatsToAdd.toString(),
          type: "seat_upgrade"
        },
        description: `Add ${seatsToAdd} seats to subscription`,
        receipt_email: await storage.getUser(userId).then(u => u?.email)
      });
      
      console.log(`✅ STRIPE_PAYMENT_INTENT_CREATED: id: ${paymentIntent.id}, amount: £${(totalAmount / 100).toFixed(2)}, clientSecret: ${paymentIntent.client_secret?.substring(0, 20)}...`);
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        amount: totalAmount,
        seatsToAdd
      });
    } catch (error) {
      console.error("❌ PAYMENT_INTENT_CREATION_ERROR:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Get seat usage statistics
  app.get("/api/subscription/seat-usage", async (req, res) => {
    try {
      const { tenantId } = req.query;
      console.log(`📊 SEAT_USAGE_REQUEST: tenantId: ${tenantId}`);
      
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID required" });
      }
      
      // Get subscription details
      const subscription = await storage.getSubscriptionByTenantId(tenantId as string);
      const totalSeats = subscription?.seatsIncluded || 5;
      
      // Get staff for this tenant (getStaffByTenant already filters for staff role)
      const tenantUsers = await storage.getStaffByTenant(tenantId as string);
      
      // Count active and pending staff - ONLY active staff count toward seats
      const activeStaff = tenantUsers.filter(u => u.isActive).length;
      const pendingInvites = tenantUsers.filter(u => !u.isActive).length;
      const seatsUsed = activeStaff; // Only active staff count toward paid seats
      const availableSeats = Math.max(0, totalSeats - seatsUsed);
      const utilizationPercentage = Math.round((seatsUsed / totalSeats) * 100);
      const isOverLimit = seatsUsed > totalSeats;
      const excessSeats = Math.max(0, seatsUsed - totalSeats);
      
      const seatUsage = {
        totalSeats,
        activeStaff,
        pendingInvites,
        seatsUsed,
        availableSeats,
        utilizationPercentage,
        isOverLimit,
        excessSeats
      };
      
      console.log(`📋 SEAT_USAGE_CALCULATED:`, seatUsage);
      res.json(seatUsage);
    } catch (error) {
      console.error("❌ SEAT_USAGE_ERROR:", error);
      res.status(500).json({ message: "Failed to get seat usage" });
    }
  });

  // Add seats endpoint (after successful payment)
  app.post("/api/subscription/add-seats", async (req, res) => {
    try {
      const { seatsToAdd, paymentIntentId } = req.body;
      const userId = req.session.userId;
      console.log(`🏢 ADD_SEATS_REQUEST: userId: ${userId}, seatsToAdd: ${seatsToAdd}, paymentIntentId: ${paymentIntentId}`);
      
      if (!stripe) {
        console.log(`❌ STRIPE_NOT_CONFIGURED`);
        return res.status(500).json({ message: "Stripe not configured" });
      }
      
      if (!userId) {
        console.log(`❌ USER_NOT_AUTHENTICATED`);
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Verify payment was successful (or allow test mode)
      let paymentDetails = null;
      if (paymentIntentId && !paymentIntentId.startsWith('pi_test_')) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          if (paymentIntent.status !== "succeeded") {
            return res.status(400).json({ message: "Payment not confirmed" });
          }
          paymentDetails = {
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            created: paymentIntent.created
          };
        } catch (error) {
          console.error("Payment verification error:", error);
          return res.status(400).json({ message: "Payment verification failed" });
        }
      } else if (paymentIntentId && paymentIntentId.startsWith('pi_test_')) {
        // Test mode - simulate successful payment
        paymentDetails = {
          id: paymentIntentId,
          amount: seatsToAdd * 300, // £3 per seat in pence
          currency: 'gbp',
          created: Math.floor(Date.now() / 1000)
        };
        console.log(`🧪 TEST_MODE_PAYMENT: ${paymentIntentId}, amount: £${(paymentDetails.amount / 100).toFixed(2)}`);
      }

      // Get user and subscription details
      console.log(`👤 FETCHING_USER_AND_SUBSCRIPTION: userId: ${userId}`);
      const user = await storage.getUser(userId);
      const subscription = await storage.getSubscriptionByTenantId(user?.tenantId || "");
      console.log(`📋 CURRENT_SUBSCRIPTION: id: ${subscription?.id}, current seats: ${subscription?.seatsIncluded || 5}, tenantId: ${user?.tenantId}`);
      
      // Update subscription with new seat count
      const newSeatCount = (subscription?.seatsIncluded || 5) + seatsToAdd;
      const newMonthlyTotal = newSeatCount * 3; // £3 per seat
      console.log(`📈 SEAT_UPGRADE_CALCULATION: current: ${subscription?.seatsIncluded || 5} + adding: ${seatsToAdd} = new total: ${newSeatCount}, monthly: £${newMonthlyTotal}`);
      
      // Update subscription in database
      if (subscription) {
        console.log(`💾 UPDATING_SUBSCRIPTION: id: ${subscription.id}, newSeatCount: ${newSeatCount}, newMonthlyTotal: ${newMonthlyTotal}`);
        await storage.updateSubscription(subscription.id, {
          seatsIncluded: newSeatCount,
          monthlyTotal: newMonthlyTotal
        });
        console.log(`✅ SUBSCRIPTION_UPDATED_SUCCESSFULLY`);
      } else {
        console.log(`⚠️ NO_SUBSCRIPTION_FOUND_TO_UPDATE`);
      }

      // Create invoice record with proper invoice number and billing periods
      const now = new Date();
      const billingStart = new Date(now.getFullYear(), now.getMonth(), 1); // Start of current month
      const billingEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // End of current month
      
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const invoice = await storage.createInvoice({
        tenantId: user?.tenantId || "",
        subscriptionId: subscription?.id || 0,
        invoiceNumber: invoiceNumber,
        stripeInvoiceId: paymentIntentId || `pi_${Date.now()}`,
        amount: paymentDetails?.amount || (seatsToAdd * 300),
        currency: "gbp",
        status: "paid",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        billingPeriodStart: billingStart,
        billingPeriodEnd: billingEnd,
        paidAt: paymentDetails ? new Date(paymentDetails.created * 1000) : new Date(),
        description: `Seat upgrade - Added ${seatsToAdd} seats`,
        lineItems: [{
          description: `Additional seats (${seatsToAdd} x £3.00)`,
          quantity: seatsToAdd,
          unitPrice: 3.00,
          total: seatsToAdd * 3.00
        }]
      });

      // Send confirmation email with invoice
      try {
        await sendUpgradeConfirmationEmail(user, {
          seatsAdded: seatsToAdd,
          newSeatCount,
          newMonthlyTotal,
          invoice,
          paymentDetails
        });
        console.log(`✅ UPGRADE_CONFIRMATION_EMAIL_SENT: ${user?.email}, seats: ${seatsToAdd}, total: £${newMonthlyTotal}`);
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the request if email fails
      }
      
      console.log(`🎉 ADD_SEATS_SUCCESS: newSeatCount: ${newSeatCount}, newMonthlyTotal: £${newMonthlyTotal}, invoice: ${invoice?.id}`);
      res.json({ 
        success: true, 
        message: `Successfully added ${seatsToAdd} seats`,
        newSeatCount,
        newMonthlyTotal,
        invoice
      });
    } catch (error) {
      console.error("❌ ADD_SEATS_ERROR:", error);
      res.status(500).json({ message: "Failed to add seats" });
    }
  });

  // Stripe customer management endpoints
  app.get("/api/stripe/customer", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user?.stripeCustomerId) {
        return res.json({ hasCustomer: false });
      }

      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      res.json({
        hasCustomer: true,
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          defaultPaymentMethod: customer.invoice_settings?.default_payment_method
        }
      });
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  // Setup intent for adding payment methods
  app.post("/api/stripe/setup-intent", async (req, res) => {
    try {
      const userId = req.session.userId;
      const { tenantId } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const customerId = await getOrCreateStripeCustomer(userId, tenantId);

      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        usage: 'off_session'
      });

      res.json({ clientSecret: setupIntent.client_secret });
    } catch (error) {
      console.error("Error creating setup intent:", error);
      res.status(500).json({ message: "Failed to create setup intent" });
    }
  });

  // List customer payment methods
  app.get("/api/stripe/payment-methods", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user?.stripeCustomerId) {
        return res.json([]);
      }

      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card'
      });

      res.json(paymentMethods.data.map(pm => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
        isDefault: pm.id === user.defaultPaymentMethodId
      })));
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ message: "Failed to fetch payment methods" });
    }
  });

  // Delete payment method
  app.delete("/api/stripe/payment-methods/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await stripe.paymentMethods.detach(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting payment method:", error);
      res.status(500).json({ message: "Failed to delete payment method" });
    }
  });

  // Set default payment method
  app.post("/api/stripe/payment-methods/:id/default", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: "No customer found" });
      }

      await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: { default_payment_method: id }
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error setting default payment method:", error);
      res.status(500).json({ message: "Failed to set default payment method" });
    }
  });

  // Get billing history from Stripe
  app.get("/api/stripe/invoices", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user?.stripeCustomerId) {
        return res.json([]);
      }

      const invoices = await stripe.invoices.list({
        customer: user.stripeCustomerId,
        limit: 100
      });

      res.json(invoices.data.map(invoice => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        created: new Date(invoice.created * 1000),
        dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
        description: invoice.lines.data[0]?.description || 'Subscription payment'
      })));
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Get specific invoice
  app.get("/api/stripe/invoices/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const invoice = await stripe.invoices.retrieve(id);
      
      res.json({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        created: new Date(invoice.created * 1000),
        dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
        description: invoice.lines.data[0]?.description || 'Subscription payment',
        lineItems: invoice.lines.data.map(line => ({
          description: line.description,
          amount: line.amount,
          quantity: line.quantity
        }))
      });
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
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

  // Invoice routes
  app.get("/api/subscription/invoices", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const invoices = await storage.getInvoices(tenantId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
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
  // Mailing list endpoints for landing page
  app.post("/api/mailing-list", async (req, res) => {
    try {
      const { email, source = "landing_page" } = req.body;
      
      if (!email || !email.includes("@")) {
        return res.status(400).json({ message: "Valid email address is required" });
      }

      // Check if email already exists
      const existing = await storage.getMailingListByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "Email already subscribed" });
      }

      // Add to mailing list
      const subscription = await storage.addToMailingList(email, source);
      
      console.log("📧 MAILING_LIST_SIGNUP", {
        email,
        source,
        subscriptionId: subscription.id,
        timestamp: new Date()
      });

      res.status(201).json({
        message: "Successfully subscribed to mailing list",
        subscription: {
          id: subscription.id,
          email: subscription.email,
          subscribedAt: subscription.subscribedAt
        }
      });
    } catch (error) {
      console.error("❌ MAILING_LIST_ERROR", { error: error.message, email: req.body.email });
      res.status(500).json({ message: "Failed to subscribe to mailing list" });
    }
  });

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
      
      // Get the shift to check timing and status
      const shift = await storage.getShift(shiftId);
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }

      // Check if shift is already cancelled
      console.log("🔍 Shift cancellation check:", { shiftId, currentStatus: shift.status });
      if (shift.status === "cancelled") {
        console.log("❌ Attempt to cancel already cancelled shift blocked");
        return res.status(400).json({ message: "Shift is already cancelled" });
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
      
      // Cancel the shift and convert to opportunity
      const updatedShift = await storage.updateShift(shiftId, {
        ...shift,
        status: "cancelled",
        assignedTo: null,
        assignmentType: "opportunity",
        notes: reason ? `Cancelled: ${reason}` : "Cancelled by staff member"
      });

      // Create an opportunity for other staff to claim this shift
      try {
        const opportunity = await storage.createOpportunity({
          tenantId: shift.tenantId,
          shiftId: shiftId,
          description: `${shift.role} shift available - was cancelled by staff`,
          requirements: `${shift.role} position needed for ${shift.date} ${shift.startTime}-${shift.endTime}`,
          isActive: true
        });
        console.log("✅ Opportunity created for cancelled shift:", opportunity.id);
      } catch (opError) {
        console.error("❌ Failed to create opportunity:", opError);
      }

      // Log activity for owner visibility
      try {
        const activityLog = await storage.createActivityLog({
          tenantId: shift.tenantId,
          userId: userId,
          action: "shift_cancelled",
          resourceType: "shift",
          resourceId: shiftId.toString(),
          details: `Staff cancelled ${shift.role} shift on ${shift.date}. Reason: ${reason || "No reason provided"}`,
          ipAddress: "127.0.0.1",
          userAgent: "ShiftFlo App"
        });
        console.log("✅ Activity log created for cancellation:", activityLog.id);
      } catch (logError) {
        console.error("❌ Failed to create activity log:", logError);
      }
      
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
      
      // Use current date for filtering - FIX: Use actual current date
      const todayString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const todayShifts = shifts.filter(s => s.date === todayString);
      
      console.log("🔍 SHIFTS_RAW_DATA", { 
        tenantId, 
        totalShifts: shifts.length, 
        todayShifts: todayShifts.length,
        sampleTodayShift: todayShifts[0],
        allDates: shifts.map(s => s.date).slice(0, 10), // First 10 dates
        today: todayString,
        nextWeek: nextWeek.toISOString().split('T')[0]
      });
      
      const filteredShifts = shifts.filter(shift => {
        // Parse the shift date and set to start of day
        const shiftDate = new Date(shift.date);
        shiftDate.setHours(0, 0, 0, 0);
        
        const isInRange = shiftDate >= today && shiftDate <= nextWeek;
        
        // Debug today's shifts specifically
        if (shift.date === todayString) {
          console.log("🎯 TODAY_SHIFT_DEBUG", { 
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
      
      // Calculate coverage statistics - FIX: Include assigned shifts as active
      const active = filteredShifts.filter(s => s.status === "assigned" || s.status === "confirmed").length;
      const upcoming = filteredShifts.filter(s => s.status === "claimed").length;
      const unfilled = filteredShifts.filter(s => s.status === "open" || s.status === "declined").length;
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
            entry.clockInTime && !entry.clockOutTime && 
            (entry.status === "clocked_in" || entry.status === "on_break" || entry.status === "late" || entry.status === "on_time")
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
      const shift = await storage.getShift(escalationId);
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      
      // Create opportunity from unfilled shift
      const opportunity = await storage.createOpportunity({
        tenantId: shift.tenantId,
        shiftId: shift.id,
        description: `URGENT: ${shift.description}`,
        requirements: `Emergency coverage needed for ${shift.role} at ${shift.location} on ${shift.date} from ${shift.startTime}-${shift.endTime}`,
        isActive: true
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
      const shift = await storage.getShift(escalationId);
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

  app.post("/api/escalations/:id/send-to-team", async (req, res) => {
    try {
      const escalationId = parseInt(req.params.id);
      const { tenantId, action, priority } = req.body;
      
      console.log("📢 ESCALATION_SEND_TO_TEAM", { escalationId, tenantId, action, timestamp: new Date() });
      
      // Get the shift that needs coverage
      const shift = await storage.getShift(escalationId);
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      
      // Create opportunity from the declined/unfilled shift
      const opportunity = await storage.createOpportunity({
        tenantId: shift.tenantId,
        shiftId: shift.id,
        description: `URGENT: ${shift.description}`,
        requirements: `Emergency coverage needed for ${shift.role} at ${shift.location} on ${shift.date} from ${shift.startTime}-${shift.endTime}`,
        isActive: true
      });
      
      // Log team broadcast notification
      console.log("📱 TEAM_OPPORTUNITY_BROADCAST", {
        escalationId,
        opportunityId: opportunity.id,
        shiftRole: shift.role,
        shiftDate: shift.date,
        message: `Urgent coverage needed: ${shift.role} shift on ${shift.date}`,
        timestamp: new Date()
      });
      
      console.log("✅ ESCALATION_SEND_TO_TEAM_SUCCESS", { 
        escalationId, 
        opportunityId: opportunity.id, 
        timestamp: new Date() 
      });
      
      res.json({ 
        success: true, 
        opportunityId: opportunity.id,
        message: "Opportunity created and broadcast to team"
      });
    } catch (error) {
      console.error("❌ ESCALATION_SEND_TO_TEAM_FAILED", { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: "Failed to send opportunity to team" });
    }
  });

  app.post("/api/escalations/:id/system-alert", async (req, res) => {
    try {
      const escalationId = parseInt(req.params.id);
      const { tenantId, action, priority } = req.body;
      
      console.log("📢 ESCALATION_SYSTEM_ALERT", { escalationId, tenantId, action, timestamp: new Date() });
      
      // Get the shift that needs urgent coverage
      const shift = await storage.getShift(escalationId);
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      
      // Get all active staff members for system-wide notification
      // For now, simulate getting staff members - in real implementation would query users table
      const staffMembers = [
        { id: 1, firstName: "John", lastName: "Doe" },
        { id: 3, firstName: "Jane", lastName: "Smith" },
        { id: 4, firstName: "Mike", lastName: "Johnson" }
      ];
      
      console.log("📱 SYSTEM_WIDE_URGENT_BROADCAST", {
        escalationId,
        shiftRole: shift.role,
        shiftDate: shift.date,
        shiftTime: `${shift.startTime}-${shift.endTime}`,
        location: shift.location,
        staffNotified: staffMembers.length,
        urgentMessage: `URGENT: Emergency coverage needed for ${shift.role} shift on ${shift.date} at ${shift.location}`,
        timestamp: new Date()
      });
      
      // Log individual staff notifications (in real system this would trigger SMS/push notifications)
      staffMembers.forEach(staff => {
        console.log("📱 URGENT_STAFF_NOTIFICATION", {
          escalationId,
          staffId: staff.id,
          staffName: `${staff.firstName} ${staff.lastName}`,
          message: `URGENT: Emergency coverage needed for ${shift.role} shift`,
          timestamp: new Date()
        });
      });
      
      console.log("✅ ESCALATION_SYSTEM_ALERT_SUCCESS", { 
        escalationId, 
        staffNotified: staffMembers.length,
        timestamp: new Date() 
      });
      
      res.json({ 
        success: true, 
        staffNotified: staffMembers.length,
        message: `Urgent alert sent to ${staffMembers.length} staff members`
      });
    } catch (error) {
      console.error("❌ ESCALATION_SYSTEM_ALERT_FAILED", { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: "Failed to send system-wide alert" });
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
      
      // Identify declined assignments that need immediate action
      const declinedShifts = shifts.filter(shift => shift.status === "declined");
      
      declinedShifts.forEach(shift => {
        escalations.push({
          id: shift.id,
          type: "assignment_declined",
          description: `${shift.role} assignment declined - opportunity auto-created`,
          affectedShifts: 1,
          urgency: "high",
          createdAt: shift.updatedAt || new Date().toISOString()
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

  // Photo upload endpoint
  app.post("/api/users/:id/photo", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      console.log('📤 PHOTO_UPLOAD_REQUEST', { 
        userId,
        hasFile: !!(req as any).file,
        bodyKeys: Object.keys(req.body),
        timestamp: new Date()
      });
      
      // For now, simulate a successful upload and return a placeholder URL
      // In production, this would handle FormData, validate the file, 
      // upload to cloud storage (S3, Cloudinary, etc.), and return the permanent URL
      
      const photoUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${userId}&backgroundColor=3b82f6`;
      
      console.log('✅ PHOTO_UPLOAD_SUCCESS', { 
        userId,
        photoUrl: photoUrl.substring(0, 50) + '...',
        timestamp: new Date()
      });
      
      res.json({ photoUrl });
    } catch (error) {
      console.error('❌ PHOTO_UPLOAD_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  // Token verification endpoint for activation page
  app.get('/api/auth/verify-token', async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: 'Token is required' });
      }

      const user = await storage.getUserByActivationToken(token);
      
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }

      if (user.activatedAt) {
        return res.status(400).json({ message: 'Account already activated' });
      }

      if (user.tokenExpiresAt && new Date() > user.tokenExpiresAt) {
        return res.status(400).json({ message: 'Token has expired' });
      }

      res.json({
        success: true,
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(500).json({ message: 'Server error during token verification' });
    }
  });

  // Account activation endpoint
  app.post('/api/auth/activate', async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: 'Token and password are required' });
      }

      const user = await storage.getUserByActivationToken(token);
      
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }

      if (user.activatedAt) {
        return res.status(400).json({ message: 'Account already activated' });
      }

      if (user.tokenExpiresAt && new Date() > user.tokenExpiresAt) {
        return res.status(400).json({ message: 'Token has expired' });
      }

      // Activate the user
      const activatedUser = await storage.activateUser(user.id, password);
      
      if (!activatedUser) {
        return res.status(500).json({ message: 'Failed to activate account' });
      }

      res.json({
        success: true,
        message: 'Account activated successfully',
        user: {
          id: activatedUser.id,
          firstName: activatedUser.firstName,
          lastName: activatedUser.lastName,
          email: activatedUser.email
        }
      });
    } catch (error) {
      console.error('Account activation error:', error);
      res.status(500).json({ message: 'Server error during account activation' });
    }
  });

  // Admin Staff Invitation API
  app.post("/api/admin/staff", async (req, res) => {
    try {
      const { firstName, lastName, email, role, tenantId } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !role || !tenantId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check seat limit before creating staff
      const subscription = await storage.getSubscriptionByTenantId(tenantId);
      const totalSeats = subscription?.seatsIncluded || 5;
      
      const tenantUsers = await storage.getStaffByTenant(tenantId);
      const currentActiveStaffCount = tenantUsers.filter(u => u.isActive).length; // Only active staff count toward seats
      
      if (currentActiveStaffCount >= totalSeats) {
        console.log(`🚫 SEAT_LIMIT_EXCEEDED: ${currentActiveStaffCount}/${totalSeats} seats used for tenant ${tenantId}`);
        return res.status(400).json({ 
          message: `Active staff limit reached (${currentActiveStaffCount}/${totalSeats}). Upgrade your subscription or deactivate active staff to add more users.`,
          code: 'SEAT_LIMIT_EXCEEDED',
          currentSeats: currentActiveStaffCount,
          maxSeats: totalSeats
        });
      }

      // Check if email already exists in the system
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser) {
        return res.status(400).json({ 
          message: `A user with email ${email} already exists. Please use a different email address.` 
        });
      }

      // Generate activation token and expiry (7 days from now)
      const activationToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);

      // Create user with is_active = false, using email as username
      const [newUser] = await db.insert(users).values({
        tenantId,
        username: email, // Use email as username
        password: '', // Temporary empty password
        role,
        firstName,
        lastName,
        email,
        isActive: false,
        activationToken,
        tokenExpiresAt,
        phone: null,
        address: null,
        dateOfBirth: null,
        hireDate: new Date().toISOString().split('T')[0],
        employeeId: null,
        emergencyContactName: null,
        emergencyContactPhone: null,
        photoUrl: null,
        bio: null,
      }).returning();

      console.log(`📧 STAFF_INVITATION_CREATED`, {
        userId: newUser.id,
        email,
        activationToken: activationToken.substring(0, 8) + '...',
        expiresAt: tokenExpiresAt,
        timestamp: new Date()
      });

      // Send activation email with dynamic domain
      try {
        const activeDomain = await getActiveDomain();
        await sendActivationEmail(email, activationToken, activeDomain);
        console.log(`✅ ACTIVATION_EMAIL_SENT`, { email, domain: activeDomain, timestamp: new Date() });
      } catch (emailError) {
        console.error(`❌ EMAIL_SEND_FAILED`, { error: emailError.message, email, timestamp: new Date() });
        // Continue without failing the request - user creation was successful
      }

      res.json({ 
        message: `Invitation sent to ${email}`,
        userId: newUser.id 
      });
    } catch (error) {
      console.error('❌ STAFF_INVITATION_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: "Failed to create staff invitation" });
    }
  });

  // Subdomain availability check API
  app.post("/api/check-subdomain", async (req, res) => {
    try {
      const { subdomain } = req.body;
      
      if (!subdomain) {
        return res.status(400).json({ message: "Subdomain is required" });
      }

      // Check if subdomain already exists as a tenantId
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.tenantId, subdomain))
        .limit(1);

      const available = !existingUser;
      
      res.json({ 
        available,
        subdomain,
        message: available ? "Subdomain is available" : "Subdomain is already taken"
      });
    } catch (error) {
      console.error("Error checking subdomain:", error);
      res.status(500).json({ message: "Failed to check subdomain availability" });
    }
  });

  // Campaign Management APIs (for simplified registration)
  app.get("/api/campaigns/default", async (req, res) => {
    try {
      const [defaultCampaign] = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.isActive, true))
        .orderBy(campaigns.createdAt)
        .limit(1);

      if (!defaultCampaign) {
        return res.status(404).json({ message: "No active campaign found" });
      }

      res.json(defaultCampaign);
    } catch (error) {
      console.error("Error fetching default campaign:", error);
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  // Simplified Business Registration API
  app.post("/api/register-business", async (req, res) => {
    try {
      console.log("📝 Register business request received");
      console.log("📋 Content-Type:", req.get('Content-Type'));
      console.log("📋 Raw request body:", JSON.stringify(req.body, null, 2));
      console.log("📋 Request body type:", typeof req.body);
      console.log("📋 Request body keys:", Object.keys(req.body || {}));
      
      // Extract values from flat structure that form sends
      const { 
        businessName, 
        ownerFirstName, 
        ownerLastName, 
        ownerEmail, 
        subdomain,
        businessType = "General",
        seatsNeeded = 5,
        wantsTrial = true,
        campaignId,
        trialDays,
        pricePerSeat
      } = req.body;
      
      console.log("📋 Registration data received:", { 
        businessName, 
        ownerFirstName, 
        ownerLastName, 
        ownerEmail, 
        subdomain,
        businessType,
        seatsNeeded,
        wantsTrial
      });
      
      // Validate required fields
      if (!businessName || !ownerFirstName || !ownerLastName || !ownerEmail || !subdomain) {
        console.error("❌ Missing required fields:", { businessName, ownerFirstName, ownerLastName, ownerEmail, subdomain });
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Create tenant record
      const tenantId = subdomain;
      await db
        .insert(tenants)
        .values({
          name: businessName,
          subdomain: tenantId,
        });
      console.log("✅ Tenant record created");
      
      // Create business owner user with token expiration (24 hours)
      const activationToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      console.log("📝 Generated activation token:", activationToken);
      
      // Create user with raw SQL to bypass Drizzle timestamp issues
      const userResult = await db.execute(sql`
        INSERT INTO users (
          tenant_id, username, password, role, first_name, last_name, 
          email, is_active, activation_token, token_expires_at
        ) VALUES (
          ${tenantId}, ${ownerEmail}, ${'temp-password'}, ${'owner'}, 
          ${ownerFirstName}, ${ownerLastName}, ${ownerEmail}, ${false}, 
          ${activationToken}, ${tokenExpiresAt.toISOString()}
        ) RETURNING *
      `);
      
      const owner = userResult.rows[0];
      console.log("✅ User created:", owner.id);

      // Create business profile
      await db
        .insert(businessProfiles)
        .values({
          tenantId,
          name: businessName,
          ownerName: `${ownerFirstName} ${ownerLastName}`,
          email: ownerEmail,
          phone: null,
          website: null,
          businessType,
        });
      console.log("✅ Business profile created");

      console.log("📝 Starting subscription creation...");
      console.log("📋 Form data values:", { seatsNeeded, wantsTrial, trialDays, pricePerSeat, campaignId });
      
      // Create default subscription using form data
      const subscriptionData = {
        tenantId,
        planId: 'seat_based',
        startDate: new Date(),
        endDate: new Date(Date.now() + (trialDays || 14) * 24 * 60 * 60 * 1000), // Trial days from campaign
        status: wantsTrial ? 'trial' as const : 'active' as const,
        seatsIncluded: seatsNeeded || 5,
        seatsUsed: 1, // Owner
        pricePerSeat: (pricePerSeat || 3) * 100, // Convert to pence
        monthlyTotal: (seatsNeeded || 5) * (pricePerSeat || 3) * 100, // Total monthly cost in pence
      };
      
      console.log("📝 Subscription data created successfully:", subscriptionData);
      
      console.log("📝 Subscription data to insert:", subscriptionData);
      
      await db
        .insert(subscriptions)
        .values(subscriptionData);
      console.log("✅ Subscription created");

      // Create default location
      await db
        .insert(locations)
        .values({
          tenantId,
          name: "Main Office",
          address: "123 Business Street",
          city: "Business City",
          state: "Business State",
          zipCode: "12345",
          country: "United Kingdom",
        });
      console.log("✅ Default location created");

      // Create default job roles
      const defaultRoles = [
        { title: "Team Member", description: "General team member role" },
        { title: "Supervisor", description: "Team supervisor role" },
        { title: "Manager", description: "Department manager role" },
      ];

      for (const role of defaultRoles) {
        await db
          .insert(jobRoles)
          .values({
            tenantId,
            title: role.title,
            description: role.description,
            isActive: true,
          });
      }
      console.log("✅ Default job roles created");

      // Create default departments
      const defaultDepartments = [
        { name: "Operations", description: "Core business operations", managerId: owner.id },
        { name: "Administration", description: "Administrative functions", managerId: owner.id },
        { name: "Customer Service", description: "Customer-facing operations", managerId: owner.id },
      ];

      for (const dept of defaultDepartments) {
        await db
          .insert(departments)
          .values({
            tenantId,
            name: dept.name,
            description: dept.description,
            managerId: dept.managerId,
            isActive: true,
          });
      }
      console.log("✅ Default departments created");

      // Create default operating hours (Mon-Fri 9-5, closed weekends)
      const defaultHours = [
        { dayOfWeek: "monday", openTime: "09:00", closeTime: "17:00", isOpen: true },
        { dayOfWeek: "tuesday", openTime: "09:00", closeTime: "17:00", isOpen: true },
        { dayOfWeek: "wednesday", openTime: "09:00", closeTime: "17:00", isOpen: true },
        { dayOfWeek: "thursday", openTime: "09:00", closeTime: "17:00", isOpen: true },
        { dayOfWeek: "friday", openTime: "09:00", closeTime: "17:00", isOpen: true },
        { dayOfWeek: "saturday", openTime: "09:00", closeTime: "17:00", isOpen: false },
        { dayOfWeek: "sunday", openTime: "09:00", closeTime: "17:00", isOpen: false },
      ];

      for (const hours of defaultHours) {
        await db
          .insert(operatingHours)
          .values({
            tenantId,
            dayOfWeek: hours.dayOfWeek,
            openTime: hours.openTime,
            closeTime: hours.closeTime,
            isOpen: hours.isOpen,
          });
      }
      console.log("✅ Default operating hours created");

      // Create default shift policies
      await db
        .insert(shiftPolicies)
        .values({
          tenantId,
          minNoticeHours: 24,
          maxAdvanceBookingDays: 30,
          autoApproveSwaps: false,
          requireManagerApproval: true,
          resetPeriodDays: 90,
          lateGracePeriodMinutes: 10,
          clockInBufferMinutes: 15,
          clockOutBufferMinutes: 30,
        });
      console.log("✅ Shift policies created");

      // Send activation email with dynamic domain
      try {
        const activeDomain = await getActiveDomain();
        const { sendActivationEmail } = await import('./utils/mailer.js');
        console.log(`📧 Attempting to send activation email to: ${ownerEmail}`);
        await sendActivationEmail(ownerEmail, activationToken, activeDomain);
        console.log(`✅ Activation email sent successfully to: ${ownerEmail}`);
      } catch (emailError) {
        console.error(`❌ Failed to send activation email to ${ownerEmail}:`, emailError);
        // Don't fail registration if email fails
      }

      const activeDomain = await getActiveDomain();
      res.json({
        message: "Business registration successful",
        tenantId,
        ownerId: owner.id,
        activationLink: `${activeDomain}/activate?token=${activationToken}`,
      });
    } catch (error: any) {
      console.error("Business registration error:", error);
      
      // Handle specific database constraint violations
      if (error.code === '23505') {
        if (error.constraint === 'users_username_unique' || error.detail?.includes('username')) {
          return res.status(400).json({ 
            message: "An account with this email already exists",
            field: "email"
          });
        }
        
        if (error.detail?.includes('subdomain')) {
          return res.status(400).json({ 
            message: "This subdomain is already taken",
            field: "subdomain"
          });
        }
      }
      
      res.status(500).json({ message: "Failed to register business" });
    }
  });

  // Get Activation Token Info API
  app.get("/api/activate", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ message: "Activation token is required" });
      }

      // Find user with valid token
      const [user] = await db
        .select({
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role,
        })
        .from(users)
        .where(
          and(
            eq(users.activationToken, token as string),
            gt(users.tokenExpiresAt, new Date())
          )
        );

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired activation token" });
      }

      console.log(`🔍 ACTIVATION_TOKEN_VALIDATED`, { 
        email: user.email, 
        token: (token as string).substring(0, 8) + '...',
        timestamp: new Date() 
      });

      res.json(user);
    } catch (error) {
      console.error('❌ ACTIVATION_LOOKUP_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: "Failed to validate activation token" });
    }
  });

  // Activate Account API
  app.post("/api/activate", async (req, res) => {
    try {
      const { token, password, phone = null, address = null, bio = null } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      // Find user with valid token
      const [user] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.activationToken, token),
            gt(users.tokenExpiresAt, new Date())
          )
        );

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired activation token" });
      }

      // Update user with password and additional info
      await db
        .update(users)
        .set({
          password,
          phone: phone || null,
          address: address || null,
          bio: bio || null,
          isActive: true,
          activationToken: null,
          tokenExpiresAt: null,
        })
        .where(eq(users.id, user.id));

      console.log(`✅ ACCOUNT_ACTIVATED`, { 
        userId: user.id,
        email: user.email,
        timestamp: new Date() 
      });

      res.json({ message: "Account activated successfully" });
    } catch (error) {
      console.error('❌ ACCOUNT_ACTIVATION_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: "Failed to activate account" });
    }
  });

  // Login API
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), eq(users.isActive, true)));

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // In a real app, use bcrypt to compare passwords
      // For now, compare directly (not secure)
      if (user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session (simplified)
      const sessionToken = crypto.randomBytes(32).toString('hex');
      
      // Set secure HTTP-only cookie
      res.cookie('session_token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      console.log(`✅ USER_LOGIN`, { 
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        timestamp: new Date() 
      });

      res.json({ 
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          tenantId: user.tenantId,
        }
      });
    } catch (error) {
      console.error('❌ LOGIN_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get Current User API
  app.get("/api/auth/me", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;

      if (!sessionToken) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // In a real app, store sessions in database/redis
      // For now, this is a simplified implementation
      // You would validate the session token here
      
      // For now, just return unauthorized to force login
      return res.status(401).json({ message: "Session validation not implemented" });
    } catch (error) {
      console.error('❌ AUTH_CHECK_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: "Authentication check failed" });
    }
  });

  // Logout API
  app.post("/api/auth/logout", async (req, res) => {
    try {
      // Clear session cookie
      res.clearCookie('session_token');
      
      console.log(`✅ USER_LOGOUT`, { timestamp: new Date() });
      
      res.json({ message: "Logout successful" });
    } catch (error) {
      console.error('❌ LOGOUT_ERROR', { error: error.message, timestamp: new Date() });
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Admin Off-boarding API
  app.patch("/api/admin/users/:id/offboard", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // In a real app, validate that caller has "owner" role
      // For now, assuming authorization is handled by frontend

      const result = await db.transaction(async (tx) => {
        const today = new Date().toISOString().split('T')[0];
        
        // Update shifts: unassign all upcoming shifts for this user
        const shiftUpdateResult = await tx
          .update(shifts)
          .set({
            assignedTo: null,
            status: 'open',
          })
          .where(
            and(
              eq(shifts.assignedTo, userId),
              gt(shifts.date, today)
            )
          );

        // Deactivate the user
        await tx
          .update(users)
          .set({
            isActive: false,
          })
          .where(eq(users.id, userId));

        return {
          shiftsUpdated: shiftUpdateResult.rowCount || 0,
          userDeactivated: true
        };
      });

      console.log(`🚫 USER_OFFBOARDED`, {
        userId,
        shiftsUpdated: result.shiftsUpdated,
        timestamp: new Date()
      });

      res.json(result);
    } catch (error) {
      console.error("Error off-boarding user:", error);
      res.status(500).json({ message: "Failed to off-board user: " + error.message });
    }
  });

  // Admin Reinstatement API
  app.patch("/api/admin/users/:id/reinstate", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Get user info for logging
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user[0]) {
        return res.status(404).json({ message: "User not found" });
      }

      // Reactivate the user
      await db
        .update(users)
        .set({
          isActive: true,
        })
        .where(eq(users.id, userId));

      console.log(`✅ USER_REINSTATED`, {
        userId,
        userEmail: user[0].email,
        timestamp: new Date()
      });

      res.json({
        userReactivated: true,
        message: `${user[0].firstName} ${user[0].lastName} has been successfully reinstated`
      });
    } catch (error) {
      console.error("Error reinstating user:", error);
      res.status(500).json({ message: "Failed to reinstate user" });
    }
  });

  // Permanently Delete User API (Hard Delete - Only for inactive users)
  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Get user first to check if exists and is inactive
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isActive) {
        return res.status(400).json({ 
          message: "Cannot delete active user. Please off-board the user first." 
        });
      }

      // Delete user permanently from database
      await db
        .delete(users)
        .where(eq(users.id, userId));

      console.log(`🗑️ USER_DELETED_PERMANENTLY`, { 
        userId, 
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        timestamp: new Date()
      });

      res.json({ 
        message: "User permanently deleted from database",
        userDeleted: true
      });

    } catch (error: any) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user: " + error.message });
    }
  });

  // Subdomain availability check API
  app.get("/api/check-subdomain/:subdomain", async (req, res) => {
    try {
      const { subdomain } = req.params;
      
      // Check if subdomain already exists in business_profiles (used as tenant_id)
      const [existingBusiness] = await db
        .select()
        .from(businessProfiles)
        .where(eq(businessProfiles.tenantId, subdomain))
        .limit(1);
      
      const isAvailable = !existingBusiness;
      
      res.json({ 
        available: isAvailable,
        subdomain,
        message: isAvailable ? "Subdomain is available" : "Subdomain is already taken"
      });
      
    } catch (error: any) {
      console.error("Subdomain check error:", error);
      res.status(500).json({ message: "Failed to check subdomain availability" });
    }
  });



  // Get seat pricing endpoint
  app.get("/api/seat-pricing", async (req, res) => {
    try {
      const pricing = await db.select().from(seatPricing);
      res.json(pricing);
    } catch (error: any) {
      console.error("Get seat pricing error:", error);
      res.status(500).json({ message: "Failed to get pricing: " + error.message });
    }
  });

  // ==== ADMIN PORTAL MANAGEMENT ENDPOINTS ====

  // GET /api/admin/dashboard - Super admin dashboard statistics
  app.get('/api/admin/dashboard', adminAuth, requireRole(['super_admin']), async (req, res) => {
    try {
      console.log('📊 ADMIN_DASHBOARD_FETCH', { timestamp: new Date() });

      // Get total statistics
      const [tenantCount] = await db.select({ count: sql<number>`count(*)` }).from(tenants);
      const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
      const [recentRegistrations] = await db.select({ count: sql<number>`count(*)` })
        .from(tenants)
        .where(gt(tenants.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));

      // Get subscription statistics  
      const activeSubscriptions = await db.select()
        .from(subscriptions)
        .where(eq(subscriptions.status, 'active'));

      const trialSubscriptions = await db.select()
        .from(subscriptions)
        .where(eq(subscriptions.status, 'trial'));

      const totalRevenue = activeSubscriptions.reduce((sum, sub) => 
        sum + (sub.pricePerSeat * sub.seatsIncluded), 0);

      // Get recent support tickets
      const recentTickets = await db.select()
        .from(supportTickets)
        .orderBy(sql`created_at DESC`)
        .limit(10);

      const openTickets = await db.select({ count: sql<number>`count(*)` })
        .from(supportTickets)
        .where(eq(supportTickets.status, 'open'));

      res.json({
        platform: {
          totalTenants: tenantCount.count,
          totalUsers: userCount.count,
          recentRegistrations: recentRegistrations.count,
          openTickets: openTickets[0].count
        },
        subscriptions: {
          active: activeSubscriptions.length,
          trial: trialSubscriptions.length,
          totalRevenue
        },
        recentTickets
      });

      console.log('✅ ADMIN_DASHBOARD_SUCCESS', { timestamp: new Date() });
    } catch (error) {
      console.error('❌ ADMIN_DASHBOARD_ERROR', { error: error.message });
      res.status(500).json({ message: 'Failed to fetch dashboard data' });
    }
  });

  // REMOVED: Duplicate tenant route - moved to setupAdminTenantRoutes() in routes/admin/tenants.ts

  // GET /api/admin/landing-pages - Page Builder system
  app.get('/api/admin/landing-pages', adminAuth, requireRole(['super_admin', 'marketing']), async (req, res) => {
    try {
      const { tenant_id } = req.query;
      
      let query = db.select().from(landingPages);
      
      if (tenant_id) {
        query = query.where(eq(landingPages.tenantId, tenant_id as string));
      }
      
      const pages = await query;
      res.json(pages);
    } catch (error) {
      console.error('❌ ADMIN_LANDING_PAGES_ERROR', { error: error.message });
      res.status(500).json({ message: 'Failed to fetch landing pages' });
    }
  });

  // PUT /api/admin/landing-pages/:tenantId - Update landing page layout
  app.put('/api/admin/landing-pages/:tenantId', adminAuth, requireRole(['super_admin', 'marketing']), async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { layout, isActive } = req.body;

      const [updatedPage] = await db.insert(landingPages)
        .values({
          tenantId,
          layout: layout || [],
          isActive: isActive !== undefined ? isActive : true
        })
        .onConflictDoUpdate({
          target: landingPages.tenantId,
          set: {
            layout: layout || [],
            isActive: isActive !== undefined ? isActive : true,
            updatedAt: new Date()
          }
        })
        .returning();

      console.log('✅ ADMIN_LANDING_PAGE_UPDATED', {
        tenantId,
        layoutComponents: Array.isArray(layout) ? layout.length : 0,
        timestamp: new Date()
      });

      res.json(updatedPage);
    } catch (error) {
      console.error('❌ ADMIN_LANDING_PAGE_UPDATE_ERROR', { error: error.message });
      res.status(500).json({ message: 'Failed to update landing page' });
    }
  });

  // GET /api/admin/support-tickets - Support ticket management
  app.get('/api/admin/support-tickets', adminAuth, requireRole(['super_admin', 'support']), async (req, res) => {
    try {
      const { status, priority, assigned_to } = req.query;
      
      let query = db.select().from(supportTickets);
      const conditions = [];
      
      if (status) conditions.push(eq(supportTickets.status, status as string));
      if (priority) conditions.push(eq(supportTickets.priority, priority as string));
      if (assigned_to) conditions.push(eq(supportTickets.assignedAdminId, parseInt(assigned_to as string)));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      const tickets = await query.orderBy(sql`created_at DESC`);
      res.json(tickets);
    } catch (error) {
      console.error('❌ ADMIN_SUPPORT_TICKETS_ERROR', { error: error.message });
      res.status(500).json({ message: 'Failed to fetch support tickets' });
    }
  });

  // PUT /api/admin/support-tickets/:id - Update support ticket
  app.put('/api/admin/support-tickets/:id', adminAuth, requireRole(['super_admin', 'support']), async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const { status, assignedAdminId, resolvedAt } = req.body;
      const adminId = (req as any).admin.id;

      const updateData: any = {};
      if (status) updateData.status = status;
      if (assignedAdminId !== undefined) updateData.assignedAdminId = assignedAdminId;
      if (resolvedAt) updateData.resolvedAt = new Date(resolvedAt);

      const [updatedTicket] = await db.update(supportTickets)
        .set(updateData)
        .where(eq(supportTickets.id, ticketId))
        .returning();

      console.log('✅ ADMIN_TICKET_UPDATED', {
        ticketId,
        status,
        adminId,
        timestamp: new Date()
      });

      res.json(updatedTicket);
    } catch (error) {
      console.error('❌ ADMIN_TICKET_UPDATE_ERROR', { error: error.message });
      res.status(500).json({ message: 'Failed to update ticket' });
    }
  });

  // GET /api/admin/platform-settings - Platform configuration
  app.get('/api/admin/platform-settings', adminAuth, requireRole(['super_admin']), async (req, res) => {
    try {
      const settings = await db.select().from(platformSettings);
      res.json(settings);
    } catch (error) {
      console.error('❌ ADMIN_PLATFORM_SETTINGS_ERROR', { error: error.message });
      res.status(500).json({ message: 'Failed to fetch platform settings' });
    }
  });

  // PUT /api/admin/platform-settings/:key - Update platform setting
  app.put('/api/admin/platform-settings/:key', adminAuth, requireRole(['super_admin']), async (req, res) => {
    try {
      const { key } = req.params;
      const { value, description } = req.body;
      const adminId = (req as any).admin.id;

      const [updatedSetting] = await db.insert(platformSettings)
        .values({
          key,
          value,
          description,
          updatedBy: adminId
        })
        .onConflictDoUpdate({
          target: platformSettings.key,
          set: {
            value,
            description,
            updatedBy: adminId,
            updatedAt: new Date()
          }
        })
        .returning();

      console.log('✅ ADMIN_SETTING_UPDATED', {
        key,
        adminId,
        timestamp: new Date()
      });

      res.json(updatedSetting);
    } catch (error) {
      console.error('❌ ADMIN_SETTING_UPDATE_ERROR', { error: error.message });
      res.status(500).json({ message: 'Failed to update setting' });
    }
  });

  // GET /api/admin/pricing-plans - Pricing plan management
  app.get('/api/admin/pricing-plans', adminAuth, requireRole(['super_admin', 'finance']), async (req, res) => {
    try {
      const plans = await db.select().from(pricingPlans).orderBy(sql`price_per_seat ASC`);
      res.json(plans);
    } catch (error) {
      console.error('❌ ADMIN_PRICING_PLANS_ERROR', { error: error.message });
      res.status(500).json({ message: 'Failed to fetch pricing plans' });
    }
  });

  // POST /api/admin/pricing-plans - Create pricing plan
  app.post('/api/admin/pricing-plans', adminAuth, requireRole(['super_admin', 'finance']), async (req, res) => {
    try {
      const { name, pricePerSeat, features } = req.body;

      const [newPlan] = await db.insert(pricingPlans)
        .values({
          name,
          pricePerSeat,
          features: features || [],
          isActive: true
        })
        .returning();

      console.log('✅ ADMIN_PRICING_PLAN_CREATED', {
        planId: newPlan.id,
        name,
        pricePerSeat,
        timestamp: new Date()
      });

      res.json(newPlan);
    } catch (error) {
      console.error('❌ ADMIN_PRICING_PLAN_CREATE_ERROR', { error: error.message });
      res.status(500).json({ message: 'Failed to create pricing plan' });
    }
  });

  // GET /api/admin/mailing-list - Mailing list management
  app.get('/api/admin/mailing-list', adminAuth, requireRole(['super_admin', 'marketing']), async (req, res) => {
    try {
      const { search, tags } = req.query;
      
      let query = db.select().from(mailingList);
      const conditions = [];
      
      if (search) {
        conditions.push(or(
          sql`${mailingList.email} ILIKE ${`%${search}%`}`,
          sql`${mailingList.name} ILIKE ${`%${search}%`}`
        ));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      const subscribers = await query.orderBy(sql`created_at DESC`);
      res.json(subscribers);
    } catch (error) {
      console.error('❌ ADMIN_MAILING_LIST_ERROR', { error: error.message });
      res.status(500).json({ message: 'Failed to fetch mailing list' });
    }
  });

  // POST /api/admin/broadcast-email - Send broadcast email
  app.post('/api/admin/broadcast-email', adminAuth, requireRole(['super_admin', 'marketing']), async (req, res) => {
    try {
      const { subject, content, recipientTags, testMode } = req.body;
      const adminId = (req as any).admin.id;

      // In a real implementation, this would integrate with an email service
      // For now, we'll just log the broadcast
      console.log('📧 ADMIN_BROADCAST_EMAIL', {
        subject,
        recipientTags,
        testMode,
        adminId,
        timestamp: new Date()
      });

      // Mock response
      res.json({
        success: true,
        messageId: `broadcast_${Date.now()}`,
        recipientCount: testMode ? 1 : 100, // Mock count
        scheduledAt: new Date()
      });
    } catch (error) {
      console.error('❌ ADMIN_BROADCAST_ERROR', { error: error.message });
      res.status(500).json({ message: 'Failed to send broadcast' });
    }
  });

  // Helper function to get active domain
  async function getActiveDomain() {
    const activeDomain = await db
      .select()
      .from(domainConfig)
      .where(eq(domainConfig.isActive, true))
      .limit(1);
    
    return activeDomain[0]?.baseUrl || 'http://localhost:5000';
  }

  // Password and Email Management Routes

  // Change Password - POST /api/users/me/password
  app.post("/api/users/me/password", async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters long" });
      }

      // Get current user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password and clear any reset tokens
      await db
        .update(users)
        .set({
          password: hashedNewPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        })
        .where(eq(users.id, userId));

      console.log("✅ PASSWORD_CHANGED", { userId, timestamp: new Date() });
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("❌ PASSWORD_CHANGE_ERROR", { error: error.message });
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Change Email - POST /api/users/me/email
  app.post("/api/users/me/email", async (req, res) => {
    try {
      const { newEmail, currentPassword } = req.body;
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (!newEmail || !currentPassword) {
        return res.status(400).json({ message: "New email and current password are required" });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Get current user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Check if new email is already in use
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, newEmail))
        .limit(1);

      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "Email address is already in use" });
      }

      // Generate email change token
      const emailChangeToken = crypto.randomBytes(32).toString('hex');
      const emailChangeExpires = new Date();
      emailChangeExpires.setHours(emailChangeExpires.getHours() + 1); // 1 hour expiry

      // Store token and new email
      await db
        .update(users)
        .set({
          emailChangeToken,
          emailChangeExpires,
          emailChangeNew: newEmail,
        })
        .where(eq(users.id, userId));

      // Send confirmation email to new address
      const activeDomain = await getActiveDomain();
      await sendEmailChangeConfirmation(newEmail, emailChangeToken, activeDomain);

      console.log("✅ EMAIL_CHANGE_INITIATED", { userId, newEmail, timestamp: new Date() });
      res.json({ message: "Confirmation email sent to new address" });
    } catch (error) {
      console.error("❌ EMAIL_CHANGE_ERROR", { error: error.message });
      res.status(500).json({ message: "Failed to initiate email change" });
    }
  });

  // Confirm Email Change - GET /api/auth/confirm-email
  app.get("/api/auth/confirm-email", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }

      // Find user with valid token
      const [user] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.emailChangeToken, token as string),
            gt(users.emailChangeExpires, new Date())
          )
        )
        .limit(1);

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      if (!user.emailChangeNew) {
        return res.status(400).json({ message: "No pending email change" });
      }

      // Update email and clear token fields
      await db
        .update(users)
        .set({
          email: user.emailChangeNew,
          username: user.emailChangeNew, // Update username to match new email
          emailChangeToken: null,
          emailChangeExpires: null,
          emailChangeNew: null,
        })
        .where(eq(users.id, user.id));

      console.log("✅ EMAIL_CHANGE_CONFIRMED", { userId: user.id, newEmail: user.emailChangeNew, timestamp: new Date() });
      res.json({ 
        message: "Email address updated successfully",
        newEmail: user.emailChangeNew
      });
    } catch (error) {
      console.error("❌ EMAIL_CONFIRM_ERROR", { error: error.message });
      res.status(500).json({ message: "Failed to confirm email change" });
    }
  });

  // Forgot Password - POST /api/auth/forgot-password
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Always return success to prevent email enumeration
      const successMessage = "If an account with that email exists, we've sent a password reset link";

      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (user && user.isActive) {
        // Generate reset token
        const resetPasswordToken = crypto.randomBytes(32).toString('hex');
        const resetPasswordExpires = new Date();
        resetPasswordExpires.setHours(resetPasswordExpires.getHours() + 1); // 1 hour expiry

        // Store reset token
        await db
          .update(users)
          .set({
            resetPasswordToken,
            resetPasswordExpires,
          })
          .where(eq(users.id, user.id));

        // Send reset email
        const activeDomain = await getActiveDomain();
        await sendPasswordResetEmail(email, resetPasswordToken, activeDomain);

        console.log("✅ PASSWORD_RESET_INITIATED", { userId: user.id, email, timestamp: new Date() });
      }

      res.json({ message: successMessage });
    } catch (error) {
      console.error("❌ FORGOT_PASSWORD_ERROR", { error: error.message });
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Validate Reset Token - GET /api/auth/validate-reset
  app.get("/api/auth/validate-reset", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }

      // Check if token is valid and not expired
      const [user] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.resetPasswordToken, token as string),
            gt(users.resetPasswordExpires, new Date())
          )
        )
        .limit(1);

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      res.json({ message: "Token is valid" });
    } catch (error) {
      console.error("❌ VALIDATE_RESET_ERROR", { error: error.message });
      res.status(500).json({ message: "Failed to validate reset token" });
    }
  });

  // Reset Password - POST /api/auth/reset-password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      // Find user with valid token
      const [user] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.resetPasswordToken, token),
            gt(users.resetPasswordExpires, new Date())
          )
        )
        .limit(1);

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      // Hash new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password and clear reset token
      await db
        .update(users)
        .set({
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        })
        .where(eq(users.id, user.id));

      console.log("✅ PASSWORD_RESET_COMPLETED", { userId: user.id, timestamp: new Date() });
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("❌ RESET_PASSWORD_ERROR", { error: error.message });
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Setup admin routes
  setupAdminAuthRoutes(app);
  setup2FARoutes(app);
  setupAdminSeatPricingRoutes(app);
  
  // Setup additional admin module routes
  app.use('/api/admin/support', supportRoutes);
  app.use('/api/admin/config', configRoutes);  
  app.use('/api/admin/domains', domainRoutes);
  app.use('/api/admin/analytics', analyticsRoutes);
  
  try {
    console.log('🔧 REGISTERING_TENANT_ROUTES', { timestamp: new Date() });
    setupAdminTenantRoutes(app);
    console.log('✅ TENANT_ROUTES_REGISTERED', { timestamp: new Date() });
  } catch (error) {
    console.error('❌ TENANT_ROUTE_REGISTRATION_ERROR', { error: error.message, timestamp: new Date() });
  }
  
  setupAdminPricingRoutes(app);
  // setupAdminDomainRoutes(app); // Using direct router mounting instead
  setupSeatPricingRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
