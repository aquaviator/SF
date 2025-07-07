import { 
  users, shifts, opportunities, swapRequests, assignments, holidayRequests, scheduleTemplates, 
  businessProfiles, jobRoles, locations, departments, operatingHours, shiftPolicies,
  analyticsReports, analyticsMetrics, activityLogs, subscriptions, seatPricing, seatAllocation,
  usageMetrics, invoices, billingInfo, timeEntries, performanceMetrics, holidayEntitlements,
  staffStrikes, mailingList, emailChangeTokens,
  type User, type InsertUser, type Shift, type InsertShift, type Opportunity, type InsertOpportunity, 
  type SwapRequest, type InsertSwapRequest, type Assignment, type InsertAssignment, 
  type HolidayRequest, type InsertHolidayRequest, type ScheduleTemplate, type InsertScheduleTemplate, 
  type BusinessProfile, type InsertBusinessProfile, type JobRole, type InsertJobRole, 
  type Location, type InsertLocation, type Department, type InsertDepartment, 
  type OperatingHours, type InsertOperatingHours, type ShiftPolicy, type InsertShiftPolicy,
  type AnalyticsReport, type InsertAnalyticsReport, type AnalyticsMetric, type InsertAnalyticsMetric,
  type ActivityLog, type InsertActivityLog, type Subscription, type InsertSubscription,
  type SeatPricing, type InsertSeatPricing, type SeatAllocation, type InsertSeatAllocation,
  type UsageMetric, type InsertUsageMetric, type Invoice, type InsertInvoice, type BillingInfo, type InsertBillingInfo,
  type TimeEntry, type InsertTimeEntry, type PerformanceMetric, type InsertPerformanceMetric,
  type HolidayEntitlement, type InsertHolidayEntitlement, type StaffStrike, type InsertStaffStrike,
  type MailingList, type InsertMailingList, type EmailChangeToken, type InsertEmailChangeToken
} from "../shared/schema";
import { db as database } from './db';
import { eq, and, lt } from 'drizzle-orm';

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByActivationToken(token: string): Promise<User | undefined>;
  activateUser(id: number, password: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: InsertUser): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getStaffByTenant(tenantId: string): Promise<User[]>;

  // Email change operations
  createEmailChangeToken(token: InsertEmailChangeToken): Promise<EmailChangeToken>;
  getEmailChangeToken(token: string): Promise<EmailChangeToken | undefined>;
  deleteEmailChangeToken(token: string): Promise<void>;
  cleanupExpiredEmailTokens(): Promise<void>;

  // Shift operations
  getShift(id: number): Promise<Shift | undefined>;
  getShiftsByTenant(tenantId: string): Promise<Shift[]>;
  getShiftsByTenantAndDate(tenantId: string, date: string): Promise<Shift[]>;
  getShiftsByUser(tenantId: string, userId: number): Promise<Shift[]>;
  getShiftsByUserAndDate(tenantId: string, userId: number, date: string): Promise<Shift[]>;
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
  getSwapRequestsByUser(tenantId: string, userId: number): Promise<SwapRequest[]>;
  createSwapRequest(swapRequest: InsertSwapRequest): Promise<SwapRequest>;
  updateSwapRequest(id: number, swapRequest: InsertSwapRequest): Promise<SwapRequest | undefined>;
  deleteSwapRequest(id: number): Promise<boolean>;

  // Assignment operations
  getAssignment(id: number): Promise<Assignment | undefined>;
  getAssignmentsByTenant(tenantId: string): Promise<Assignment[]>;
  getAssignmentsByUser(tenantId: string, userId: number): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: number, assignment: InsertAssignment): Promise<Assignment | undefined>;
  deleteAssignment(id: number): Promise<boolean>;

  // Holiday request operations
  getHolidayRequest(id: number): Promise<HolidayRequest | undefined>;
  getHolidayRequestsByTenant(tenantId: string): Promise<HolidayRequest[]>;
  getHolidayRequestsByUser(tenantId: string, userId: number): Promise<HolidayRequest[]>;
  createHolidayRequest(holidayRequest: InsertHolidayRequest): Promise<HolidayRequest>;
  updateHolidayRequest(id: number, holidayRequest: InsertHolidayRequest): Promise<HolidayRequest | undefined>;
  deleteHolidayRequest(id: number): Promise<boolean>;

  // Schedule template operations
  getScheduleTemplate(id: number): Promise<ScheduleTemplate | undefined>;
  getScheduleTemplatesByTenant(tenantId: string): Promise<ScheduleTemplate[]>;
  createScheduleTemplate(template: InsertScheduleTemplate): Promise<ScheduleTemplate>;
  updateScheduleTemplate(id: number, template: InsertScheduleTemplate): Promise<ScheduleTemplate | undefined>;
  deleteScheduleTemplate(id: number): Promise<boolean>;
  generateShiftsFromTemplate(templateId: number, startDate: string, endDate: string): Promise<Shift[]>;

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

  // Shift policy operations
  getShiftPolicy(id: number): Promise<ShiftPolicy | undefined>;
  getShiftPoliciesByTenant(tenantId: string): Promise<ShiftPolicy[]>;
  getShiftPolicyByTenant(tenantId: string): Promise<ShiftPolicy | undefined>;
  createShiftPolicy(policy: InsertShiftPolicy): Promise<ShiftPolicy>;
  updateShiftPolicy(id: number, policy: InsertShiftPolicy): Promise<ShiftPolicy | undefined>;
  upsertShiftPolicy(policy: InsertShiftPolicy): Promise<ShiftPolicy>;
  deleteShiftPolicy(id: number): Promise<boolean>;

  // Analytics operations
  getAnalyticsReport(id: number): Promise<AnalyticsReport | undefined>;
  getAnalyticsReportsByTenant(tenantId: string): Promise<AnalyticsReport[]>;
  createAnalyticsReport(report: InsertAnalyticsReport): Promise<AnalyticsReport>;
  updateAnalyticsReport(id: number, report: InsertAnalyticsReport): Promise<AnalyticsReport | undefined>;
  deleteAnalyticsReport(id: number): Promise<boolean>;

  getAnalyticsMetric(id: number): Promise<AnalyticsMetric | undefined>;
  getAnalyticsMetricsByTenant(tenantId: string): Promise<AnalyticsMetric[]>;
  createAnalyticsMetric(metric: InsertAnalyticsMetric): Promise<AnalyticsMetric>;
  updateAnalyticsMetric(id: number, metric: InsertAnalyticsMetric): Promise<AnalyticsMetric | undefined>;
  deleteAnalyticsMetric(id: number): Promise<boolean>;

  // Activity log operations
  getActivityLog(id: number): Promise<ActivityLog | undefined>;
  getActivityLogsByTenant(tenantId: string): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;

  // Subscription operations
  getSubscription(tenantId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(tenantId: string, subscription: InsertSubscription): Promise<Subscription | undefined>;
  deleteSubscription(tenantId: string): Promise<boolean>;

  // Seat-based billing operations (no subscription plans - pure seat billing)
  addSeats(tenantId: string, additionalSeats: number): Promise<Subscription | undefined>;
  removeSeats(tenantId: string, seatsToRemove: number): Promise<Subscription | undefined>;
  calculateMonthlyCost(tenantId: string): Promise<number>;

  // Usage metrics operations
  getUsageMetrics(tenantId: string): Promise<UsageMetric | undefined>;
  createUsageMetrics(metrics: InsertUsageMetric): Promise<UsageMetric>;
  updateUsageMetrics(tenantId: string, metrics: InsertUsageMetric): Promise<UsageMetric | undefined>;

  // Invoice operations
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoicesByTenant(tenantId: string): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: InsertInvoice): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;

  // Billing info operations
  getBillingInfo(tenantId: string): Promise<BillingInfo | undefined>;
  createBillingInfo(billing: InsertBillingInfo): Promise<BillingInfo>;
  updateBillingInfo(tenantId: string, billing: InsertBillingInfo): Promise<BillingInfo | undefined>;
  deleteBillingInfo(tenantId: string): Promise<boolean>;

  // Time entry operations (proper types)
  getTimeEntry(id: number): Promise<TimeEntry | undefined>;
  getTimeEntriesByTenant(tenantId: string): Promise<TimeEntry[]>;
  getTimeEntriesByUser(tenantId: string, userId: number): Promise<TimeEntry[]>;
  getTimeEntriesByUserAndDate(tenantId: string, userId: number, date: string): Promise<TimeEntry[]>;
  getActiveTimeEntry(tenantId: string, userId: number): Promise<TimeEntry | undefined>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: number, entry: InsertTimeEntry): Promise<TimeEntry | undefined>;
  deleteTimeEntry(id: number): Promise<boolean>;

  // Performance metrics operations
  getPerformanceMetric(id: number): Promise<PerformanceMetric | undefined>;
  getPerformanceMetricsByTenant(tenantId: string): Promise<PerformanceMetric[]>;
  getPerformanceMetricsByUser(tenantId: string, userId: number): Promise<PerformanceMetric[]>;
  createPerformanceMetric(metric: InsertPerformanceMetric): Promise<PerformanceMetric>;
  updatePerformanceMetric(id: number, metric: InsertPerformanceMetric): Promise<PerformanceMetric | undefined>;
  deletePerformanceMetric(id: number): Promise<boolean>;

  // Holiday entitlement operations
  getHolidayEntitlement(id: number): Promise<HolidayEntitlement | undefined>;
  getHolidayEntitlementsByTenant(tenantId: string): Promise<HolidayEntitlement[]>;
  getHolidayEntitlementByUser(tenantId: string, userId: number, year: number): Promise<HolidayEntitlement | undefined>;
  createHolidayEntitlement(entitlement: InsertHolidayEntitlement): Promise<HolidayEntitlement>;
  updateHolidayEntitlement(id: number, entitlement: InsertHolidayEntitlement): Promise<HolidayEntitlement | undefined>;
  updateHolidayEntitlementByUser(tenantId: string, userId: number, year: number, entitlement: InsertHolidayEntitlement): Promise<HolidayEntitlement | undefined>;
  deleteHolidayEntitlement(id: number): Promise<boolean>;

  // Staff strikes operations
  getStaffStrike(id: number): Promise<StaffStrike | undefined>;
  getStaffStrikesByTenant(tenantId: string): Promise<StaffStrike[]>;
  getStaffStrikesByUser(tenantId: string, userId: number): Promise<StaffStrike[]>;
  getStrikesByUserAndShift(userId: number, shiftId: number): Promise<StaffStrike[]>;
  getTotalStrikePoints(tenantId: string, userId: number): Promise<number>;
  createStaffStrike(strike: InsertStaffStrike): Promise<StaffStrike>;
  updateStaffStrike(id: number, strike: InsertStaffStrike): Promise<StaffStrike | undefined>;
  deleteStaffStrike(id: number): Promise<boolean>;
  resetExpiredStrikes(tenantId: string): Promise<number>;

  // Debug operations
  clearAllData(): Promise<void>;
  
  // Helper method to get shifts by tenant and assignment type (for opportunities)
  getShiftsByTenantAndType(tenantId: string, assignmentType: string): Promise<Shift[]>;
  
  // Assignment tracking methods
  getShiftsByUserAndStatus(tenantId: string, userId: number, status: string): Promise<Shift[]>;
  getAssignmentTrackingData(tenantId: string): Promise<any[]>;

  // Mailing list operations
  addToMailingList(email: string, source?: string): Promise<MailingList>;
  getMailingListByEmail(email: string): Promise<MailingList | undefined>;
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

  async getShiftsByTenantAndDate(tenantId: string, date: string): Promise<Shift[]> {
    return Array.from(this.shifts.values()).filter(shift => 
      shift.tenantId === tenantId && shift.date === date
    );
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
      status: insertShift.status as "declined" | "open" | "claimed" | "assigned" | "confirmed" | "clocked_in" | "clocked_out" | "completed" | "cancelled",
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
      type: insertHolidayRequest.type || "vacation",
      priority: insertHolidayRequest.priority || "normal",
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

  async clearAllData(): Promise<void> {
    this.users.clear();
    this.shifts.clear();
    this.opportunities.clear();
    this.swapRequests.clear();
    this.assignments.clear();
    this.holidayRequests.clear();
    this.scheduleTemplates.clear();
    this.timeEntries.clear();
    this.businessProfiles.clear();
    this.jobRoles.clear();
    this.locations.clear();
    this.departments.clear();
    this.operatingHours.clear();
  }
}

