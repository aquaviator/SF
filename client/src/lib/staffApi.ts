import { apiRequest } from "@/lib/queryClient";
import type { StaffStrike, InsertStaffStrike } from "@shared/schema";

export interface StrikeData {
  totalPoints: number;
  strikes: StaffStrike[];
}
export interface CreateStrikeRequest {
  tenantId: string;
  userId: number;
  reason: "no_show" | "late_cancellation" | "manual_adjustment";
  points: number;
  shiftId?: number;
  notes?: string;
  expiresAt?: string;
export interface UpdateStrikeRequest {
  isActive?: boolean;
export interface StaffStrikesListResponse {
  strikes: Array<{
    id: number;
    userId: number;
    userFirstName: string;
    userLastName: string;
    totalPoints: number;
    activeStrikes: number;
    lastIssued: string | null;
  }>;
export const staffApi = {
  /**
   * Get strikes for a specific user
   */
  async getStrikes(userId: number, tenantId: string): Promise<StrikeData> {
    console.log("📡 GET_STRIKES API", { userId, tenantId, timestamp: new Date() });
    
    try {
      const response = await apiRequest("GET", `/api/staff/${userId}/strikes?tenantId=${tenantId}`);
      const data = await response.json();
      
      console.log("✅ GET_STRIKES SUCCESS", { 
        userId,
        totalPoints: data.totalPoints,
        strikeCount: data.strikes.length,
        timestamp: new Date() 
      });
      return data;
    } catch (error) {
      console.error("❌ GET_STRIKES FAILED", { userId, tenantId, error, timestamp: new Date() });
      throw new Error("Failed to fetch strike data");
    }
  },
   * Get all staff strikes for owner view
  async getAllStaffStrikes(tenantId: string): Promise<StaffStrikesListResponse> {
    console.log("📡 GET_ALL_STAFF_STRIKES API", { tenantId, timestamp: new Date() });
      const response = await apiRequest("GET", `/api/staff/strikes/all?tenantId=${tenantId}`);
      console.log("✅ GET_ALL_STAFF_STRIKES SUCCESS", { 
        tenantId,
        strikeCount: data.strikes?.length || 0,
      console.error("❌ GET_ALL_STAFF_STRIKES FAILED", { tenantId, error, timestamp: new Date() });
      throw new Error("Failed to fetch staff strikes data");
   * Create a new strike
  async createStrike(request: CreateStrikeRequest): Promise<StaffStrike> {
    console.log("📡 CREATE_STRIKE API", { 
      userId: request.userId, 
      reason: request.reason,
      points: request.points,
      timestamp: new Date() 
    });
      const response = await apiRequest("POST", `/api/staff/${request.userId}/strikes`, request);
      console.log("✅ CREATE_STRIKE SUCCESS", { 
        userId: request.userId,
        strikeId: response.id,
        points: request.points,
      return response;
      console.error("❌ CREATE_STRIKE FAILED", { 
        userId: request.userId, 
        reason: request.reason,
        error, 
      throw new Error("Failed to create strike");
   * Update an existing strike
  async updateStrike(userId: number, strikeId: number, updates: UpdateStrikeRequest): Promise<StaffStrike> {
    console.log("📡 UPDATE_STRIKE API", { 
      userId, 
      strikeId, 
      updates,
      const response = await apiRequest("PUT", `/api/staff/${userId}/strikes/${strikeId}`, updates);
      console.log("✅ UPDATE_STRIKE SUCCESS", { 
        strikeId,
        isActive: updates.isActive,
      console.error("❌ UPDATE_STRIKE FAILED", { 
        userId, 
        strikeId, 
        updates,
      throw new Error("Failed to update strike");
   * Deactivate a strike (convenience method)
  async deactivateStrike(userId: number, strikeId: number): Promise<StaffStrike> {
    console.log("📡 DEACTIVATE_STRIKE API", { userId, strikeId, timestamp: new Date() });
    return this.updateStrike(userId, strikeId, { isActive: false });
   * Check if user can claim shifts (strike validation)
  async canClaimShift(userId: number, tenantId: string): Promise<{ canClaim: boolean; reason?: string }> {
    console.log("📡 CAN_CLAIM_SHIFT API", { userId, tenantId, timestamp: new Date() });
      const response = await apiRequest("GET", `/api/staff/${userId}/can-claim?tenantId=${tenantId}`);
      console.log("✅ CAN_CLAIM_SHIFT SUCCESS", { 
        canClaim: data.canClaim,
        reason: data.reason,
      console.error("❌ CAN_CLAIM_SHIFT FAILED", { userId, tenantId, error, timestamp: new Date() });
      throw new Error("Failed to check shift claim eligibility");
   * Request a shift swap
  async requestSwap(shiftId: number): Promise<any> {
    console.log("📡 REQUEST_SWAP API", { shiftId, timestamp: new Date() });
      const response = await apiRequest("POST", `/api/swap-requests`, {
        originalShiftId: shiftId.toString(), // Convert to string for backend validation
        targetShiftId: "", // Empty string instead of null
        reason: "Staff requested swap via My Shifts"
      console.log("✅ REQUEST_SWAP SUCCESS", { 
        shiftId,
        swapRequestId: data.id,
      console.error("❌ REQUEST_SWAP FAILED", { shiftId, error, timestamp: new Date() });
      throw new Error("Failed to request shift swap");
   * Request shift cancellation
  async requestCancel(shiftId: number): Promise<any> {
    console.log("📡 REQUEST_CANCEL API", { shiftId, timestamp: new Date() });
      // Get current shift data first to preserve required fields
      const getResponse = await apiRequest("GET", `/api/shifts/${shiftId}`);
      const currentShift = await getResponse.json();
      const response = await apiRequest("PUT", `/api/shifts/${shiftId}`, {
        ...currentShift,
        status: "cancelled",
        notes: "Staff requested cancellation via My Shifts"
      console.log("✅ REQUEST_CANCEL SUCCESS", { 
        newStatus: data.status,
      console.error("❌ REQUEST_CANCEL FAILED", { shiftId, error, timestamp: new Date() });
      throw new Error("Failed to request shift cancellation");
  }
};
