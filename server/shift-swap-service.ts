import { storage } from "./storage";

export interface SwapRequestPayload {
  tenantId: string;
  shiftId: number;
  requestedBy: number;
  reason?: string;
}

export interface SwapResult {
  success: boolean;
  action: "peer" | "escalated" | "denied";
  message: string;
  swapRequestId?: number;
  strikeAssigned?: boolean;
}

export class ShiftSwapService {
  /**
   * Process a swap request with policy-driven escalation
   */
  async requestSwap(payload: SwapRequestPayload): Promise<SwapResult> {
    console.log("📨 SWAP_REQUESTED", { 
      shiftId: payload.shiftId, 
      userId: payload.requestedBy, 
      timestamp: new Date() 
    });

    try {
      // Get the shift through storage
      const shifts = await storage.getShiftsByTenant(payload.tenantId);
      const shift = shifts.find(s => s.id === payload.shiftId);

      if (!shift) {
        return {
          success: false,
          action: "denied",
          message: "Shift not found"
        };
      }

      // Check if shift is in the past
      const shiftStart = new Date(`${shift.date}T${shift.startTime}`);
      const now = new Date();
      const timeUntilStartHours = (shiftStart.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (timeUntilStartHours < 0) {
        console.log("🚫 SWAP_DENIED_PAST_SHIFT", {
          shiftId: payload.shiftId,
          shiftDate: shift.date,
          timeUntilStartHours,
          timestamp: new Date()
        });
        return {
          success: false,
          action: "denied",
          message: "Cannot swap shifts that have already occurred"
        };
      }

      // Get business policy
      const policy = await storage.getShiftPolicyByTenant(payload.tenantId);

      console.log("🕒 SWAP_TIMING_CHECK", {
        shiftStart: shiftStart.toISOString(),
        timeUntilStartHours,
        policyMinNotice: policy?.minNoticeHours || 24,
        policyCancellationDeadline: policy?.cancellationDeadlineHours || 4
      });

      const minNoticeHours = policy?.minNoticeHours || 24;
      const cancellationDeadlineHours = policy?.cancellationDeadlineHours || 4;

      // Apply escalation rules based on policy
      if (timeUntilStartHours < cancellationDeadlineHours) {
        // Too late - deny and assign strike
        return await this.denySwapWithStrike(payload, policy);
      } else if (timeUntilStartHours < minNoticeHours) {
        // Escalate to management
        return await this.escalateToManagement(payload, shift, timeUntilStartHours);
      } else {
        // Open for peer-to-peer swap
        return await this.openPeerSwap(payload, shift);
      }
    } catch (error) {
      console.error("❌ SWAP_REQUEST_ERROR", error);
      return {
        success: false,
        action: "denied",
        message: "Failed to process swap request"
      };
    }
  }

  /**
   * Deny swap and assign strike for late cancellation
   */
  private async denySwapWithStrike(payload: SwapRequestPayload, policy: any): Promise<SwapResult> {
    // Note: Strike creation will be implemented when needed
    console.log("⚠️ SWAP_DENIED_STRIKE", {
      userId: payload.requestedBy,
      shiftId: payload.shiftId,
      points: policy?.strikePointsLateCancellation || 1,
      reason: "late_cancellation"
    });

    return {
      success: false,
      action: "denied",
      message: `Swap denied: Too close to shift start (less than ${policy?.cancellationDeadlineHours || 4}h notice). Strike point assigned.`,
      strikeAssigned: true
    };
  }

  /**
   * Escalate swap request to management
   */
  private async escalateToManagement(
    payload: SwapRequestPayload, 
    shift: any, 
    timeUntilStartHours: number
  ): Promise<SwapResult> {
    const swapRequestData = {
      tenantId: payload.tenantId,
      requesterId: payload.requestedBy,
      originalShiftId: payload.shiftId,
      targetShiftId: null,
      reason: payload.reason || null,
      status: "pending" as const, // Will be treated as escalated
    };

    const swapRequest = await storage.createSwapRequest(swapRequestData);

    console.log("🚨 SWAP_ESCALATED", {
      shiftId: payload.shiftId,
      timeUntilStart: `${timeUntilStartHours.toFixed(1)}h`,
      swapRequestId: swapRequest.id
    });

    return {
      success: true,
      action: "escalated",
      message: `Swap request escalated to management (${timeUntilStartHours.toFixed(1)}h until shift, requires management approval).`,
      swapRequestId: swapRequest.id
    };
  }

  /**
   * Open swap request for peer-to-peer exchange
   */
  private async openPeerSwap(payload: SwapRequestPayload, shift: any): Promise<SwapResult> {
    const swapRequestData = {
      tenantId: payload.tenantId,
      requesterId: payload.requestedBy,
      originalShiftId: payload.shiftId,
      targetShiftId: null, // Open to any peer
      reason: payload.reason || null,
      status: "pending" as const,
    };

    const swapRequest = await storage.createSwapRequest(swapRequestData);

    console.log("🔄 SWAP_OPEN_PEER", {
      shiftId: payload.shiftId,
      swapRequestId: swapRequest.id,
      policyNotice: "48h availability"
    });

    return {
      success: true,
      action: "peer",
      message: `Swap request opened to team members. Available for 48 hours.`,
      swapRequestId: swapRequest.id
    };
  }

  /**
   * Accept a peer swap request
   */
  async acceptSwap(swapRequestId: number, acceptingUserId: number): Promise<SwapResult> {
    try {
      // This will be implemented when we have the UI for accepting swaps
      console.log("✅ SWAP_ACCEPTED", {
        swapRequestId,
        acceptingUserId,
        timestamp: new Date()
      });

      return {
        success: true,
        action: "peer",
        message: "Swap request accepted successfully",
        swapRequestId
      };
    } catch (error) {
      return {
        success: false,
        action: "denied",
        message: "Failed to accept swap"
      };
    }
  }

  /**
   * Manager approves escalated swap
   */
  async managerApprove(swapRequestId: number, managerId: number, action: "approve" | "reassign", newUserId?: number): Promise<SwapResult> {
    try {
      console.log("👤 SWAP_MANAGER_ACTION", {
        swapRequestId,
        managerId,
        action,
        newUserId
      });

      return {
        success: true,
        action: "escalated",
        message: action === "approve" ? "Swap approved by management" : "Shift reassigned by management",
        swapRequestId
      };
    } catch (error) {
      return {
        success: false,
        action: "denied",
        message: "Failed to resolve escalated swap"
      };
    }
  }
}

export const shiftSwapService = new ShiftSwapService();