// Initialize database connection
// Using the shared database connection from server/database.ts

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await database.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await database.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByActivationToken(token: string): Promise<User | undefined> {
    const result = await database.select().from(users).where(eq(users.activationToken, token)).limit(1);
    return result[0];
  }

  async activateUser(id: number, password: string): Promise<User | undefined> {
    const result = await database.update(users).set({
      password,
      activatedAt: new Date(),
      activationToken: null,
      tokenExpiresAt: null,
      isActive: true
    }).where(eq(users.id, id)).returning();
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await database.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: number, insertUser: InsertUser): Promise<User | undefined> {
    const result = await database.update(users).set(insertUser).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await database.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getStaffByTenant(tenantId: string): Promise<User[]> {
    return await database.select().from(users).where(eq(users.tenantId, tenantId));
  }

  // Email change operations
  // Simple email update - synchronizes username and email
  async updateUserEmail(userId: number, newEmail: string): Promise<User | undefined> {
    const result = await database.update(users).set({
      email: newEmail,
      username: newEmail, // Username is the login credential
    }).where(eq(users.id, userId)).returning();

    // For owner users, also update the business profile email
    if (result[0] && result[0].role === 'owner') {
      await database.update(businessProfiles).set({
        email: newEmail
      }).where(eq(businessProfiles.tenantId, result[0].tenantId));
    }

    return result[0];
  }



  // Business profile operations
  async getBusinessProfile(tenantId: string): Promise<BusinessProfile | undefined> {
    const result = await database.select().from(businessProfiles).where(eq(businessProfiles.tenantId, tenantId)).limit(1);
    return result[0];
  }

  async createBusinessProfile(insertProfile: InsertBusinessProfile): Promise<BusinessProfile> {
    const result = await database.insert(businessProfiles).values(insertProfile).returning();
    return result[0];
  }

  async updateBusinessProfile(tenantId: string, insertProfile: InsertBusinessProfile): Promise<BusinessProfile | undefined> {
    const result = await database.update(businessProfiles).set(insertProfile).where(eq(businessProfiles.tenantId, tenantId)).returning();
    return result[0];
  }

  async deleteBusinessProfile(tenantId: string): Promise<boolean> {
    const result = await database.delete(businessProfiles).where(eq(businessProfiles.tenantId, tenantId));
    return (result.rowCount ?? 0) > 0;
  }

  // Job role operations
  async getJobRole(id: number): Promise<JobRole | undefined> {
    const result = await database.select().from(jobRoles).where(eq(jobRoles.id, id)).limit(1);
    return result[0];
  }

  async getJobRolesByTenant(tenantId: string): Promise<JobRole[]> {
    return await database.select().from(jobRoles).where(eq(jobRoles.tenantId, tenantId));
  }

  async createJobRole(insertRole: InsertJobRole): Promise<JobRole> {
    const result = await database.insert(jobRoles).values(insertRole).returning();
    return result[0];
  }

  async updateJobRole(id: number, insertRole: InsertJobRole): Promise<JobRole | undefined> {
    const result = await database.update(jobRoles).set(insertRole).where(eq(jobRoles.id, id)).returning();
    return result[0];
  }

  async deleteJobRole(id: number): Promise<boolean> {
    const result = await database.delete(jobRoles).where(eq(jobRoles.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Location operations
  async getLocation(id: number): Promise<Location | undefined> {
    const result = await database.select().from(locations).where(eq(locations.id, id)).limit(1);
    return result[0];
  }

  async getLocationsByTenant(tenantId: string): Promise<Location[]> {
    return await database.select().from(locations).where(eq(locations.tenantId, tenantId));
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const result = await database.insert(locations).values(insertLocation).returning();
    return result[0];
  }

  async updateLocation(id: number, insertLocation: InsertLocation): Promise<Location | undefined> {
    const result = await database.update(locations).set(insertLocation).where(eq(locations.id, id)).returning();
    return result[0];
  }

  async deleteLocation(id: number): Promise<boolean> {
    const result = await database.delete(locations).where(eq(locations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Department operations
  async getDepartment(id: number): Promise<Department | undefined> {
    const result = await database.select().from(departments).where(eq(departments.id, id)).limit(1);
    return result[0];
  }

  async getDepartmentsByTenant(tenantId: string): Promise<Department[]> {
    return await database.select().from(departments).where(eq(departments.tenantId, tenantId));
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const result = await database.insert(departments).values(insertDepartment).returning();
    return result[0];
  }

  async updateDepartment(id: number, insertDepartment: InsertDepartment): Promise<Department | undefined> {
    const result = await database.update(departments).set(insertDepartment).where(eq(departments.id, id)).returning();
    return result[0];
  }

  async deleteDepartment(id: number): Promise<boolean> {
    const result = await database.delete(departments).where(eq(departments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Operating hours operations
  async getOperatingHours(id: number): Promise<OperatingHours | undefined> {
    const result = await database.select().from(operatingHours).where(eq(operatingHours.id, id)).limit(1);
    return result[0];
  }

  async getOperatingHoursByTenant(tenantId: string): Promise<OperatingHours[]> {
    return await database.select().from(operatingHours).where(eq(operatingHours.tenantId, tenantId));
  }

  async createOperatingHours(insertHours: InsertOperatingHours): Promise<OperatingHours> {
    const result = await database.insert(operatingHours).values(insertHours).returning();
    return result[0];
  }

  async updateOperatingHours(id: number, insertHours: InsertOperatingHours): Promise<OperatingHours | undefined> {
    const result = await database.update(operatingHours).set(insertHours).where(eq(operatingHours.id, id)).returning();
    return result[0];
  }

  async deleteOperatingHours(id: number): Promise<boolean> {
    const result = await database.delete(operatingHours).where(eq(operatingHours.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Shift operations
  async getShift(id: number): Promise<Shift | undefined> {
    const result = await database.select().from(shifts).where(eq(shifts.id, id)).limit(1);
    return result[0];
  }

  async getShiftsByTenant(tenantId: string): Promise<Shift[]> {
    return await database.select().from(shifts).where(eq(shifts.tenantId, tenantId));
  }

  async getShiftsByTenantAndDate(tenantId: string, date: string): Promise<Shift[]> {
    return await database.select().from(shifts).where(and(eq(shifts.tenantId, tenantId), eq(shifts.date, date)));
  }

  async getShiftsByUser(tenantId: string, userId: number): Promise<Shift[]> {
    return await database.select().from(shifts).where(
      and(eq(shifts.tenantId, tenantId), eq(shifts.assignedTo, userId))
    );
  }

  async getShiftsByUserAndDate(tenantId: string, userId: number, date: string): Promise<Shift[]> {
    return await database.select().from(shifts).where(
      and(
        eq(shifts.tenantId, tenantId), 
        eq(shifts.assignedTo, userId),
        eq(shifts.date, date)
      )
    );
  }

  async createShift(insertShift: InsertShift): Promise<Shift> {
    const result = await database.insert(shifts).values(insertShift).returning();
    return result[0];
  }

  async updateShift(id: number, insertShift: InsertShift): Promise<Shift | undefined> {
    const result = await database.update(shifts).set(insertShift).where(eq(shifts.id, id)).returning();
    return result[0];
  }

  async deleteShift(id: number): Promise<boolean> {
    const result = await database.delete(shifts).where(eq(shifts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Opportunity operations
  async getOpportunity(id: number): Promise<Opportunity | undefined> {
    const result = await database.select().from(opportunities).where(eq(opportunities.id, id)).limit(1);
    return result[0];
  }

  async getOpportunitiesByTenant(tenantId: string): Promise<Opportunity[]> {
    return await database.select().from(opportunities).where(eq(opportunities.tenantId, tenantId));
  }

  async createOpportunity(insertOpportunity: InsertOpportunity): Promise<Opportunity> {
    const result = await database.insert(opportunities).values(insertOpportunity).returning();
    return result[0];
  }

  async updateOpportunity(id: number, insertOpportunity: InsertOpportunity): Promise<Opportunity | undefined> {
    const result = await database.update(opportunities).set(insertOpportunity).where(eq(opportunities.id, id)).returning();
    return result[0];
  }

  async deleteOpportunity(id: number): Promise<boolean> {
    const result = await database.delete(opportunities).where(eq(opportunities.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Swap request operations
  async getSwapRequest(id: number): Promise<SwapRequest | undefined> {
    const result = await database.select().from(swapRequests).where(eq(swapRequests.id, id)).limit(1);
    return result[0];
  }

  async getSwapRequestsByTenant(tenantId: string): Promise<SwapRequest[]> {
    return await database.select().from(swapRequests).where(eq(swapRequests.tenantId, tenantId));
  }

  async createSwapRequest(insertSwapRequest: InsertSwapRequest): Promise<SwapRequest> {
    const result = await database.insert(swapRequests).values(insertSwapRequest).returning();
    return result[0];
  }

  async updateSwapRequest(id: number, insertSwapRequest: InsertSwapRequest): Promise<SwapRequest | undefined> {
    const result = await database.update(swapRequests).set(insertSwapRequest).where(eq(swapRequests.id, id)).returning();
    return result[0];
  }

  async deleteSwapRequest(id: number): Promise<boolean> {
    const result = await database.delete(swapRequests).where(eq(swapRequests.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getSwapRequestsByUser(tenantId: string, userId: number): Promise<SwapRequest[]> {
    return await database.select().from(swapRequests).where(
      and(eq(swapRequests.tenantId, tenantId), eq(swapRequests.requesterId, userId))
    );
  }

  // Assignment operations
  async getAssignment(id: number): Promise<Assignment | undefined> {
    const result = await database.select().from(assignments).where(eq(assignments.id, id)).limit(1);
    return result[0];
  }

  async getAssignmentsByTenant(tenantId: string): Promise<Assignment[]> {
    return await database.select().from(assignments).where(eq(assignments.tenantId, tenantId));
  }

  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const result = await database.insert(assignments).values(insertAssignment).returning();
    return result[0];
  }

  async updateAssignment(id: number, insertAssignment: InsertAssignment): Promise<Assignment | undefined> {
    const result = await database.update(assignments).set(insertAssignment).where(eq(assignments.id, id)).returning();
    return result[0];
  }

  async deleteAssignment(id: number): Promise<boolean> {
    const result = await database.delete(assignments).where(eq(assignments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAssignmentsByUser(tenantId: string, userId: number): Promise<Assignment[]> {
    // For assignments, we need to check if the user is assigned to the assignment
    // This would require a join with a staff_assignments table or similar
    // For now, return empty array since assignments don't have direct user assignments
    return [];
  }

  // Holiday request operations
  async getHolidayRequest(id: number): Promise<HolidayRequest | undefined> {
    const result = await database.select().from(holidayRequests).where(eq(holidayRequests.id, id)).limit(1);
    return result[0];
  }

  async getHolidayRequestsByTenant(tenantId: string): Promise<HolidayRequest[]> {
    const result = await database
      .select({
        // Holiday request fields
        id: holidayRequests.id,
        tenantId: holidayRequests.tenantId,
        requesterId: holidayRequests.requesterId,
        startDate: holidayRequests.startDate,
        endDate: holidayRequests.endDate,
        reason: holidayRequests.reason,
        status: holidayRequests.status,
        type: holidayRequests.type,
        priority: holidayRequests.priority,
        reviewedBy: holidayRequests.reviewedBy,
        reviewedAt: holidayRequests.reviewedAt,
        reviewNotes: holidayRequests.reviewNotes,
        createdAt: holidayRequests.createdAt,
        // User fields for display
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(holidayRequests)
      .leftJoin(users, eq(holidayRequests.requesterId, users.id))
      .where(eq(holidayRequests.tenantId, tenantId));

    return result.map(row => ({
      ...row,
      // Add computed name field for compatibility
      name: row.firstName && row.lastName 
        ? `${row.firstName} ${row.lastName}` 
        : `User ${row.requesterId}`,
    })) as any;
  }

  async createHolidayRequest(insertHolidayRequest: InsertHolidayRequest): Promise<HolidayRequest> {
    const result = await database.insert(holidayRequests).values(insertHolidayRequest).returning();
    return result[0];
  }

  async updateHolidayRequest(id: number, insertHolidayRequest: InsertHolidayRequest): Promise<HolidayRequest | undefined> {
    const result = await database.update(holidayRequests).set(insertHolidayRequest).where(eq(holidayRequests.id, id)).returning();
    return result[0];
  }

  async deleteHolidayRequest(id: number): Promise<boolean> {
    const result = await database.delete(holidayRequests).where(eq(holidayRequests.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getHolidayRequestsByUser(tenantId: string, userId: number): Promise<HolidayRequest[]> {
    const result = await database
      .select({
        // Holiday request fields
        id: holidayRequests.id,
        tenantId: holidayRequests.tenantId,
        requesterId: holidayRequests.requesterId,
        startDate: holidayRequests.startDate,
        endDate: holidayRequests.endDate,
        reason: holidayRequests.reason,
        status: holidayRequests.status,
        type: holidayRequests.type,
        priority: holidayRequests.priority,
        reviewedBy: holidayRequests.reviewedBy,
        reviewedAt: holidayRequests.reviewedAt,
        reviewNotes: holidayRequests.reviewNotes,
        createdAt: holidayRequests.createdAt,
        // User fields
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(holidayRequests)
      .leftJoin(users, eq(holidayRequests.requesterId, users.id))
      .where(and(eq(holidayRequests.tenantId, tenantId), eq(holidayRequests.requesterId, userId)));

    return result.map(row => ({
      ...row,
      // Add computed name field for compatibility
      name: row.firstName && row.lastName 
        ? `${row.firstName} ${row.lastName}` 
        : `User ${row.requesterId}`,
    })) as any;
  }

  // Schedule template operations
  async getScheduleTemplate(id: number): Promise<ScheduleTemplate | undefined> {
    const result = await database.select().from(scheduleTemplates).where(eq(scheduleTemplates.id, id)).limit(1);
    return result[0];
  }

  async getScheduleTemplatesByTenant(tenantId: string): Promise<ScheduleTemplate[]> {
    return await database.select().from(scheduleTemplates).where(eq(scheduleTemplates.tenantId, tenantId));
  }

  async createScheduleTemplate(insertTemplate: InsertScheduleTemplate): Promise<ScheduleTemplate> {
    const result = await database.insert(scheduleTemplates).values(insertTemplate).returning();
    return result[0];
  }

  async updateScheduleTemplate(id: number, insertTemplate: InsertScheduleTemplate): Promise<ScheduleTemplate | undefined> {
    const result = await database.update(scheduleTemplates).set(insertTemplate).where(eq(scheduleTemplates.id, id)).returning();
    return result[0];
  }

  async deleteScheduleTemplate(id: number): Promise<boolean> {
    const result = await database.delete(scheduleTemplates).where(eq(scheduleTemplates.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async generateShiftsFromTemplate(templateId: number, startDate: string, endDate: string): Promise<Shift[]> {
    // Get the template
    const template = await this.getScheduleTemplate(templateId);
    if (!template) {
      throw new Error(`Template with ID ${templateId} not found`);
    }

    const createdShifts: Shift[] = [];
    let currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);

    // Parse slots from JSON (new format) or fall back to legacy format
    let slots: Array<{role: string, staffIds: number[], quantity: number}> = [];
    
    if (template.slots && Array.isArray(template.slots)) {
      slots = template.slots;
    } else {
      // Legacy fallback: convert positions array to slots format
      for (const position of template.positions || []) {
        slots.push({
          role: position,
          staffIds: [],
          quantity: template.requiredStaffPerPosition || 1
        });
      }
    }

    // Generate shifts for each day in the date range
    while (currentDate <= endDateObj) {
      const dateStr = currentDate.toISOString().split('T')[0];

      // Create shifts for each slot
      for (const slot of slots) {
        const { role, staffIds, quantity } = slot;

        // Create the required number of shifts for this role
        for (let i = 0; i < quantity; i++) {
          const assignedStaffId = staffIds[i] || null;
          
          const shiftData: InsertShift = {
            tenantId: template.tenantId,
            date: dateStr,
            startTime: "09:00", // Default time - could be made configurable
            endTime: "17:00",   // Default time - could be made configurable
            role: role,
            description: `${role} shift from template: ${template.name}`,
            location: "Main Location", // Default location - could be made configurable
            assignedTo: assignedStaffId,
            status: assignedStaffId ? "assigned" : "open",
            assignmentType: assignedStaffId ? "assigned" : "opportunity",
            requiredStaff: 1,
            claimedBy: [],
            templateId: templateId,
            notes: `Generated from template: ${template.name}`,
            createdBy: template.createdBy,
          };

          const createdShift = await this.createShift(shiftData);
          createdShifts.push(createdShift);
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return createdShifts;
  }

  // Subscription operations
  async getSubscription(tenantId: string): Promise<Subscription | undefined> {
    const result = await database.select().from(subscriptions).where(eq(subscriptions.tenantId, tenantId)).limit(1);
    return result[0];
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const result = await database.insert(subscriptions).values(insertSubscription).returning();
    return result[0];
  }

  async updateSubscription(tenantId: string, insertSubscription: InsertSubscription): Promise<Subscription | undefined> {
    const result = await database.update(subscriptions).set(insertSubscription).where(eq(subscriptions.tenantId, tenantId)).returning();
    return result[0];
  }

  async deleteSubscription(tenantId: string): Promise<boolean> {
    const result = await database.delete(subscriptions).where(eq(subscriptions.tenantId, tenantId));
    return (result.rowCount ?? 0) > 0;
  }

  // Seat-based billing operations (no subscription plans)
  async addSeats(tenantId: string, additionalSeats: number): Promise<Subscription | undefined> {
    const subscription = await this.getSubscription(tenantId);
    if (!subscription) return undefined;
    
    const updatedSubscription = await this.updateSubscription(tenantId, {
      ...subscription,
      seats: subscription.seats + additionalSeats
    });
    return updatedSubscription;
  }

  async removeSeats(tenantId: string, seatsToRemove: number): Promise<Subscription | undefined> {
    const subscription = await this.getSubscription(tenantId);
    if (!subscription) return undefined;
    
    const newSeats = Math.max(1, subscription.seats - seatsToRemove); // Minimum 1 seat
    const updatedSubscription = await this.updateSubscription(tenantId, {
      ...subscription,
      seats: newSeats
    });
    return updatedSubscription;
  }

  async calculateMonthlyCost(tenantId: string): Promise<number> {
    const subscription = await this.getSubscription(tenantId);
    if (!subscription) return 0;
    
    const pricePerSeat = 300; // £3.00 in pence
    return subscription.seats * pricePerSeat;
  }

  // Analytics operations
  async getAnalyticsReport(id: number): Promise<AnalyticsReport | undefined> {
    const result = await database.select().from(analyticsReports).where(eq(analyticsReports.id, id)).limit(1);
    return result[0];
  }

  async getAnalyticsReportsByTenant(tenantId: string): Promise<AnalyticsReport[]> {
    return await database.select().from(analyticsReports).where(eq(analyticsReports.tenantId, tenantId));
  }

  async createAnalyticsReport(insertReport: InsertAnalyticsReport): Promise<AnalyticsReport> {
    const result = await database.insert(analyticsReports).values(insertReport).returning();
    return result[0];
  }

  async updateAnalyticsReport(id: number, insertReport: InsertAnalyticsReport): Promise<AnalyticsReport | undefined> {
    const result = await database.update(analyticsReports).set(insertReport).where(eq(analyticsReports.id, id)).returning();
    return result[0];
  }

  async deleteAnalyticsReport(id: number): Promise<boolean> {
    const result = await database.delete(analyticsReports).where(eq(analyticsReports.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAnalyticsMetric(id: number): Promise<AnalyticsMetric | undefined> {
    const result = await database.select().from(analyticsMetrics).where(eq(analyticsMetrics.id, id)).limit(1);
    return result[0];
  }

  async getAnalyticsMetricsByTenant(tenantId: string): Promise<AnalyticsMetric[]> {
    return await database.select().from(analyticsMetrics).where(eq(analyticsMetrics.tenantId, tenantId));
  }

  async createAnalyticsMetric(insertMetric: InsertAnalyticsMetric): Promise<AnalyticsMetric> {
    const result = await database.insert(analyticsMetrics).values(insertMetric).returning();
    return result[0];
  }

  async updateAnalyticsMetric(id: number, insertMetric: InsertAnalyticsMetric): Promise<AnalyticsMetric | undefined> {
    const result = await database.update(analyticsMetrics).set(insertMetric).where(eq(analyticsMetrics.id, id)).returning();
    return result[0];
  }

  async deleteAnalyticsMetric(id: number): Promise<boolean> {
    const result = await database.delete(analyticsMetrics).where(eq(analyticsMetrics.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Activity log operations
  async getActivityLog(id: number): Promise<ActivityLog | undefined> {
    const result = await database.select().from(activityLogs).where(eq(activityLogs.id, id)).limit(1);
    return result[0];
  }

  async getActivityLogsByTenant(tenantId: string): Promise<ActivityLog[]> {
    return await database.select().from(activityLogs).where(eq(activityLogs.tenantId, tenantId));
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const result = await database.insert(activityLogs).values(insertLog).returning();
    return result[0];
  }

  // Time entry operations  
  async getTimeEntry(id: number): Promise<TimeEntry | undefined> {
    const result = await database.select().from(timeEntries).where(eq(timeEntries.id, id)).limit(1);
    return result[0];
  }

  async getTimeEntriesByTenant(tenantId: string): Promise<TimeEntry[]> {
    return await database.select().from(timeEntries).where(eq(timeEntries.tenantId, tenantId));
  }

  async getTimeEntriesByUser(tenantId: string, userId: number): Promise<TimeEntry[]> {
    return await database.select().from(timeEntries).where(and(eq(timeEntries.tenantId, tenantId), eq(timeEntries.userId, userId)));
  }

  async getTimeEntriesByUserAndDate(tenantId: string, userId: number, date: string): Promise<TimeEntry[]> {
    // Since the database doesn't have a date column, we'll filter by clock_in_time date
    const result = await database.select().from(timeEntries).where(
      and(
        eq(timeEntries.tenantId, tenantId), 
        eq(timeEntries.userId, userId)
      )
    );
    
    // Filter by date on the clock_in_time field
    return result.filter(entry => {
      if (!entry.clockInTime) return false;
      const entryDate = entry.clockInTime.toISOString().split('T')[0];
      return entryDate === date;
    });
  }

  async getActiveTimeEntry(tenantId: string, userId: number): Promise<TimeEntry | undefined> {
    const result = await database.select().from(timeEntries)
      .where(eq(timeEntries.tenantId, tenantId))
      .limit(1);
    return result[0];
  }

  async getTimeEntryById(id: number): Promise<TimeEntry | undefined> {
    const result = await database.select().from(timeEntries).where(eq(timeEntries.id, id)).limit(1);
    return result[0];
  }

  async createTimeEntry(insertEntry: InsertTimeEntry): Promise<TimeEntry> {
    const result = await database.insert(timeEntries).values(insertEntry).returning();
    return result[0];
  }

  async updateTimeEntry(id: number, insertEntry: InsertTimeEntry): Promise<TimeEntry | undefined> {
    const result = await database.update(timeEntries).set(insertEntry).where(eq(timeEntries.id, id)).returning();
    return result[0];
  }

  async deleteTimeEntry(id: number): Promise<boolean> {
    const result = await database.delete(timeEntries).where(eq(timeEntries.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Performance metrics operations
  async getPerformanceMetric(id: number): Promise<PerformanceMetric | undefined> {
    const result = await database.select().from(performanceMetrics).where(eq(performanceMetrics.id, id)).limit(1);
    return result[0];
  }

  async getPerformanceMetricsByTenant(tenantId: string): Promise<PerformanceMetric[]> {
    return await database.select().from(performanceMetrics).where(eq(performanceMetrics.tenantId, tenantId));
  }

  async getPerformanceMetricsByUser(tenantId: string, userId: number): Promise<PerformanceMetric[]> {
    return await database.select().from(performanceMetrics).where(eq(performanceMetrics.tenantId, tenantId));
  }

  async createPerformanceMetric(insertMetric: InsertPerformanceMetric): Promise<PerformanceMetric> {
    const result = await database.insert(performanceMetrics).values(insertMetric).returning();
    return result[0];
  }

  async updatePerformanceMetric(id: number, insertMetric: InsertPerformanceMetric): Promise<PerformanceMetric | undefined> {
    const result = await database.update(performanceMetrics).set(insertMetric).where(eq(performanceMetrics.id, id)).returning();
    return result[0];
  }

  async deletePerformanceMetric(id: number): Promise<boolean> {
    const result = await database.delete(performanceMetrics).where(eq(performanceMetrics.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Shift policy operations
  async getShiftPolicy(id: number): Promise<ShiftPolicy | undefined> {
    const result = await database.select().from(shiftPolicies).where(eq(shiftPolicies.id, id)).limit(1);
    return result[0];
  }

  async getShiftPoliciesByTenant(tenantId: string): Promise<ShiftPolicy[]> {
    return await database.select().from(shiftPolicies).where(eq(shiftPolicies.tenantId, tenantId));
  }

  async createShiftPolicy(insertPolicy: InsertShiftPolicy): Promise<ShiftPolicy> {
    const result = await database.insert(shiftPolicies).values(insertPolicy).returning();
    return result[0];
  }

  async updateShiftPolicy(id: number, insertPolicy: InsertShiftPolicy): Promise<ShiftPolicy | undefined> {
    const result = await database.update(shiftPolicies).set(insertPolicy).where(eq(shiftPolicies.id, id)).returning();
    return result[0];
  }

  async deleteShiftPolicy(id: number): Promise<boolean> {
    const result = await database.delete(shiftPolicies).where(eq(shiftPolicies.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getShiftPolicyByTenant(tenantId: string): Promise<ShiftPolicy | undefined> {
    const result = await database.select().from(shiftPolicies).where(eq(shiftPolicies.tenantId, tenantId)).limit(1);
    return result[0];
  }

  async upsertShiftPolicy(insertPolicy: InsertShiftPolicy): Promise<ShiftPolicy> {
    console.log("=== SQL QUERY DEBUG FOR SHIFT POLICY ===");
    console.log("Input data to upsertShiftPolicy:", JSON.stringify(insertPolicy, null, 2));
    
    const existing = await this.getShiftPolicyByTenant(insertPolicy.tenantId);
    console.log("Existing policy found:", existing ? "YES" : "NO");
    
    if (existing) {
      // Update existing policy
      const updateData = {
        ...insertPolicy,
        updatedAt: new Date(),
      };
      console.log("SQL UPDATE operation with data:", JSON.stringify(updateData, null, 2));
      console.log("SQL UPDATE WHERE tenantId =", insertPolicy.tenantId);
      
      const result = await database.update(shiftPolicies).set(updateData).where(eq(shiftPolicies.tenantId, insertPolicy.tenantId)).returning();
      console.log("SQL UPDATE result:", JSON.stringify(result[0], null, 2));
      console.log("=== END SQL QUERY DEBUG ===");
      return result[0];
    } else {
      // Create new policy
      console.log("SQL INSERT operation with data:", JSON.stringify(insertPolicy, null, 2));
      const result = await database.insert(shiftPolicies).values(insertPolicy).returning();
      console.log("SQL INSERT result:", JSON.stringify(result[0], null, 2));
      console.log("=== END SQL QUERY DEBUG ===");
      return result[0];
    }
  }

  // Usage metrics operations
  async getUsageMetrics(tenantId: string): Promise<UsageMetric | undefined> {
    const result = await database.select().from(usageMetrics).where(eq(usageMetrics.tenantId, tenantId)).limit(1);
    return result[0];
  }

  async createUsageMetrics(insertMetrics: InsertUsageMetric): Promise<UsageMetric> {
    const result = await database.insert(usageMetrics).values(insertMetrics).returning();
    return result[0];
  }

  async updateUsageMetrics(tenantId: string, insertMetrics: InsertUsageMetric): Promise<UsageMetric | undefined> {
    const result = await database.update(usageMetrics).set(insertMetrics).where(eq(usageMetrics.tenantId, tenantId)).returning();
    return result[0];
  }

  // Invoice operations
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const result = await database.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    return result[0];
  }

  async getInvoicesByTenant(tenantId: string): Promise<Invoice[]> {
    return await database.select().from(invoices).where(eq(invoices.tenantId, tenantId));
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const result = await database.insert(invoices).values(insertInvoice).returning();
    return result[0];
  }

  async updateInvoice(id: number, insertInvoice: InsertInvoice): Promise<Invoice | undefined> {
    const result = await database.update(invoices).set(insertInvoice).where(eq(invoices.id, id)).returning();
    return result[0];
  }

  async deleteInvoice(id: number): Promise<boolean> {
    const result = await database.delete(invoices).where(eq(invoices.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Billing info operations
  async getBillingInfo(tenantId: string): Promise<BillingInfo | undefined> {
    const result = await database.select().from(billingInfo).where(eq(billingInfo.tenantId, tenantId)).limit(1);
    return result[0];
  }

  async createBillingInfo(insertBilling: InsertBillingInfo): Promise<BillingInfo> {
    const result = await database.insert(billingInfo).values(insertBilling).returning();
    return result[0];
  }

  async updateBillingInfo(tenantId: string, insertBilling: InsertBillingInfo): Promise<BillingInfo | undefined> {
    const result = await database.update(billingInfo).set(insertBilling).where(eq(billingInfo.tenantId, tenantId)).returning();
    return result[0];
  }

  async deleteBillingInfo(tenantId: string): Promise<boolean> {
    const result = await database.delete(billingInfo).where(eq(billingInfo.tenantId, tenantId));
    return (result.rowCount ?? 0) > 0;
  }

  // Holiday entitlement operations
  async getHolidayEntitlement(id: number): Promise<HolidayEntitlement | undefined> {
    const result = await database.select().from(holidayEntitlements).where(eq(holidayEntitlements.id, id)).limit(1);
    return result[0];
  }

  async getHolidayEntitlementsByTenant(tenantId: string): Promise<HolidayEntitlement[]> {
    const result = await database
      .select({
        id: holidayEntitlements.id,
        tenantId: holidayEntitlements.tenantId,
        userId: holidayEntitlements.userId,
        entitlementDays: holidayEntitlements.entitlementDays,
        usedDays: holidayEntitlements.usedDays,
        pendingDays: holidayEntitlements.pendingDays,
        year: holidayEntitlements.year,
        createdAt: holidayEntitlements.createdAt,
        updatedAt: holidayEntitlements.updatedAt,
        // Join with users to get staff member name
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(holidayEntitlements)
      .leftJoin(users, eq(holidayEntitlements.userId, users.id))
      .where(eq(holidayEntitlements.tenantId, tenantId));
    
    // Transform to include computed fields and staff names
    return result.map(row => ({
      ...row,
      name: `${row.firstName} ${row.lastName}`,
      remainingDays: row.entitlementDays - (row.usedDays + row.pendingDays),
    })) as any;
  }

  async getHolidayEntitlementByUser(tenantId: string, userId: number, year: number): Promise<HolidayEntitlement | undefined> {
    const result = await database
      .select()
      .from(holidayEntitlements)
      .where(
        and(
          eq(holidayEntitlements.tenantId, tenantId),
          eq(holidayEntitlements.userId, userId),
          eq(holidayEntitlements.year, year)
        )
      )
      .limit(1);
    return result[0];
  }

  async createHolidayEntitlement(insertEntitlement: InsertHolidayEntitlement): Promise<HolidayEntitlement> {
    const result = await database.insert(holidayEntitlements).values(insertEntitlement).returning();
    return result[0];
  }

  async updateHolidayEntitlement(id: number, insertEntitlement: InsertHolidayEntitlement): Promise<HolidayEntitlement | undefined> {
    const result = await database.update(holidayEntitlements).set(insertEntitlement).where(eq(holidayEntitlements.id, id)).returning();
    return result[0];
  }

  async updateHolidayEntitlementByUser(tenantId: string, userId: number, year: number, insertEntitlement: InsertHolidayEntitlement): Promise<HolidayEntitlement | undefined> {
    const result = await database
      .update(holidayEntitlements)
      .set({
        ...insertEntitlement,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(holidayEntitlements.tenantId, tenantId),
          eq(holidayEntitlements.userId, userId),
          eq(holidayEntitlements.year, year)
        )
      )
      .returning();
    return result[0];
  }

  async deleteHolidayEntitlement(id: number): Promise<boolean> {
    const result = await database.delete(holidayEntitlements).where(eq(holidayEntitlements.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Staff strikes operations
  async getStaffStrike(id: number): Promise<StaffStrike | undefined> {
    const result = await database.select().from(staffStrikes).where(eq(staffStrikes.id, id));
    return result[0];
  }

  async getStaffStrikesByTenant(tenantId: string): Promise<StaffStrike[]> {
    return await database.select().from(staffStrikes).where(eq(staffStrikes.tenantId, tenantId));
  }

  async getStaffStrikesByUser(tenantId: string, userId: number): Promise<StaffStrike[]> {
    return await database.select().from(staffStrikes).where(
      and(eq(staffStrikes.tenantId, tenantId), eq(staffStrikes.userId, userId))
    );
  }

  async getStrikesByUserAndShift(userId: number, shiftId: number): Promise<StaffStrike[]> {
    return await database.select().from(staffStrikes).where(
      and(eq(staffStrikes.userId, userId), eq(staffStrikes.shiftId, shiftId))
    );
  }

  async getTotalStrikePoints(tenantId: string, userId: number): Promise<number> {
    const strikes = await database.select().from(staffStrikes).where(
      and(
        eq(staffStrikes.tenantId, tenantId), 
        eq(staffStrikes.userId, userId),
        eq(staffStrikes.isActive, true)
      )
    );
    return strikes.reduce((total, strike) => total + strike.points, 0);
  }

  async createStaffStrike(insertStrike: InsertStaffStrike): Promise<StaffStrike> {
    const result = await database.insert(staffStrikes).values(insertStrike).returning();
    return result[0];
  }

  async updateStaffStrike(id: number, insertStrike: InsertStaffStrike): Promise<StaffStrike | undefined> {
    const result = await database.update(staffStrikes).set(insertStrike).where(eq(staffStrikes.id, id)).returning();
    return result[0];
  }

  async deleteStaffStrike(id: number): Promise<boolean> {
    const result = await database.delete(staffStrikes).where(eq(staffStrikes.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async resetExpiredStrikes(tenantId: string): Promise<number> {
    // Get current date
    const now = new Date();
    
    // Deactivate expired strikes based on expiresAt date
    const result = await database
      .update(staffStrikes)
      .set({ isActive: false })
      .where(
        and(
          eq(staffStrikes.tenantId, tenantId),
          eq(staffStrikes.isActive, true),
          // Only reset strikes that have expired
          database.sql`expires_at < ${now.toISOString()}`
        )
      );
    
    return result.rowCount || 0;
  }

  async clearAllData(): Promise<void> {
    await database.delete(holidayRequests);
    await database.delete(assignments);
    await database.delete(swapRequests);
    await database.delete(opportunities);
    await database.delete(shifts);
    await database.delete(scheduleTemplates);
    await database.delete(operatingHours);
    await database.delete(departments);
    await database.delete(locations);
    await database.delete(jobRoles);
    await database.delete(businessProfiles);
    await database.delete(users);
  }

  // Helper method to get shifts by tenant and assignment type (for opportunities)
  async getShiftsByTenantAndType(tenantId: string, assignmentType: string): Promise<Shift[]> {
    return await database.select().from(shifts).where(
      and(
        eq(shifts.tenantId, tenantId),
        eq(shifts.assignmentType, assignmentType as any)
      )
    );
  }

  // Get shifts by user and status (for pending assignments)
  async getShiftsByUserAndStatus(tenantId: string, userId: number, status: string): Promise<Shift[]> {
    return await database.select().from(shifts).where(
      and(
        eq(shifts.tenantId, tenantId),
        eq(shifts.assignedTo, userId),
        eq(shifts.status, status as any)
      )
    );
  }

  // Get assignment tracking data for owners
  async getAssignmentTrackingData(tenantId: string): Promise<any[]> {
    const result = await database
      .select({
        shift: shifts,
        staffFirstName: users.firstName,
        staffLastName: users.lastName,
        staffEmail: users.email,
      })
      .from(shifts)
      .leftJoin(users, eq(shifts.assignedTo, users.id))
      .where(
        and(
          eq(shifts.tenantId, tenantId),
          // Only assigned shifts that need tracking
          database.sql`${shifts.status} IN ('assigned', 'confirmed', 'declined')`
        )
      );

    return result.map(row => ({
      ...row.shift,
      staffName: row.staffFirstName && row.staffLastName 
        ? `${row.staffFirstName} ${row.staffLastName}` 
        : 'Unassigned',
      staffEmail: row.staffEmail,
    }));
  }

  // Mailing list operations
  async addToMailingList(email: string, source: string = "landing_page"): Promise<MailingList> {
    const result = await database.insert(mailingList).values({ email, source }).returning();
    return result[0];
  }

  async getMailingListByEmail(email: string): Promise<MailingList | undefined> {
    const result = await database.select().from(mailingList).where(eq(mailingList.email, email)).limit(1);
    return result[0];
  }

  // Email change token operations
  async createEmailChangeToken(token: InsertEmailChangeToken): Promise<EmailChangeToken> {
    const [newToken] = await database.insert(emailChangeTokens).values(token).returning();
    return newToken;
  }

  async getEmailChangeToken(token: string): Promise<EmailChangeToken | undefined> {
    const [foundToken] = await database.select().from(emailChangeTokens).where(eq(emailChangeTokens.token, token));
    return foundToken;
  }

  async deleteEmailChangeToken(token: string): Promise<void> {
    await database.delete(emailChangeTokens).where(eq(emailChangeTokens.token, token));
  }

  async cleanupExpiredEmailTokens(): Promise<void> {
    const now = new Date();
    await database.delete(emailChangeTokens).where(lt(emailChangeTokens.expiresAt, now));
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
export const storage = new DatabaseStorage();

// Initialize database with sample data
initializeDatabaseWithSampleData().then(() => {
  console.log("Database storage initialized successfully");
}).catch((error) => {
  console.error("Failed to initialize database storage:", error);
});
