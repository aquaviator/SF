import { users, shifts, opportunities, swapRequests, assignments, holidayRequests, scheduleTemplates, businessProfiles, jobRoles, locations, departments, operatingHours, type User, type InsertUser, type Shift, type InsertShift, type Opportunity, type InsertOpportunity, type SwapRequest, type InsertSwapRequest, type Assignment, type InsertAssignment, type HolidayRequest, type InsertHolidayRequest, type ScheduleTemplate, type InsertScheduleTemplate, type BusinessProfile, type InsertBusinessProfile, type JobRole, type InsertJobRole, type Location, type InsertLocation, type Department, type InsertDepartment, type OperatingHours, type InsertOperatingHours } from "@shared/schema";

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

export const storage = new MemStorage();
