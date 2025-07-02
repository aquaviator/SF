import { users, shifts, opportunities, swapRequests, assignments, holidayRequests, scheduleTemplates, type User, type InsertUser, type Shift, type InsertShift, type Opportunity, type InsertOpportunity, type SwapRequest, type InsertSwapRequest, type Assignment, type InsertAssignment, type HolidayRequest, type InsertHolidayRequest, type ScheduleTemplate, type InsertScheduleTemplate } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: InsertUser): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getStaffByTenant(tenantId: string): Promise<User[]>;

  // Shift operations
  getShift(id: number): Promise<Shift | undefined>;
  getShiftsByTenant(tenantId: string): Promise<Shift[]>;
  getShiftsByUser(tenantId: string, userId: number): Promise<Shift[]>;
  createShift(shift: InsertShift): Promise<Shift>;
  updateShift(id: number, shift: InsertShift): Promise<Shift | undefined>;
  deleteShift(id: number): Promise<boolean>;

  // Opportunity operations
  getOpportunity(id: number): Promise<Opportunity | undefined>;
  getOpportunitiesByTenant(tenantId: string): Promise<Opportunity[]>;
  createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity>;
  updateOpportunity(id: number, opportunity: InsertOpportunity): Promise<Opportunity | undefined>;
  deleteOpportunity(id: number): Promise<boolean>;

  // Swap request operations
  getSwapRequest(id: number): Promise<SwapRequest | undefined>;
  getSwapRequestsByTenant(tenantId: string): Promise<SwapRequest[]>;
  createSwapRequest(swapRequest: InsertSwapRequest): Promise<SwapRequest>;
  updateSwapRequest(id: number, swapRequest: InsertSwapRequest): Promise<SwapRequest | undefined>;
  deleteSwapRequest(id: number): Promise<boolean>;

  // Assignment operations
  getAssignment(id: number): Promise<Assignment | undefined>;
  getAssignmentsByTenant(tenantId: string): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: number, assignment: InsertAssignment): Promise<Assignment | undefined>;
  deleteAssignment(id: number): Promise<boolean>;

  // Holiday request operations
  getHolidayRequest(id: number): Promise<HolidayRequest | undefined>;
  getHolidayRequestsByTenant(tenantId: string): Promise<HolidayRequest[]>;
  createHolidayRequest(holidayRequest: InsertHolidayRequest): Promise<HolidayRequest>;
  updateHolidayRequest(id: number, holidayRequest: InsertHolidayRequest): Promise<HolidayRequest | undefined>;
  deleteHolidayRequest(id: number): Promise<boolean>;

  // Schedule template operations
  getScheduleTemplate(id: number): Promise<ScheduleTemplate | undefined>;
  getScheduleTemplatesByTenant(tenantId: string): Promise<ScheduleTemplate[]>;
  createScheduleTemplate(template: InsertScheduleTemplate): Promise<ScheduleTemplate>;
  updateScheduleTemplate(id: number, template: InsertScheduleTemplate): Promise<ScheduleTemplate | undefined>;
  deleteScheduleTemplate(id: number): Promise<boolean>;

  // Time entry operations for clock-in/out
  getActiveTimeEntry(tenantId: string, userId: number): Promise<any | undefined>;
  getTimeEntriesByTenant(tenantId: string): Promise<any[]>;
  createTimeEntry(entry: any): Promise<any>;
  updateTimeEntry(id: number, entry: any): Promise<any | undefined>;
  getTimeEntriesByUser(tenantId: string, userId: number): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private shifts: Map<number, Shift>;
  private opportunities: Map<number, Opportunity>;
  private swapRequests: Map<number, SwapRequest>;
  private assignments: Map<number, Assignment>;
  private holidayRequests: Map<number, HolidayRequest>;
  private scheduleTemplates: Map<number, ScheduleTemplate>;
  private timeEntries: Map<number, any>;
  private currentUserId: number;
  private currentShiftId: number;
  private currentOpportunityId: number;
  private currentSwapRequestId: number;
  private currentAssignmentId: number;
  private currentHolidayRequestId: number;
  private currentScheduleTemplateId: number;
  private currentTimeEntryId: number;

  constructor() {
    this.users = new Map();
    this.shifts = new Map();
    this.opportunities = new Map();
    this.swapRequests = new Map();
    this.assignments = new Map();
    this.holidayRequests = new Map();
    this.scheduleTemplates = new Map();
    this.timeEntries = new Map();
    this.currentUserId = 1;
    this.currentShiftId = 1;
    this.currentOpportunityId = 1;
    this.currentSwapRequestId = 1;
    this.currentAssignmentId = 1;
    this.currentHolidayRequestId = 1;
    this.currentScheduleTemplateId = 1;
    this.currentTimeEntryId = 1;

    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample users
    const sampleUsers: User[] = [
      {
        id: 1,
        username: "john.doe",
        password: "password123",
        role: "owner",
        tenantId: "acme-corp",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@acme-corp.com",
        isActive: true,
      },
      {
        id: 2,
        username: "sarah.anderson",
        password: "password123",
        role: "staff",
        tenantId: "acme-corp",
        firstName: "Sarah",
        lastName: "Anderson",
        email: "sarah.anderson@acme-corp.com",
        isActive: true,
      },
      {
        id: 3,
        username: "mike.johnson",
        password: "password123",
        role: "staff",
        tenantId: "acme-corp",
        firstName: "Mike",
        lastName: "Johnson",
        email: "mike.johnson@acme-corp.com",
        isActive: true,
      },
    ];

    sampleUsers.forEach(user => {
      this.users.set(user.id, user);
      this.currentUserId = Math.max(this.currentUserId, user.id + 1);
    });

    // Sample shifts
    const sampleShifts: Shift[] = [
      {
        id: 1,
        tenantId: "acme-corp",
        date: "2024-12-16",
        startTime: "09:00",
        endTime: "17:00",
        role: "Customer Service",
        description: "Handle customer inquiries and support",
        location: "Main Office - Floor 2",
        assignedTo: 2,
        status: "confirmed",
        assignmentType: "assigned",
        requiredStaff: 1,
        claimedBy: null,
        templateId: null,
        notes: "Regular customer service shift",
        createdBy: 1,
      },
      {
        id: 2,
        tenantId: "acme-corp",
        date: "2024-12-16",
        startTime: "17:00",
        endTime: "23:00",
        role: "Security",
        description: "Evening security patrol and monitoring",
        location: "Building Perimeter",
        assignedTo: null,
        status: "open",
        assignmentType: "opportunity",
        requiredStaff: 1,
        claimedBy: null,
        templateId: null,
        notes: null,
        createdBy: 1,
      },
      {
        id: 3,
        tenantId: "acme-corp",
        date: "2024-12-17",
        startTime: "06:00",
        endTime: "14:00",
        role: "Cleaning",
        description: "General cleaning and maintenance",
        location: "Entire Building",
        assignedTo: 3,
        status: "clocked_in",
        assignmentType: "assigned",
        requiredStaff: 1,
        claimedBy: null,
        templateId: null,
        notes: "Overlaps with another shift",
        createdBy: 1,
      },
    ];

    sampleShifts.forEach(shift => {
      this.shifts.set(shift.id, shift);
      this.currentShiftId = Math.max(this.currentShiftId, shift.id + 1);
    });

    // Sample opportunities
    const sampleOpportunities: Opportunity[] = [
      {
        id: 1,
        tenantId: "acme-corp",
        shiftId: 2,
        description: "Evening Security Shift - December 16",
        requirements: "Must have security training certificate",
        isActive: true,
      },
      {
        id: 2,
        tenantId: "acme-corp",
        shiftId: 1,
        description: "Weekend Customer Service Coverage",
        requirements: "Customer service experience preferred",
        isActive: true,
      },
    ];

    sampleOpportunities.forEach(opportunity => {
      this.opportunities.set(opportunity.id, opportunity);
      this.currentOpportunityId = Math.max(this.currentOpportunityId, opportunity.id + 1);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role as "owner" | "staff",
      isActive: insertUser.isActive ?? true
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, insertUser: InsertUser): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser: User = { 
      ...insertUser, 
      id,
      role: insertUser.role as "owner" | "staff",
      isActive: insertUser.isActive ?? true
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getStaffByTenant(tenantId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      user => user.tenantId === tenantId && user.role === "staff"
    );
  }

  // Shift operations
  async getShift(id: number): Promise<Shift | undefined> {
    return this.shifts.get(id);
  }

  async getShiftsByTenant(tenantId: string): Promise<Shift[]> {
    return Array.from(this.shifts.values()).filter(shift => shift.tenantId === tenantId);
  }

  async getShiftsByUser(tenantId: string, userId: number): Promise<Shift[]> {
    return Array.from(this.shifts.values()).filter(
      shift => shift.tenantId === tenantId && shift.assignedTo === userId
    );
  }

  async createShift(insertShift: InsertShift): Promise<Shift> {
    const id = this.currentShiftId++;
    const shift: Shift = { 
      ...insertShift, 
      id,
      status: insertShift.status as "open" | "assigned" | "confirmed" | "conflict",
      assignedTo: insertShift.assignedTo ?? null,
      notes: insertShift.notes ?? null,
      description: insertShift.description || "",
      location: insertShift.location || ""
    };
    this.shifts.set(id, shift);
    return shift;
  }

  async updateShift(id: number, insertShift: InsertShift): Promise<Shift | undefined> {
    const existingShift = this.shifts.get(id);
    if (!existingShift) return undefined;
    
    const updatedShift: Shift = { 
      ...insertShift, 
      id,
      status: insertShift.status as "open" | "assigned" | "confirmed" | "conflict",
      assignedTo: insertShift.assignedTo ?? null,
      notes: insertShift.notes ?? null,
      description: insertShift.description || "",
      location: insertShift.location || ""
    };
    this.shifts.set(id, updatedShift);
    return updatedShift;
  }

  async deleteShift(id: number): Promise<boolean> {
    return this.shifts.delete(id);
  }

  // Opportunity operations
  async getOpportunity(id: number): Promise<Opportunity | undefined> {
    return this.opportunities.get(id);
  }

  async getOpportunitiesByTenant(tenantId: string): Promise<Opportunity[]> {
    return Array.from(this.opportunities.values()).filter(
      opportunity => opportunity.tenantId === tenantId
    );
  }

  async createOpportunity(insertOpportunity: InsertOpportunity): Promise<Opportunity> {
    const id = this.currentOpportunityId++;
    const opportunity: Opportunity = { 
      ...insertOpportunity, 
      id,
      isActive: insertOpportunity.isActive ?? true,
      requirements: insertOpportunity.requirements ?? null
    };
    this.opportunities.set(id, opportunity);
    return opportunity;
  }

  async updateOpportunity(id: number, insertOpportunity: InsertOpportunity): Promise<Opportunity | undefined> {
    const existingOpportunity = this.opportunities.get(id);
    if (!existingOpportunity) return undefined;
    
    const updatedOpportunity: Opportunity = { 
      ...insertOpportunity, 
      id,
      isActive: insertOpportunity.isActive ?? true,
      requirements: insertOpportunity.requirements ?? null
    };
    this.opportunities.set(id, updatedOpportunity);
    return updatedOpportunity;
  }

  async deleteOpportunity(id: number): Promise<boolean> {
    return this.opportunities.delete(id);
  }

  // Swap request operations
  async getSwapRequest(id: number): Promise<SwapRequest | undefined> {
    return this.swapRequests.get(id);
  }

  async getSwapRequestsByTenant(tenantId: string): Promise<SwapRequest[]> {
    return Array.from(this.swapRequests.values()).filter(
      swapRequest => swapRequest.tenantId === tenantId
    );
  }

  async createSwapRequest(insertSwapRequest: InsertSwapRequest): Promise<SwapRequest> {
    const id = this.currentSwapRequestId++;
    const swapRequest: SwapRequest = { 
      ...insertSwapRequest, 
      id,
      status: insertSwapRequest.status as "pending" | "approved" | "rejected",
      targetShiftId: insertSwapRequest.targetShiftId ?? null,
      reason: insertSwapRequest.reason ?? null
    };
    this.swapRequests.set(id, swapRequest);
    return swapRequest;
  }

  async updateSwapRequest(id: number, insertSwapRequest: InsertSwapRequest): Promise<SwapRequest | undefined> {
    const existingSwapRequest = this.swapRequests.get(id);
    if (!existingSwapRequest) return undefined;
    
    const updatedSwapRequest: SwapRequest = { 
      ...insertSwapRequest, 
      id,
      status: insertSwapRequest.status as "pending" | "approved" | "rejected",
      targetShiftId: insertSwapRequest.targetShiftId ?? null,
      reason: insertSwapRequest.reason ?? null
    };
    this.swapRequests.set(id, updatedSwapRequest);
    return updatedSwapRequest;
  }

  async deleteSwapRequest(id: number): Promise<boolean> {
    return this.swapRequests.delete(id);
  }

  // Assignment operations
  async getAssignment(id: number): Promise<Assignment | undefined> {
    return this.assignments.get(id);
  }

  async getAssignmentsByTenant(tenantId: string): Promise<Assignment[]> {
    return Array.from(this.assignments.values()).filter(
      assignment => assignment.tenantId === tenantId
    );
  }

  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const id = this.currentAssignmentId++;
    const assignment: Assignment = { 
      id,
      tenantId: insertAssignment.tenantId,
      shiftId: insertAssignment.shiftId,
      assignedTo: insertAssignment.assignedTo,
      assignedBy: insertAssignment.assignedBy,
      status: insertAssignment.status || "pending",
      notes: insertAssignment.notes || null,
      assignedAt: new Date(),
    };
    this.assignments.set(id, assignment);
    return assignment;
  }

  async updateAssignment(id: number, insertAssignment: InsertAssignment): Promise<Assignment | undefined> {
    const existingAssignment = this.assignments.get(id);
    if (!existingAssignment) return undefined;
    
    const updatedAssignment: Assignment = { 
      ...existingAssignment,
      ...insertAssignment,
    };
    this.assignments.set(id, updatedAssignment);
    return updatedAssignment;
  }

  async deleteAssignment(id: number): Promise<boolean> {
    return this.assignments.delete(id);
  }

  // Holiday request operations
  async getHolidayRequest(id: number): Promise<HolidayRequest | undefined> {
    return this.holidayRequests.get(id);
  }

  async getHolidayRequestsByTenant(tenantId: string): Promise<HolidayRequest[]> {
    return Array.from(this.holidayRequests.values()).filter(
      request => request.tenantId === tenantId
    );
  }

  async createHolidayRequest(insertHolidayRequest: InsertHolidayRequest): Promise<HolidayRequest> {
    const id = this.currentHolidayRequestId++;
    const holidayRequest: HolidayRequest = { 
      id,
      tenantId: insertHolidayRequest.tenantId,
      requesterId: insertHolidayRequest.requesterId,
      startDate: insertHolidayRequest.startDate,
      endDate: insertHolidayRequest.endDate,
      reason: insertHolidayRequest.reason || null,
      status: insertHolidayRequest.status || "pending",
      reviewedBy: insertHolidayRequest.reviewedBy || null,
      reviewedAt: insertHolidayRequest.reviewedAt || null,
      reviewNotes: insertHolidayRequest.reviewNotes || null,
      createdAt: new Date(),
    };
    this.holidayRequests.set(id, holidayRequest);
    return holidayRequest;
  }

  async updateHolidayRequest(id: number, insertHolidayRequest: InsertHolidayRequest): Promise<HolidayRequest | undefined> {
    const existingRequest = this.holidayRequests.get(id);
    if (!existingRequest) return undefined;
    
    const updatedRequest: HolidayRequest = { 
      ...existingRequest,
      ...insertHolidayRequest,
    };
    this.holidayRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async deleteHolidayRequest(id: number): Promise<boolean> {
    return this.holidayRequests.delete(id);
  }

  // Schedule template operations
  async getScheduleTemplate(id: number): Promise<ScheduleTemplate | undefined> {
    return this.scheduleTemplates.get(id);
  }

  async getScheduleTemplatesByTenant(tenantId: string): Promise<ScheduleTemplate[]> {
    return Array.from(this.scheduleTemplates.values()).filter(
      template => template.tenantId === tenantId
    );
  }

  async createScheduleTemplate(insertTemplate: InsertScheduleTemplate): Promise<ScheduleTemplate> {
    const id = this.currentScheduleTemplateId++;
    const template: ScheduleTemplate = { 
      id, 
      ...insertTemplate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.scheduleTemplates.set(id, template);
    return template;
  }

  async updateScheduleTemplate(id: number, insertTemplate: InsertScheduleTemplate): Promise<ScheduleTemplate | undefined> {
    const existingTemplate = this.scheduleTemplates.get(id);
    if (!existingTemplate) return undefined;
    
    const updatedTemplate: ScheduleTemplate = { 
      ...existingTemplate,
      ...insertTemplate,
      updatedAt: new Date(),
    };
    this.scheduleTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteScheduleTemplate(id: number): Promise<boolean> {
    return this.scheduleTemplates.delete(id);
  }

  // Time entry operations for clock-in/out
  async getActiveTimeEntry(tenantId: string, userId: number): Promise<any | undefined> {
    const entries = Array.from(this.timeEntries.values());
    return entries.find(entry => 
      entry.tenantId === tenantId && 
      entry.userId === userId && 
      entry.status !== "clocked-out"
    );
  }

  async getTimeEntriesByTenant(tenantId: string): Promise<any[]> {
    const entries = Array.from(this.timeEntries.values());
    return entries.filter(entry => entry.tenantId === tenantId);
  }

  async createTimeEntry(insertEntry: any): Promise<any> {
    const entry = { 
      id: this.currentTimeEntryId++, 
      ...insertEntry,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.timeEntries.set(entry.id, entry);
    return entry;
  }

  async updateTimeEntry(id: number, insertEntry: any): Promise<any | undefined> {
    const existingEntry = this.timeEntries.get(id);
    if (!existingEntry) return undefined;
    
    const updatedEntry = { 
      ...existingEntry,
      ...insertEntry,
      updatedAt: new Date(),
    };
    this.timeEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  async getTimeEntriesByUser(tenantId: string, userId: number): Promise<any[]> {
    const entries = Array.from(this.timeEntries.values());
    return entries.filter(entry => 
      entry.tenantId === tenantId && 
      entry.userId === userId
    );
  }
}

export const storage = new MemStorage();
