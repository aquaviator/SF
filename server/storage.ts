import { users, shifts, opportunities, swapRequests, assignments, holidayRequests, scheduleTemplates, businessProfiles, jobRoles, locations, departments, operatingHours, type User, type InsertUser, type Shift, type InsertShift, type Opportunity, type InsertOpportunity, type SwapRequest, type InsertSwapRequest, type Assignment, type InsertAssignment, type HolidayRequest, type InsertHolidayRequest, type ScheduleTemplate, type InsertScheduleTemplate, type BusinessProfile, type InsertBusinessProfile, type JobRole, type InsertJobRole, type Location, type InsertLocation, type Department, type InsertDepartment, type OperatingHours, type InsertOperatingHours } from "@shared/schema";
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';

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

  // Business profile operations
  getBusinessProfile(tenantId: string): Promise<BusinessProfile | undefined>;
  createBusinessProfile(profile: InsertBusinessProfile): Promise<BusinessProfile>;
  updateBusinessProfile(tenantId: string, profile: InsertBusinessProfile): Promise<BusinessProfile | undefined>;
  deleteBusinessProfile(tenantId: string): Promise<boolean>;

  // Job role operations
  getJobRole(id: number): Promise<JobRole | undefined>;
  getJobRolesByTenant(tenantId: string): Promise<JobRole[]>;
  createJobRole(role: InsertJobRole): Promise<JobRole>;
  updateJobRole(id: number, role: InsertJobRole): Promise<JobRole | undefined>;
  deleteJobRole(id: number): Promise<boolean>;

  // Location operations
  getLocation(id: number): Promise<Location | undefined>;
  getLocationsByTenant(tenantId: string): Promise<Location[]>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: number, location: InsertLocation): Promise<Location | undefined>;
  deleteLocation(id: number): Promise<boolean>;

  // Department operations
  getDepartment(id: number): Promise<Department | undefined>;
  getDepartmentsByTenant(tenantId: string): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: InsertDepartment): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<boolean>;

  // Operating hours operations
  getOperatingHours(id: number): Promise<OperatingHours | undefined>;
  getOperatingHoursByTenant(tenantId: string): Promise<OperatingHours[]>;
  createOperatingHours(hours: InsertOperatingHours): Promise<OperatingHours>;
  updateOperatingHours(id: number, hours: InsertOperatingHours): Promise<OperatingHours | undefined>;
  deleteOperatingHours(id: number): Promise<boolean>;
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
  private businessProfiles: Map<string, BusinessProfile>; // keyed by tenantId
  private jobRoles: Map<number, JobRole>;
  private locations: Map<number, Location>;
  private departments: Map<number, Department>;
  private operatingHours: Map<number, OperatingHours>;
  private currentUserId: number;
  private currentShiftId: number;
  private currentOpportunityId: number;
  private currentSwapRequestId: number;
  private currentAssignmentId: number;
  private currentHolidayRequestId: number;
  private currentScheduleTemplateId: number;
  private currentTimeEntryId: number;
  private currentJobRoleId: number;
  private currentLocationId: number;
  private currentDepartmentId: number;
  private currentOperatingHoursId: number;

  constructor() {
    this.users = new Map();
    this.shifts = new Map();
    this.opportunities = new Map();
    this.swapRequests = new Map();
    this.assignments = new Map();
    this.holidayRequests = new Map();
    this.scheduleTemplates = new Map();
    this.timeEntries = new Map();
    this.businessProfiles = new Map();
    this.jobRoles = new Map();
    this.locations = new Map();
    this.departments = new Map();
    this.operatingHours = new Map();
    this.currentUserId = 1;
    this.currentShiftId = 1;
    this.currentOpportunityId = 1;
    this.currentSwapRequestId = 1;
    this.currentAssignmentId = 1;
    this.currentHolidayRequestId = 1;
    this.currentScheduleTemplateId = 1;
    this.currentTimeEntryId = 1;
    this.currentJobRoleId = 1;
    this.currentLocationId = 1;
    this.currentDepartmentId = 1;
    this.currentOperatingHoursId = 1;

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

    // Sample business profile
    const sampleBusinessProfile: BusinessProfile = {
      id: 1,
      tenantId: "acme-corp",
      name: "ACME Corporation",
      ownerName: "John Doe",
      address: "123 Business Street, City, State 12345",
      phone: "+1 (555) 123-4567",
      email: "info@acmecorp.com",
      website: "https://www.acmecorp.com",
      logoUrl: null,
      ownerProfilePicture: null,
      description: "Leading provider of workplace solutions",
      businessType: "Technology Services",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.businessProfiles.set("acme-corp", sampleBusinessProfile);

    // Sample job roles
    const sampleJobRoles: JobRole[] = [
      {
        id: 1,
        tenantId: "acme-corp",
        title: "Manager",
        description: "Team lead responsible for operations",
        hourlyRate: "$25.00",
        responsibilities: ["Team leadership", "Scheduling", "Performance reviews"],
        requirements: ["Management experience", "Communication skills"],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        tenantId: "acme-corp",
        title: "Customer Service Representative",
        description: "Handle customer inquiries and support",
        hourlyRate: "$18.00",
        responsibilities: ["Answer phones", "Process orders", "Resolve complaints"],
        requirements: ["High school diploma", "Customer service experience"],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        tenantId: "acme-corp",
        title: "Security Guard",
        description: "Maintain safety and security of premises",
        hourlyRate: "$22.00",
        responsibilities: ["Monitor premises", "Check credentials", "Report incidents"],
        requirements: ["Security license", "Physical fitness"],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleJobRoles.forEach(role => {
      this.jobRoles.set(role.id, role);
      this.currentJobRoleId = Math.max(this.currentJobRoleId, role.id + 1);
    });

    // Sample locations
    const sampleLocations: Location[] = [
      {
        id: 1,
        tenantId: "acme-corp",
        name: "Main Office",
        description: "Primary business location",
        address: "123 Business Street, City, State 12345",
        capacity: 100,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        tenantId: "acme-corp",
        name: "Warehouse",
        description: "Storage and distribution center",
        address: "456 Industrial Ave, City, State 12345",
        capacity: 50,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        tenantId: "acme-corp",
        name: "Customer Service Center",
        description: "Call center operations",
        address: "789 Service Blvd, City, State 12345",
        capacity: 75,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleLocations.forEach(location => {
      this.locations.set(location.id, location);
      this.currentLocationId = Math.max(this.currentLocationId, location.id + 1);
    });

    // Sample departments
    const sampleDepartments: Department[] = [
      {
        id: 1,
        tenantId: "acme-corp",
        name: "Operations",
        description: "Daily business operations and management",
        managerId: 1,
        budget: "$500,000",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        tenantId: "acme-corp",
        name: "Customer Service",
        description: "Customer support and relations",
        managerId: null,
        budget: "$250,000",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        tenantId: "acme-corp",
        name: "Security",
        description: "Building and personnel security",
        managerId: null,
        budget: "$180,000",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleDepartments.forEach(department => {
      this.departments.set(department.id, department);
      this.currentDepartmentId = Math.max(this.currentDepartmentId, department.id + 1);
    });

    // Sample operating hours
    const sampleOperatingHours: OperatingHours[] = [
      {
        id: 1,
        tenantId: "acme-corp",
        dayOfWeek: "monday",
        openTime: "08:00",
        closeTime: "18:00",
        isOpen: true,
        breakStartTime: "12:00",
        breakEndTime: "13:00",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        tenantId: "acme-corp",
        dayOfWeek: "tuesday",
        openTime: "08:00",
        closeTime: "18:00",
        isOpen: true,
        breakStartTime: "12:00",
        breakEndTime: "13:00",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        tenantId: "acme-corp",
        dayOfWeek: "wednesday",
        openTime: "08:00",
        closeTime: "18:00",
        isOpen: true,
        breakStartTime: "12:00",
        breakEndTime: "13:00",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        tenantId: "acme-corp",
        dayOfWeek: "thursday",
        openTime: "08:00",
        closeTime: "18:00",
        isOpen: true,
        breakStartTime: "12:00",
        breakEndTime: "13:00",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 5,
        tenantId: "acme-corp",
        dayOfWeek: "friday",
        openTime: "08:00",
        closeTime: "18:00",
        isOpen: true,
        breakStartTime: "12:00",
        breakEndTime: "13:00",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 6,
        tenantId: "acme-corp",
        dayOfWeek: "saturday",
        openTime: "09:00",
        closeTime: "15:00",
        isOpen: true,
        breakStartTime: null,
        breakEndTime: null,
        notes: "Weekend hours",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 7,
        tenantId: "acme-corp",
        dayOfWeek: "sunday",
        openTime: null,
        closeTime: null,
        isOpen: false,
        breakStartTime: null,
        breakEndTime: null,
        notes: "Closed",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleOperatingHours.forEach(hours => {
      this.operatingHours.set(hours.id, hours);
      this.currentOperatingHoursId = Math.max(this.currentOperatingHoursId, hours.id + 1);
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

  // Business profile operations
  async getBusinessProfile(tenantId: string): Promise<BusinessProfile | undefined> {
    return this.businessProfiles.get(tenantId);
  }

  async createBusinessProfile(insertProfile: InsertBusinessProfile): Promise<BusinessProfile> {
    const profile: BusinessProfile = {
      id: 1, // Business profiles are unique per tenant
      ...insertProfile,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.businessProfiles.set(insertProfile.tenantId, profile);
    return profile;
  }

  async updateBusinessProfile(tenantId: string, insertProfile: InsertBusinessProfile): Promise<BusinessProfile | undefined> {
    const existingProfile = this.businessProfiles.get(tenantId);
    if (!existingProfile) return undefined;

    const updatedProfile: BusinessProfile = {
      ...existingProfile,
      ...insertProfile,
      updatedAt: new Date(),
    };
    this.businessProfiles.set(tenantId, updatedProfile);
    return updatedProfile;
  }

  async deleteBusinessProfile(tenantId: string): Promise<boolean> {
    return this.businessProfiles.delete(tenantId);
  }

  // Job role operations
  async getJobRole(id: number): Promise<JobRole | undefined> {
    return this.jobRoles.get(id);
  }

  async getJobRolesByTenant(tenantId: string): Promise<JobRole[]> {
    return Array.from(this.jobRoles.values()).filter(role => role.tenantId === tenantId);
  }

  async createJobRole(insertRole: InsertJobRole): Promise<JobRole> {
    const id = this.currentJobRoleId++;
    const role: JobRole = {
      id,
      ...insertRole,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobRoles.set(id, role);
    return role;
  }

  async updateJobRole(id: number, insertRole: InsertJobRole): Promise<JobRole | undefined> {
    const existingRole = this.jobRoles.get(id);
    if (!existingRole) return undefined;

    const updatedRole: JobRole = {
      ...existingRole,
      ...insertRole,
      updatedAt: new Date(),
    };
    this.jobRoles.set(id, updatedRole);
    return updatedRole;
  }

  async deleteJobRole(id: number): Promise<boolean> {
    return this.jobRoles.delete(id);
  }

  // Location operations
  async getLocation(id: number): Promise<Location | undefined> {
    return this.locations.get(id);
  }

  async getLocationsByTenant(tenantId: string): Promise<Location[]> {
    return Array.from(this.locations.values()).filter(location => location.tenantId === tenantId);
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const id = this.currentLocationId++;
    const location: Location = {
      id,
      ...insertLocation,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.locations.set(id, location);
    return location;
  }

  async updateLocation(id: number, insertLocation: InsertLocation): Promise<Location | undefined> {
    const existingLocation = this.locations.get(id);
    if (!existingLocation) return undefined;

    const updatedLocation: Location = {
      ...existingLocation,
      ...insertLocation,
      updatedAt: new Date(),
    };
    this.locations.set(id, updatedLocation);
    return updatedLocation;
  }

  async deleteLocation(id: number): Promise<boolean> {
    return this.locations.delete(id);
  }

  // Department operations
  async getDepartment(id: number): Promise<Department | undefined> {
    return this.departments.get(id);
  }

  async getDepartmentsByTenant(tenantId: string): Promise<Department[]> {
    return Array.from(this.departments.values()).filter(department => department.tenantId === tenantId);
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const id = this.currentDepartmentId++;
    const department: Department = {
      id,
      ...insertDepartment,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.departments.set(id, department);
    return department;
  }

  async updateDepartment(id: number, insertDepartment: InsertDepartment): Promise<Department | undefined> {
    const existingDepartment = this.departments.get(id);
    if (!existingDepartment) return undefined;

    const updatedDepartment: Department = {
      ...existingDepartment,
      ...insertDepartment,
      updatedAt: new Date(),
    };
    this.departments.set(id, updatedDepartment);
    return updatedDepartment;
  }

  async deleteDepartment(id: number): Promise<boolean> {
    return this.departments.delete(id);
  }

  // Operating hours operations
  async getOperatingHours(id: number): Promise<OperatingHours | undefined> {
    return this.operatingHours.get(id);
  }

  async getOperatingHoursByTenant(tenantId: string): Promise<OperatingHours[]> {
    return Array.from(this.operatingHours.values()).filter(hours => hours.tenantId === tenantId);
  }

  async createOperatingHours(insertHours: InsertOperatingHours): Promise<OperatingHours> {
    const id = this.currentOperatingHoursId++;
    const hours: OperatingHours = {
      id,
      ...insertHours,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.operatingHours.set(id, hours);
    return hours;
  }

  async updateOperatingHours(id: number, insertHours: InsertOperatingHours): Promise<OperatingHours | undefined> {
    const existingHours = this.operatingHours.get(id);
    if (!existingHours) return undefined;

    const updatedHours: OperatingHours = {
      ...existingHours,
      ...insertHours,
      updatedAt: new Date(),
    };
    this.operatingHours.set(id, updatedHours);
    return updatedHours;
  }

  async deleteOperatingHours(id: number): Promise<boolean> {
    return this.operatingHours.delete(id);
  }
}

// Initialize database connection
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: number, insertUser: InsertUser): Promise<User | undefined> {
    const result = await db.update(users).set(insertUser).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  async getStaffByTenant(tenantId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.tenantId, tenantId));
  }

  // Business profile operations
  async getBusinessProfile(tenantId: string): Promise<BusinessProfile | undefined> {
    const result = await db.select().from(businessProfiles).where(eq(businessProfiles.tenantId, tenantId)).limit(1);
    return result[0];
  }

  async createBusinessProfile(insertProfile: InsertBusinessProfile): Promise<BusinessProfile> {
    const result = await db.insert(businessProfiles).values(insertProfile).returning();
    return result[0];
  }

  async updateBusinessProfile(tenantId: string, insertProfile: InsertBusinessProfile): Promise<BusinessProfile | undefined> {
    const result = await db.update(businessProfiles).set(insertProfile).where(eq(businessProfiles.tenantId, tenantId)).returning();
    return result[0];
  }

  async deleteBusinessProfile(tenantId: string): Promise<boolean> {
    const result = await db.delete(businessProfiles).where(eq(businessProfiles.tenantId, tenantId));
    return result.rowCount > 0;
  }

  // Job role operations
  async getJobRole(id: number): Promise<JobRole | undefined> {
    const result = await db.select().from(jobRoles).where(eq(jobRoles.id, id)).limit(1);
    return result[0];
  }

  async getJobRolesByTenant(tenantId: string): Promise<JobRole[]> {
    return await db.select().from(jobRoles).where(eq(jobRoles.tenantId, tenantId));
  }

  async createJobRole(insertRole: InsertJobRole): Promise<JobRole> {
    const result = await db.insert(jobRoles).values(insertRole).returning();
    return result[0];
  }

  async updateJobRole(id: number, insertRole: InsertJobRole): Promise<JobRole | undefined> {
    const result = await db.update(jobRoles).set(insertRole).where(eq(jobRoles.id, id)).returning();
    return result[0];
  }

  async deleteJobRole(id: number): Promise<boolean> {
    const result = await db.delete(jobRoles).where(eq(jobRoles.id, id));
    return result.rowCount > 0;
  }

  // Location operations
  async getLocation(id: number): Promise<Location | undefined> {
    const result = await db.select().from(locations).where(eq(locations.id, id)).limit(1);
    return result[0];
  }

  async getLocationsByTenant(tenantId: string): Promise<Location[]> {
    return await db.select().from(locations).where(eq(locations.tenantId, tenantId));
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const result = await db.insert(locations).values(insertLocation).returning();
    return result[0];
  }

  async updateLocation(id: number, insertLocation: InsertLocation): Promise<Location | undefined> {
    const result = await db.update(locations).set(insertLocation).where(eq(locations.id, id)).returning();
    return result[0];
  }

  async deleteLocation(id: number): Promise<boolean> {
    const result = await db.delete(locations).where(eq(locations.id, id));
    return result.rowCount > 0;
  }

  // Department operations
  async getDepartment(id: number): Promise<Department | undefined> {
    const result = await db.select().from(departments).where(eq(departments.id, id)).limit(1);
    return result[0];
  }

  async getDepartmentsByTenant(tenantId: string): Promise<Department[]> {
    return await db.select().from(departments).where(eq(departments.tenantId, tenantId));
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const result = await db.insert(departments).values(insertDepartment).returning();
    return result[0];
  }

  async updateDepartment(id: number, insertDepartment: InsertDepartment): Promise<Department | undefined> {
    const result = await db.update(departments).set(insertDepartment).where(eq(departments.id, id)).returning();
    return result[0];
  }

  async deleteDepartment(id: number): Promise<boolean> {
    const result = await db.delete(departments).where(eq(departments.id, id));
    return result.rowCount > 0;
  }

  // Operating hours operations
  async getOperatingHours(id: number): Promise<OperatingHours | undefined> {
    const result = await db.select().from(operatingHours).where(eq(operatingHours.id, id)).limit(1);
    return result[0];
  }

  async getOperatingHoursByTenant(tenantId: string): Promise<OperatingHours[]> {
    return await db.select().from(operatingHours).where(eq(operatingHours.tenantId, tenantId));
  }

  async createOperatingHours(insertHours: InsertOperatingHours): Promise<OperatingHours> {
    const result = await db.insert(operatingHours).values(insertHours).returning();
    return result[0];
  }

  async updateOperatingHours(id: number, insertHours: InsertOperatingHours): Promise<OperatingHours | undefined> {
    const result = await db.update(operatingHours).set(insertHours).where(eq(operatingHours.id, id)).returning();
    return result[0];
  }

  async deleteOperatingHours(id: number): Promise<boolean> {
    const result = await db.delete(operatingHours).where(eq(operatingHours.id, id));
    return result.rowCount > 0;
  }

  // Shift operations
  async getShift(id: number): Promise<Shift | undefined> {
    const result = await db.select().from(shifts).where(eq(shifts.id, id)).limit(1);
    return result[0];
  }

  async getShiftsByTenant(tenantId: string): Promise<Shift[]> {
    return await db.select().from(shifts).where(eq(shifts.tenantId, tenantId));
  }

  async getShiftsByUser(tenantId: string, userId: number): Promise<Shift[]> {
    return await db.select().from(shifts).where(eq(shifts.tenantId, tenantId));
  }

  async createShift(insertShift: InsertShift): Promise<Shift> {
    const result = await db.insert(shifts).values(insertShift).returning();
    return result[0];
  }

  async updateShift(id: number, insertShift: InsertShift): Promise<Shift | undefined> {
    const result = await db.update(shifts).set(insertShift).where(eq(shifts.id, id)).returning();
    return result[0];
  }

  async deleteShift(id: number): Promise<boolean> {
    const result = await db.delete(shifts).where(eq(shifts.id, id));
    return result.rowCount > 0;
  }

  // Opportunity operations
  async getOpportunity(id: number): Promise<Opportunity | undefined> {
    const result = await db.select().from(opportunities).where(eq(opportunities.id, id)).limit(1);
    return result[0];
  }

  async getOpportunitiesByTenant(tenantId: string): Promise<Opportunity[]> {
    return await db.select().from(opportunities).where(eq(opportunities.tenantId, tenantId));
  }

  async createOpportunity(insertOpportunity: InsertOpportunity): Promise<Opportunity> {
    const result = await db.insert(opportunities).values(insertOpportunity).returning();
    return result[0];
  }

  async updateOpportunity(id: number, insertOpportunity: InsertOpportunity): Promise<Opportunity | undefined> {
    const result = await db.update(opportunities).set(insertOpportunity).where(eq(opportunities.id, id)).returning();
    return result[0];
  }

  async deleteOpportunity(id: number): Promise<boolean> {
    const result = await db.delete(opportunities).where(eq(opportunities.id, id));
    return result.rowCount > 0;
  }

  // Swap request operations
  async getSwapRequest(id: number): Promise<SwapRequest | undefined> {
    const result = await db.select().from(swapRequests).where(eq(swapRequests.id, id)).limit(1);
    return result[0];
  }

  async getSwapRequestsByTenant(tenantId: string): Promise<SwapRequest[]> {
    return await db.select().from(swapRequests).where(eq(swapRequests.tenantId, tenantId));
  }

  async createSwapRequest(insertSwapRequest: InsertSwapRequest): Promise<SwapRequest> {
    const result = await db.insert(swapRequests).values(insertSwapRequest).returning();
    return result[0];
  }

  async updateSwapRequest(id: number, insertSwapRequest: InsertSwapRequest): Promise<SwapRequest | undefined> {
    const result = await db.update(swapRequests).set(insertSwapRequest).where(eq(swapRequests.id, id)).returning();
    return result[0];
  }

  async deleteSwapRequest(id: number): Promise<boolean> {
    const result = await db.delete(swapRequests).where(eq(swapRequests.id, id));
    return result.rowCount > 0;
  }

  // Assignment operations
  async getAssignment(id: number): Promise<Assignment | undefined> {
    const result = await db.select().from(assignments).where(eq(assignments.id, id)).limit(1);
    return result[0];
  }

  async getAssignmentsByTenant(tenantId: string): Promise<Assignment[]> {
    return await db.select().from(assignments).where(eq(assignments.tenantId, tenantId));
  }

  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const result = await db.insert(assignments).values(insertAssignment).returning();
    return result[0];
  }

  async updateAssignment(id: number, insertAssignment: InsertAssignment): Promise<Assignment | undefined> {
    const result = await db.update(assignments).set(insertAssignment).where(eq(assignments.id, id)).returning();
    return result[0];
  }

  async deleteAssignment(id: number): Promise<boolean> {
    const result = await db.delete(assignments).where(eq(assignments.id, id));
    return result.rowCount > 0;
  }

  // Holiday request operations
  async getHolidayRequest(id: number): Promise<HolidayRequest | undefined> {
    const result = await db.select().from(holidayRequests).where(eq(holidayRequests.id, id)).limit(1);
    return result[0];
  }

  async getHolidayRequestsByTenant(tenantId: string): Promise<HolidayRequest[]> {
    return await db.select().from(holidayRequests).where(eq(holidayRequests.tenantId, tenantId));
  }

  async createHolidayRequest(insertHolidayRequest: InsertHolidayRequest): Promise<HolidayRequest> {
    const result = await db.insert(holidayRequests).values(insertHolidayRequest).returning();
    return result[0];
  }

  async updateHolidayRequest(id: number, insertHolidayRequest: InsertHolidayRequest): Promise<HolidayRequest | undefined> {
    const result = await db.update(holidayRequests).set(insertHolidayRequest).where(eq(holidayRequests.id, id)).returning();
    return result[0];
  }

  async deleteHolidayRequest(id: number): Promise<boolean> {
    const result = await db.delete(holidayRequests).where(eq(holidayRequests.id, id));
    return result.rowCount > 0;
  }

  // Schedule template operations
  async getScheduleTemplate(id: number): Promise<ScheduleTemplate | undefined> {
    const result = await db.select().from(scheduleTemplates).where(eq(scheduleTemplates.id, id)).limit(1);
    return result[0];
  }

  async getScheduleTemplatesByTenant(tenantId: string): Promise<ScheduleTemplate[]> {
    return await db.select().from(scheduleTemplates).where(eq(scheduleTemplates.tenantId, tenantId));
  }

  async createScheduleTemplate(insertTemplate: InsertScheduleTemplate): Promise<ScheduleTemplate> {
    const result = await db.insert(scheduleTemplates).values(insertTemplate).returning();
    return result[0];
  }

  async updateScheduleTemplate(id: number, insertTemplate: InsertScheduleTemplate): Promise<ScheduleTemplate | undefined> {
    const result = await db.update(scheduleTemplates).set(insertTemplate).where(eq(scheduleTemplates.id, id)).returning();
    return result[0];
  }

  async deleteScheduleTemplate(id: number): Promise<boolean> {
    const result = await db.delete(scheduleTemplates).where(eq(scheduleTemplates.id, id));
    return result.rowCount > 0;
  }

  // Time entry operations (simplified for now - would need proper time entry schema)
  async getActiveTimeEntry(tenantId: string, userId: number): Promise<any | undefined> {
    // TODO: Implement proper time entry schema
    return undefined;
  }

  async getTimeEntriesByTenant(tenantId: string): Promise<any[]> {
    // TODO: Implement proper time entry schema
    return [];
  }

  async createTimeEntry(insertEntry: any): Promise<any> {
    // TODO: Implement proper time entry schema
    return insertEntry;
  }

  async updateTimeEntry(id: number, insertEntry: any): Promise<any | undefined> {
    // TODO: Implement proper time entry schema
    return insertEntry;
  }

  async getTimeEntriesByUser(tenantId: string, userId: number): Promise<any[]> {
    // TODO: Implement proper time entry schema
    return [];
  }
}

// Initialize database storage with sample data
async function initializeDatabaseWithSampleData() {
  const dbStorage = new DatabaseStorage();
  
  // Check if business profile already exists for acme-corp
  const existingProfile = await dbStorage.getBusinessProfile("acme-corp");
  if (existingProfile) {
    console.log("Database already initialized with sample data");
    return dbStorage;
  }

  console.log("Initializing database with sample data...");

  // Create sample users only if they don't exist
  try {
    await dbStorage.createUser({
      username: "john.doe@company.com",
      password: "password123", // TODO: Hash passwords in production
      email: "john.doe@company.com",
      firstName: "John",
      lastName: "Doe",
      role: "owner",
      tenantId: "tenant1"
    });
  } catch (error) {
    // User already exists, ignore
  }

  try {
    await dbStorage.createUser({
      username: "jane.smith@company.com", 
      password: "password123", // TODO: Hash passwords in production
      email: "jane.smith@company.com",
      firstName: "Jane",
      lastName: "Smith",
      role: "staff",
      tenantId: "tenant1"
    });
  } catch (error) {
    // User already exists, ignore
  }

  // Create business profiles only if they don't exist
  try {
    await dbStorage.createBusinessProfile({
      tenantId: "tenant1",
      name: "Acme Corporation",
      address: "123 Business St, City, State 12345",
      phone: "+1 (555) 123-4567",
      email: "info@acmecorp.com",
      website: "https://acmecorp.com"
    });
  } catch (error) {
    // Business profile already exists, ignore
  }

  try {
    await dbStorage.createBusinessProfile({
      tenantId: "acme-corp",
      name: "Acme Corporation",
      address: "123 Business St, City, State 12345", 
      phone: "+1 (555) 123-4567",
      email: "info@acmecorp.com",
      website: "https://acmecorp.com"
    });
  } catch (error) {
    // Business profile already exists, ignore
  }

  // Create job roles
  const jobRoleData = [
    { title: "Manager", description: "Store manager with full responsibilities", hourlyRate: "$25.00", tenantId: "tenant1" },
    { title: "Shift Supervisor", description: "Supervises shift operations", hourlyRate: "$18.50", tenantId: "tenant1" },
    { title: "Cashier", description: "Customer service and register operations", hourlyRate: "$15.00", tenantId: "tenant1" },
    { title: "Stock Associate", description: "Inventory and stocking duties", hourlyRate: "$14.50", tenantId: "tenant1" }
  ];

  for (const role of jobRoleData) {
    await dbStorage.createJobRole(role);
  }

  // Create locations
  const locationData = [
    { name: "Main Store", address: "123 Main St, City, State", tenantId: "tenant1" },
    { name: "Warehouse", address: "456 Industrial Blvd, City, State", tenantId: "tenant1" },
    { name: "Customer Service", address: "789 Service Ave, City, State", tenantId: "tenant1" }
  ];

  for (const location of locationData) {
    await dbStorage.createLocation(location);
  }

  // Create departments
  const departmentData = [
    { name: "Sales", description: "Customer-facing sales operations", tenantId: "tenant1" },
    { name: "Operations", description: "Backend operations and logistics", tenantId: "tenant1" },
    { name: "Administration", description: "Administrative and support functions", tenantId: "tenant1" }
  ];

  for (const dept of departmentData) {
    await dbStorage.createDepartment(dept);
  }

  // Create operating hours for tenant1
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  for (const day of daysOfWeek) {
    await dbStorage.createOperatingHours({
      tenantId: "tenant1",
      dayOfWeek: day,
      openTime: "06:00",
      closeTime: "22:00",
      isClosed: false
    });
  }

  // Create operating hours for acme-corp tenant 
  for (const day of daysOfWeek) {
    await dbStorage.createOperatingHours({
      tenantId: "acme-corp",
      dayOfWeek: day,
      openTime: "09:00",
      closeTime: "18:00",
      isClosed: day === 'sunday' // Closed on Sundays
    });
  }

  console.log("Database initialized with sample data successfully");
  return dbStorage;
}

// Export initialized storage
export const storage = await initializeDatabaseWithSampleData();
