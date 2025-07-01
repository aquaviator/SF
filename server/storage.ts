import { users, shifts, opportunities, swapRequests, type User, type InsertUser, type Shift, type InsertShift, type Opportunity, type InsertOpportunity, type SwapRequest, type InsertSwapRequest } from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private shifts: Map<number, Shift>;
  private opportunities: Map<number, Opportunity>;
  private swapRequests: Map<number, SwapRequest>;
  private currentUserId: number;
  private currentShiftId: number;
  private currentOpportunityId: number;
  private currentSwapRequestId: number;

  constructor() {
    this.users = new Map();
    this.shifts = new Map();
    this.opportunities = new Map();
    this.swapRequests = new Map();
    this.currentUserId = 1;
    this.currentShiftId = 1;
    this.currentOpportunityId = 1;
    this.currentSwapRequestId = 1;

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
        assignedTo: 2,
        status: "confirmed",
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
        assignedTo: null,
        status: "open",
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
        assignedTo: 3,
        status: "conflict",
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
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, insertUser: InsertUser): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser: User = { ...insertUser, id };
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
    const shift: Shift = { ...insertShift, id };
    this.shifts.set(id, shift);
    return shift;
  }

  async updateShift(id: number, insertShift: InsertShift): Promise<Shift | undefined> {
    const existingShift = this.shifts.get(id);
    if (!existingShift) return undefined;
    
    const updatedShift: Shift = { ...insertShift, id };
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
    const opportunity: Opportunity = { ...insertOpportunity, id };
    this.opportunities.set(id, opportunity);
    return opportunity;
  }

  async updateOpportunity(id: number, insertOpportunity: InsertOpportunity): Promise<Opportunity | undefined> {
    const existingOpportunity = this.opportunities.get(id);
    if (!existingOpportunity) return undefined;
    
    const updatedOpportunity: Opportunity = { ...insertOpportunity, id };
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
    const swapRequest: SwapRequest = { ...insertSwapRequest, id };
    this.swapRequests.set(id, swapRequest);
    return swapRequest;
  }

  async updateSwapRequest(id: number, insertSwapRequest: InsertSwapRequest): Promise<SwapRequest | undefined> {
    const existingSwapRequest = this.swapRequests.get(id);
    if (!existingSwapRequest) return undefined;
    
    const updatedSwapRequest: SwapRequest = { ...insertSwapRequest, id };
    this.swapRequests.set(id, updatedSwapRequest);
    return updatedSwapRequest;
  }

  async deleteSwapRequest(id: number): Promise<boolean> {
    return this.swapRequests.delete(id);
  }
}

export const storage = new MemStorage();
