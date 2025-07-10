import { apiRequest } from "@/lib/queryClient";

export interface ShiftCoverageData {
  active: number;
  upcoming: number;
  unfilled: number;
  underUtilized: number;
  details: Array<{
    date: string;
    shifts: number;
    filled: number;
    understaffed: boolean;
  }>;
}

export interface StrikesSummaryData {
  totalPoints: number;
  maxStrikePoints: number;
  staffWithStrikes: number;
  totalStaff: number;
  recentStrikes: Array<{
    userId: number;
    userName: string;
    reason: string;
    points: number;
    issuedAt: string;
  }>;
}

export interface LiveTimeEntry {
  userId: number;
  userName: string;
  status: "clocked_in" | "on_break" | "clocked_out" | "overdue";
  currentShift?: {
    startTime: string;
    endTime: string;
    role: string;
    location: string;
  };
  lastActivity: string;
}

export interface PendingRequest {
  id: number;
  type: "holiday" | "sick" | "emergency" | "personal";
  requesterName: string;
  startDate: string;
  endDate: string;
  priority: "low" | "normal" | "high" | "urgent";
  requestedAt: string;
}

export interface EscalationItem {
  id: number;
  type: "swap_request" | "cancellation" | "no_show" | "coverage_gap";
  description: string;
  affectedShifts: number;
  urgency: "low" | "medium" | "high" | "critical";
  createdAt: string;
}

export const dashboardApi = {
  /**
   * Get shift coverage data for live monitoring
   */
  async getShiftCoverage(params: { tenantId: string }): Promise<ShiftCoverageData> {
    console.log("📊 FETCH_SHIFT_COVERAGE", { tenantId: params.tenantId, timestamp: new Date() });
    
    try {
      const response = await apiRequest("GET", `/api/dashboard/shift-coverage?tenantId=${params.tenantId}`);
      const data = await response.json();
      
      console.log("✅ SHIFT_COVERAGE_SUCCESS", { 
        tenantId: params.tenantId,
        active: data.active,
        unfilled: data.unfilled,
        timestamp: new Date() 
      });
      
      return data;
    } catch (error) {
      console.error("❌ SHIFT_COVERAGE_FAILED", { tenantId: params.tenantId, error, timestamp: new Date() });
      throw new Error("Failed to fetch shift coverage data");
    }
  },

  /**
   * Get strikes summary for alert monitoring
   */
  async getStrikesSummary(tenantId: string): Promise<StrikesSummaryData> {
    console.log("🚨 FETCH_STRIKES_SUMMARY", { tenantId, timestamp: new Date() });
    
    try {
      const response = await apiRequest("GET", `/api/dashboard/strikes-summary?tenantId=${tenantId}`);
      const data = await response.json();
      
      console.log("✅ STRIKES_SUMMARY_SUCCESS", { 
        tenantId,
        totalPoints: data.totalPoints,
        staffWithStrikes: data.staffWithStrikes,
        timestamp: new Date() 
      });
      
      return data;
    } catch (error) {
      console.error("❌ STRIKES_SUMMARY_FAILED", { tenantId, error, timestamp: new Date() });
      throw new Error("Failed to fetch strikes summary");
    }
  },

  /**
   * Get live time entries for staff monitoring
   */
  async getLiveTimeEntries(tenantId: string): Promise<LiveTimeEntry[]> {
    console.log("⏰ FETCH_LIVE_TIME_ENTRIES", { tenantId, timestamp: new Date() });
    
    try {
      const response = await apiRequest("GET", `/api/dashboard/live-time-entries?tenantId=${tenantId}`);
      const data = await response.json();
      
      console.log("✅ LIVE_TIME_ENTRIES_SUCCESS", { 
        tenantId,
        activeEntries: data.length,
        timestamp: new Date() 
      });
      
      return data;
    } catch (error) {
      console.error("❌ LIVE_TIME_ENTRIES_FAILED", { tenantId, error, timestamp: new Date() });
      throw new Error("Failed to fetch live time entries");
    }
  },

  /**
   * Get pending holiday requests for queue monitoring
   */
  async getPendingHolidayRequests(tenantId: string): Promise<PendingRequest[]> {
    console.log("📋 FETCH_PENDING_REQUESTS", { tenantId, timestamp: new Date() });
    
    try {
      const response = await apiRequest("GET", `/api/dashboard/pending-requests?tenantId=${tenantId}`);
      const data = await response.json();
      
      console.log("✅ PENDING_REQUESTS_SUCCESS", { 
        tenantId,
        pendingCount: data.length,
        timestamp: new Date() 
      });
      
      return data;
    } catch (error) {
      console.error("❌ PENDING_REQUESTS_FAILED", { tenantId, error, timestamp: new Date() });
      throw new Error("Failed to fetch pending requests");
    }
  },

  /**
   * Get escalations for urgent action monitoring
   */
  async getEscalations(tenantId: string): Promise<EscalationItem[]> {
    console.log("🚨 FETCH_ESCALATIONS", { tenantId, timestamp: new Date() });
    
    try {
      const response = await apiRequest("GET", `/api/dashboard/escalations?tenantId=${tenantId}`);
      const data = await response.json();
      
      console.log("✅ ESCALATIONS_SUCCESS", { 
        tenantId,
        escalationCount: data.length,
        criticalCount: data.filter((e: EscalationItem) => e.urgency === 'critical').length,
        timestamp: new Date() 
      });
      
      return data;
    } catch (error) {
      console.error("❌ ESCALATIONS_FAILED", { tenantId, error, timestamp: new Date() });
      throw new Error("Failed to fetch escalations");
    }
  }
};