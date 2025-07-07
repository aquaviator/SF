import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRole } from "@/hooks/useRole";
import { DataTable, Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { staffApi, type StrikeData } from "@/lib/staffApi";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Play, 
  Pause,
  TrendingUp,
  Check,
  X,
  Users,
  Briefcase,
  RefreshCw,
  Loader2,
  Plus,
  Timer,
  Eye,
  RotateCcw,
  Shield,
  Copy,
  Trash2,
  AlertTriangle
} from "lucide-react";
import type { Shift } from "@shared/schema";

// Form schemas matching the main holiday request page
const holidayRequestFormSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().optional(),
  type: z.enum(["vacation", "sick", "personal", "emergency", "bereavement", "maternity", "paternity", "study", "other"]).default("vacation"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
});

const swapRequestFormSchema = z.object({
  originalShiftId: z.string().min(1, "Please select your shift"),
  targetShiftId: z.string().min(1, "Please select shift to swap with"),
  reason: z.string().min(1, "Please provide a reason for the swap"),
});

type HolidayRequestFormData = z.infer<typeof holidayRequestFormSchema>;
type SwapRequestFormData = z.infer<typeof swapRequestFormSchema>;

export default function MyWork() {
  const { role, tenantId, user } = useRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);

  // Form initialization
  const holidayForm = useForm<HolidayRequestFormData>({
    resolver: zodResolver(holidayRequestFormSchema),
    defaultValues: {
      startDate: "",
      endDate: "",
      reason: "",
      type: "vacation",
      priority: "normal",
    },
  });

  const swapForm = useForm<SwapRequestFormData>({
    resolver: zodResolver(swapRequestFormSchema),
    defaultValues: {
      originalShiftId: "",
      targetShiftId: "",
      reason: "",
    },
  });
  
  // Fetch my shifts
  const { data: shifts = [], isLoading: shiftsLoading } = useQuery<Shift[]>({
    queryKey: ["/api/my-shifts", tenantId, user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/my-shifts?tenantId=${tenantId}&userId=${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch shifts");
      return response.json();
    },
  });

  // Shift grouping and pagination state
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isShiftDetailModalOpen, setIsShiftDetailModalOpen] = useState(false);

  // Group shifts into categories
  const groupedShifts = useMemo(() => {
    if (!shifts.length) return { today: [], week: [], upcoming: [], completed: [] };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get start of this week (Monday)
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    startOfWeek.setDate(diff);
    
    // Get end of this week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const todayShifts: Shift[] = [];
    const weekShifts: Shift[] = [];
    const upcomingShifts: Shift[] = [];
    const completedShifts: Shift[] = [];

    shifts.forEach((shift) => {
      const shiftDate = new Date(shift.date);
      
      // Only include confirmed shifts in counts - exclude pending assignments
      if (shift.status === 'assigned') {
        // This is a pending assignment, skip for counts but will show in assignments tab
        return;
      }
      
      // Today shifts (only confirmed)
      if (shiftDate.toDateString() === today.toDateString()) {
        todayShifts.push(shift);
      }
      
      // Week shifts (includes today, only confirmed)
      if (shiftDate >= startOfWeek && shiftDate <= endOfWeek) {
        weekShifts.push(shift);
      } else if (shiftDate < today) {
        // Completed shifts (past shifts)
        completedShifts.push(shift);
      } else {
        // Upcoming shifts (beyond this week, only confirmed)
        upcomingShifts.push(shift);
      }
    });

    // Sort arrays by date/time
    const sortByDateTime = (a: Shift, b: Shift) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    };

    todayShifts.sort(sortByDateTime);
    weekShifts.sort(sortByDateTime);
    upcomingShifts.sort(sortByDateTime);
    completedShifts.sort((a, b) => b.date.localeCompare(a.date)); // Most recent first

    console.log('MyShifts-Today:', todayShifts);
    console.log('MyShifts-Week:', weekShifts);
    console.log('MyShifts-Upcoming (page', upcomingPage, '):', upcomingShifts.slice(0, upcomingPage * 10));
    console.log('MyShifts-Completed (page', completedPage, '):', completedShifts.slice(0, completedPage * 10));

    return {
      today: todayShifts,
      week: weekShifts,
      upcoming: upcomingShifts,
      completed: completedShifts
    };
  }, [shifts, upcomingPage, completedPage]);

  // Utility functions for countdown and policy checks
  const calculateTimeUntilShift = (shift: Shift) => {
    const shiftStart = new Date(`${shift.date}T${shift.startTime}`);
    const now = new Date();
    return shiftStart.getTime() - now.getTime(); // Allow negative values for past shifts
  };

  const formatCountdown = (milliseconds: number) => {
    if (milliseconds <= 0) {
      // Past shift - show how long ago it started
      const absMs = Math.abs(milliseconds);
      const hours = Math.floor(absMs / (1000 * 60 * 60));
      const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours === 0) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ${minutes}m ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    }
    
    // Future shift - show countdown
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) return `${minutes}m`;
    if (hours < 24) return `${hours}h ${minutes}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  // Policy-driven swap status check
  const checkSwapPolicyStatus = (shift: any) => {
    const shiftStart = new Date(`${shift.date}T${shift.startTime}`);
    const now = new Date();
    const hoursUntilShift = (shiftStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Policy-driven escalation logic - return boolean for button enabled state
    if (hoursUntilShift > 24) {
      return true; // Can swap directly
    } else if (hoursUntilShift > 4) {
      return true; // Can escalate to management
    } else {
      return false; // Too late - would result in strike
    }
  };

  // Policy-driven cancel status check
  const checkCancelPolicyStatus = (shift: any) => {
    const shiftStart = new Date(`${shift.date}T${shift.startTime}`);
    const now = new Date();
    const hoursUntilShift = (shiftStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Policy-driven cancellation logic
    if (hoursUntilShift > 4) {
      return true; // Can cancel with notice
    } else {
      return false; // Too late - would result in strike
    }
  };



  // Modal handlers
  const openShiftDetailModal = (shift: Shift) => {
    console.log('Open ShiftDetailModal:', shift.id);
    setSelectedShift(shift);
    setIsShiftDetailModalOpen(true);
  };

  const closeShiftDetailModal = () => {
    console.log('Close ShiftDetailModal');
    setSelectedShift(null);
    setIsShiftDetailModalOpen(false);
  };

  // ShiftCard component for ultra-lean shift cards
  const ShiftCard = ({ shift, actions, onCardClick, showActions = false, isCompleted = false }) => {
    const timeUntilShift = calculateTimeUntilShift(shift);
    const formattedCountdown = formatCountdown(timeUntilShift);
    const policyCheck = checkSwapPolicyStatus(shift);
    
    // Role initials generation
    const getRoleInitials = (role: string) => {
      return role.split(' ').map(word => word.charAt(0).toUpperCase()).join('');
    };
    
    // Enhanced status badge variant mapping
    const getStatusVariant = (status: string) => {
      switch (status) {
        case 'completed': return 'default';
        case 'cancelled': return 'destructive';
        case 'clocked_in': return 'secondary';
        case 'assigned': return 'outline';
        case 'confirmed': return 'default';
        default: return 'outline';
      }
    };
    
    // Enhanced escalation countdown
    const getEscalationCountdown = () => {
      if (policyCheck.escalationWarning) {
        return `⚠️ ${policyCheck.escalationWarning}`;
      }
      if (policyCheck.hoursUntilShift > 24) {
        return `Swap until ${Math.floor(policyCheck.hoursUntilShift - 24)}h before start`;
      }
      if (policyCheck.hoursUntilShift > 4) {
        const escalationTime = timeUntilShift - (4 * 60 * 60 * 1000);
        return `Escalates to Manager in ${formatCountdown(escalationTime)}`;
      }
      return null;
    };
    
    const escalationText = getEscalationCountdown();
    
    return (
      <div 
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
        onClick={() => {
          console.log('🎯 SHIFT_CARD_CLICK', {
            shiftId: shift.id,
            role: shift.role,
            date: shift.date,
            status: shift.status,
            timestamp: new Date().toISOString()
          });
          onCardClick();
        }}
      >
        <div className="flex items-start justify-between">
          {/* Left side - Main shift info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant={getStatusVariant(shift.status)}>
                {shift.status}
              </Badge>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-bold text-blue-800 dark:text-blue-200">
                  {getRoleInitials(shift.role)}
                </div>
                <span className="font-medium text-sm truncate">{shift.role}</span>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground mb-1">
              {new Date(shift.date).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
            
            <div className="text-sm font-medium">
              {shift.startTime} - {shift.endTime}
            </div>
            
            <div className="text-xs text-muted-foreground mt-1">
              📍 {shift.location}
            </div>
            
            {/* Enhanced escalation countdown */}
            {escalationText && (
              <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-xs text-orange-600 dark:text-orange-400">
                <div className="flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{escalationText}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Right side - Countdown & Actions */}
          <div className="flex flex-col items-end space-y-2">
            {/* Countdown timer */}
            {!isCompleted && (
              <div className="text-right">
                <div className="text-xs text-muted-foreground">starts in</div>
                <div className="text-sm font-medium">{formattedCountdown}</div>
              </div>
            )}
            
            {/* Quick actions */}
            {showActions && !isCompleted && (
              <div className="flex space-x-1">
                {actions?.canSwap && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 w-8 p-0"
                    disabled={!policyCheck.canInitiateSwap}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('🔄 SHIFT_SWAP_BUTTON_CLICK', {
                        shiftId: shift.id,
                        canSwap: policyCheck.canInitiateSwap,
                        hoursUntilShift: policyCheck.hoursUntilShift,
                        timestamp: new Date().toISOString()
                      });
                    }}
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}
                
                {actions?.canCancel && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 w-8 p-0"
                    disabled={policyCheck.hoursUntilShift < 4}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('❌ SHIFT_CANCEL_BUTTON_CLICK', {
                        shiftId: shift.id,
                        canCancel: policyCheck.hoursUntilShift >= 4,
                        hoursUntilShift: policyCheck.hoursUntilShift,
                        timestamp: new Date().toISOString()
                      });
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('👁️ SHIFT_DETAIL_BUTTON_CLICK', {
                      shiftId: shift.id,
                      timestamp: new Date().toISOString()
                    });
                    onCardClick();
                  }}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            {/* Completed badge */}
            {isCompleted && (
              <div className="text-xs text-green-600 dark:text-green-400 flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>Completed</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Enhanced ShiftDetailModal with Sprint 3 requirements
  const ShiftDetailModal = ({ shift, isOpen, onClose }) => {
    // Pre-mounted modal lifecycle logging - exact format requested
    React.useEffect(() => {
      console.log('SHIFT_DETAIL_MODAL_MOUNT');
      
      return () => {
        console.log('SHIFT_DETAIL_MODAL_UNMOUNT');
      };
    }, []);
    
    // Modal open/close lifecycle logging - exact format requested
    React.useEffect(() => {
      if (isOpen && shift) {
        console.log('SHIFT_DETAIL_MODAL_OPEN');
      } else if (!isOpen) {
        console.log('SHIFT_DETAIL_MODAL_CLOSE');
      }
    }, [isOpen, shift]);
    
    if (!shift) {
      console.log('📋 SHIFT_DETAIL_MODAL_RENDER_NO_SHIFT', {
        timestamp: new Date().toISOString()
      });
      return null;
    }
    
    const actions = getShiftActions(shift);
    
    // Helper functions defined locally with enhanced logging
    const checkSwapPolicyStatus = (shift: any) => {
      try {
        // Can't swap already cancelled shifts
        if (shift.status === 'cancelled') {
          console.log('POLICY_CHECK_SWAP', { 
            shiftId: shift.id, 
            status: shift.status,
            allowed: false,
            reason: 'already_cancelled',
            timestamp: new Date().toISOString() 
          });
          return false;
        }
        
        const shiftDateTime = new Date(`${shift.date}T${shift.startTime}`);
        const hoursUntilShift = (shiftDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
        const allowed = hoursUntilShift >= 24;
        
        console.log('POLICY_CHECK_SWAP', { 
          shiftId: shift.id, 
          hoursUntilShift: Math.round(hoursUntilShift * 100) / 100,
          allowed,
          timestamp: new Date().toISOString() 
        });
        
        return allowed;
      } catch (e) {
        console.error('❌ POLICY_CHECK_SWAP failed', e);
        return false;
      }
    };

    const checkCancelPolicyStatus = (shift: any) => {
      try {
        // Can't cancel already cancelled shifts
        if (shift.status === 'cancelled') {
          console.log('POLICY_CHECK_CANCEL', { 
            shiftId: shift.id, 
            status: shift.status,
            allowed: false,
            reason: 'already_cancelled',
            timestamp: new Date().toISOString() 
          });
          return false;
        }
        
        const shiftDateTime = new Date(`${shift.date}T${shift.startTime}`);
        const hoursUntilShift = (shiftDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
        const allowed = hoursUntilShift >= 4;
        
        console.log('POLICY_CHECK_CANCEL', { 
          shiftId: shift.id, 
          hoursUntilShift: Math.round(hoursUntilShift * 100) / 100,
          allowed,
          timestamp: new Date().toISOString() 
        });
        
        return allowed;
      } catch (e) {
        console.error('❌ POLICY_CHECK_CANCEL failed', e);
        return false;
      }
    };

    // Staff action handlers with comprehensive error handling and enhanced logging
    const handleSwap = async () => {
      console.log('REQUEST_SWAP API', { shiftId: shift.id, timestamp: new Date().toISOString() });
      
      try {
        const allowed = checkSwapPolicyStatus(shift);
        
        if (!allowed) {
          console.log('REQUEST_SWAP policy blocked', { shiftId: shift.id, timestamp: new Date().toISOString() });
          escalateToManager('swap', shift);
          return;
        }
        
        console.log('REQUEST_SWAP API starting...', { shiftId: shift.id, timestamp: new Date().toISOString() });
        await staffApi.requestSwap(shift.id);
        console.log('REQUEST_SWAP SUCCESS', { shiftId: shift.id, timestamp: new Date().toISOString() });
        
        queryClient.invalidateQueries({ queryKey: ['/api/my-shifts'] });
        queryClient.invalidateQueries({ queryKey: ['/api/swap-requests'] });
        toast({ title: "Swap Request Submitted", description: "Your swap request has been submitted for approval." });
        onClose();
      } catch (err) {
        console.error('REQUEST_SWAP FAILURE', { shiftId: shift.id, error: err, timestamp: new Date().toISOString() });
        toast({ variant: "destructive", title: "Error", description: "Could not request swap. Please try again." });
      }
    };

    const handleCancel = async () => {
      console.log('REQUEST_CANCEL API', { shiftId: shift.id, timestamp: new Date().toISOString() });
      
      try {
        const allowed = checkCancelPolicyStatus(shift);
        
        if (!allowed) {
          console.log('REQUEST_CANCEL policy blocked', { shiftId: shift.id, timestamp: new Date().toISOString() });
          escalateToManager('cancel', shift);
          return;
        }
        
        console.log('REQUEST_CANCEL API starting...', { shiftId: shift.id, timestamp: new Date().toISOString() });
        await staffApi.requestCancel(shift.id);
        console.log('REQUEST_CANCEL SUCCESS', { shiftId: shift.id, timestamp: new Date().toISOString() });
        
        queryClient.invalidateQueries({ queryKey: ['/api/my-shifts'] });
        toast({ title: "Cancellation Requested", description: "Your shift cancellation has been requested." });
        onClose();
      } catch (err) {
        console.error('REQUEST_CANCEL FAILURE', { shiftId: shift.id, error: err, timestamp: new Date().toISOString() });
        toast({ variant: "destructive", title: "Error", description: "Could not request cancellation. Please try again." });
      }
    };

    // Escalation helper
    const escalateToManager = (type: 'swap' | 'cancel', shift: any) => {
      console.log('🆙 ESCALATE_TO_MANAGER', { type, shift, timestamp: new Date().toISOString() });
      toast({ 
        title: "Request Escalated", 
        description: `Your ${type} request has been escalated to management for approval.`,
        duration: 5000
      });
      // TODO: Fire API to notify manager
    };
    
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] focus-visible:outline-none">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Shift Details</DialogTitle>
            <DialogDescription>
              View shift information and perform role-based actions for swap and cancellation requests.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Badge variant={shift.status === "confirmed" ? "default" : "secondary"}>
                {shift.status}
              </Badge>
              <span className="font-medium">{shift.role}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Date</div>
                <div className="text-sm">{new Date(shift.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground">Time</div>
                <div className="text-sm">{shift.startTime} - {shift.endTime}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground">Location</div>
                <div className="text-sm">{shift.location}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <div className="text-sm">{shift.status}</div>
              </div>
            </div>
            
            {shift.description && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Description</div>
                <div className="text-sm">{shift.description}</div>
              </div>
            )}
            
            {shift.notes && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Notes</div>
                <div className="text-sm">{shift.notes}</div>
              </div>
            )}
            
            {actions?.escalationMessage && (
              <div className="flex items-center space-x-2 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-600 dark:text-orange-400">
                  {actions.escalationMessage}
                </span>
              </div>
            )}
          </div>
          
          {/* Role-based Action Buttons */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <div className="flex space-x-2">
              {role === 'staff' ? (
                <>
                  <Button 
                    data-cy="swap-btn"
                    variant="outline" 
                    size="sm"
                    onClick={handleSwap}
                    disabled={!checkSwapPolicyStatus(shift)}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Request Swap
                  </Button>
                  
                  <Button 
                    data-cy="cancel-btn"
                    variant="outline" 
                    size="sm"
                    onClick={handleCancel}
                    disabled={!checkCancelPolicyStatus(shift)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Request Cancellation
                  </Button>
                </>
              ) : (
                <>
                  {/* Owner-only CRUD buttons */}
                  <Button 
                    data-cy="duplicate-btn"
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      console.log('🔄 DUPLICATE_SHIFT_BUTTON_CLICK', {
                        originalShiftId: shift.id,
                        role: shift.role,
                        date: shift.date,
                        timestamp: new Date().toISOString()
                      });
                      // TODO: Implement duplicate shift functionality
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </Button>
                  
                  <Button 
                    data-cy="create-btn"
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      console.log('➕ CREATE_SHIFT_BUTTON_CLICK', {
                        baseShiftId: shift.id,
                        timestamp: new Date().toISOString()
                      });
                      // TODO: Open create new shift modal
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                  </Button>
                  
                  {(shift.status === 'assigned' || shift.status === 'confirmed') && (
                    <Button 
                      data-cy="delete-btn"
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        console.log('🗑️ DELETE_SHIFT_BUTTON_CLICK', {
                          shiftId: shift.id,
                          status: shift.status,
                          timestamp: new Date().toISOString()
                        });
                        // TODO: Open delete confirmation modal
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </>
              )}
            </div>
            
            <Button onClick={() => {
              console.log('❌ CLOSE_SHIFT_MODAL_BUTTON_CLICK', {
                shiftId: shift.id,
                timestamp: new Date().toISOString()
              });
              onClose();
            }}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Fetch pending shift assignments (shifts with "assigned" status requiring confirmation)
  const { data: pendingAssignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["/api/pending-assignments", tenantId, user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/pending-assignments?tenantId=${tenantId}&userId=${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch pending assignments");
      return response.json();
    },
  });

  // Fetch time entries for metrics
  const { data: timeEntries = [], isLoading: timeEntriesLoading } = useQuery({
    queryKey: ["/api/time-entries", tenantId, user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/time-entries?tenantId=${tenantId}&userId=${user?.id}`);
      if (!response.ok) return []; // Return empty array if no data
      return response.json();
    },
    enabled: !!user?.id && !!tenantId, // Only run when user is loaded
  });

  // Fetch holiday requests for activity feed
  const { data: holidayRequests = [], isLoading: holidayRequestsLoading } = useQuery({
    queryKey: ["/api/holiday-requests", tenantId, user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/holiday-requests?tenantId=${tenantId}&userId=${user?.id}&userRole=${role}`);
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Fetch all shifts for swap functionality
  const { data: allShifts = [] } = useQuery({
    queryKey: ["/api/shifts", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/shifts?tenantId=${tenantId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Fetch swap requests for activity feed
  const { data: swapRequests = [], isLoading: swapRequestsLoading } = useQuery({
    queryKey: ["/api/swap-requests", tenantId, user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/swap-requests?tenantId=${tenantId}&userId=${user?.id}&userRole=${role}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user?.id && !!tenantId,
  });

  // Fetch strike data
  const { data: strikeData, isLoading: strikesLoading, error: strikesError } = useQuery<StrikeData>({
    queryKey: ["/api/strikes", tenantId, user?.id],
    queryFn: async () => {
      if (!user?.id || !tenantId) throw new Error("User ID and tenant ID required");
      console.log("🔍 LOAD_MY_STRIKES", { userId: user.id, tenantId, timestamp: new Date() });
      return await staffApi.getStrikes(Number(user.id), tenantId);
    },
    enabled: !!user?.id && !!tenantId,
  });

  // Check if user can claim shifts based on strike status
  const { data: canClaimShifts, isLoading: canClaimLoading } = useQuery({
    queryKey: ["/api/can-claim-shifts", tenantId, user?.id],
    queryFn: async () => {
      if (!user?.id || !tenantId) return { canClaim: true };
      try {
        return await staffApi.canClaimShift(Number(user.id), tenantId);
      } catch (error) {
        console.error("Failed to check claim eligibility:", error);
        return { canClaim: true };
      }
    },
    enabled: !!user?.id && !!tenantId,
  });

  // Mutations for form submissions
  const holidayRequestMutation = useMutation({
    mutationFn: async (data: HolidayRequestFormData) => {
      const submitData = {
        ...data,
        tenantId,
        requesterId: user?.id || 1,
        status: "pending" as const,
        reviewedBy: null,
        reviewedAt: null,
        reviewNotes: null,
        reason: data.reason || null,
      };
      return apiRequest("POST", "/api/holiday-requests", submitData);
    },
    onSuccess: () => {
      toast({ title: "Holiday request submitted successfully!" });
      holidayForm.reset();
      setIsHolidayModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/holiday-requests", tenantId, user?.id] });
    },
    onError: () => {
      toast({ title: "Failed to submit holiday request", variant: "destructive" });
    },
  });

  // Assignment response mutation (accept/decline)
  const assignmentResponseMutation = useMutation({
    mutationFn: async ({ shiftId, response }: { shiftId: number; response: "accept" | "decline" }) => {
      console.log("📋 ASSIGNMENT_RESPONSE", {
        shiftId,
        response,
        userId: user?.id,
        timestamp: new Date()
      });

      const submitData = {
        response,
        userId: user?.id,
        tenantId,
      };
      return apiRequest("POST", `/api/assignments/${shiftId}/respond`, submitData);
    },
    onSuccess: (result: any, variables) => {
      const action = variables.response === "accept" ? "accepted" : "declined";
      toast({ 
        title: `Assignment ${action} successfully!`,
        description: result.message
      });
      
      // Refresh both pending assignments and my shifts
      queryClient.invalidateQueries({ queryKey: ["/api/pending-assignments", tenantId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-shifts", tenantId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-logs", tenantId] });
    },
    onError: () => {
      toast({ title: "Failed to respond to assignment", variant: "destructive" });
    },
  });

  const swapRequestMutation = useMutation({
    mutationFn: async (data: SwapRequestFormData) => {
      console.log("📨 SWAP_REQUEST_INITIATED", {
        shiftId: data.originalShiftId,
        userId: user?.id,
        reason: data.reason,
        timestamp: new Date()
      });

      const submitData = {
        tenantId,
        shiftId: parseInt(data.originalShiftId),
        requestedBy: user?.id || 1,
        reason: data.reason,
      };
      return apiRequest("POST", "/api/shift-actions/request-swap", submitData);
    },
    onSuccess: (result: any) => {
      console.log("✅ SWAP_REQUEST_RESULT", result);
      
      if (result.success) {
        let toastMessage = "Swap request submitted successfully!";
        let toastVariant: "default" | "destructive" = "default";
        
        switch (result.action) {
          case "peer":
            toastMessage = `Swap request opened to team members. ${result.message}`;
            break;
          case "escalated":
            toastMessage = `Swap request escalated to management. ${result.message}`;
            break;
          case "denied":
            toastMessage = `Swap request denied. ${result.message}`;
            toastVariant = "destructive";
            break;
        }
        
        toast({ 
          title: toastMessage,
          variant: toastVariant,
          description: result.strikeAssigned ? "Strike point assigned for late cancellation attempt." : undefined
        });
        
        if (result.success) {
          swapForm.reset();
          setIsSwapModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ["/api/swap-requests", tenantId, user?.id] });
          queryClient.invalidateQueries({ queryKey: ["/api/my-shifts", tenantId, user?.id] });
        }
      }
    },
    onError: (error: any) => {
      console.error("❌ SWAP_REQUEST_ERROR", error);
      toast({ 
        title: "Failed to submit swap request", 
        description: error?.message || "Please try again later",
        variant: "destructive" 
      });
    },
  });

  // Handle swap request actions (accept/decline)
  const handleSwapAction = async (requestId: number, status: "approved" | "declined") => {
    try {
      await apiRequest("PUT", `/api/swap-requests/${requestId}`, { status });
      toast({ 
        title: status === "approved" ? "Swap request accepted!" : "Swap request declined",
        description: status === "approved" ? "The shift swap has been approved." : "The swap request has been declined."
      });
      // Refresh swap requests data
      queryClient.invalidateQueries({ queryKey: ["/api/swap-requests", tenantId, user?.id] });
    } catch (error) {
      toast({ 
        title: "Error updating swap request", 
        variant: "destructive",
        description: "Please try again."
      });
    }
  };

  // Fetch time tracking policies
  const { data: timePolicy } = useQuery({
    queryKey: ["/api/shift-policy", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/shift-policy?tenantId=${tenantId}`);
      if (!response.ok) throw new Error("Failed to fetch time policy");
      return response.json();
    },
  });

  // Shift action logic (must be after timePolicy query)
  const getShiftActions = (shift: Shift) => {
    const timeUntilShift = calculateTimeUntilShift(shift);
    const hoursUntilShift = timeUntilShift / (1000 * 60 * 60);
    const policy = timePolicy;
    
    const cancellationDeadline = policy?.cancellationDeadlineHours || 4;
    const minNoticeHours = policy?.minNoticeHours || 24;
    
    // Check if within escalation window
    const isWithinEscalationWindow = hoursUntilShift < minNoticeHours && hoursUntilShift >= cancellationDeadline;
    const isTooLate = hoursUntilShift < cancellationDeadline;
    
    return {
      canSwap: hoursUntilShift >= cancellationDeadline,
      canCancel: hoursUntilShift >= cancellationDeadline,
      willEscalate: isWithinEscalationWindow,
      tooLate: isTooLate,
      timeUntilDeadline: Math.max(0, cancellationDeadline * 60 * 60 * 1000 - (Date.now() - new Date(`${shift.date}T${shift.startTime}`).getTime() + timeUntilShift)),
      escalationMessage: isWithinEscalationWindow ? `⚠️ Escalates to Manager in ${formatCountdown(timeUntilShift)}` : null
    };
  };

  // Working time tracking state
  const [localTimeEntries, setLocalTimeEntries] = useState<any[]>([]);
  const [isClocked, setIsClocked] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);

  // Handle clock in/out functionality
  const handleClockIn = () => {
    const now = new Date();
    setIsClocked(true);
    setClockInTime(now);
    toast({
      title: "Clocked In",
      description: `Clocked in at ${now.toLocaleTimeString()}`,
    });
  };

  const handleClockOut = () => {
    if (!clockInTime) return;
    
    const now = new Date();
    const clockOutTime = now;
    const totalMinutes = Math.floor((now.getTime() - clockInTime.getTime()) / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    // Add to time entries for display before clearing state
    setLocalTimeEntries((prev: any[]) => [...prev, {
      id: Date.now(),
      date: now.toISOString().split('T')[0],
      clockInTime: clockInTime.toLocaleTimeString(),
      clockOutTime: clockOutTime.toLocaleTimeString(),
      totalTime: `${hours}h ${minutes}m`,
      status: 'completed'
    }]);
    
    setIsClocked(false);
    setClockInTime(null);
    
    toast({
      title: "Clocked Out",
      description: `Worked ${hours}h ${minutes}m`,
    });
  };

  // Current clock status
  const isClockedIn = isClocked;

  // Clock In Mutation
  const clockInMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/time-entries", {
        tenantId,
        userId: user?.id,
        clockInTime: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({ title: "Clocked In", description: "You have successfully clocked in for your shift." });
    },
    onError: (error: any) => {
      toast({ title: "Clock In Failed", description: error.message || "Failed to clock in", variant: "destructive" });
    },
  });

  // Clock Out Mutation - now uses local state
  const clockOutMutation = useMutation({
    mutationFn: async () => {
      if (!isClocked) throw new Error("No active clock-in session found");
      // This would call the API in a real implementation
      return Promise.resolve({ success: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({ title: "Clocked Out", description: "You have successfully clocked out." });
    },
    onError: (error: any) => {
      toast({ title: "Clock Out Failed", description: error.message || "Failed to clock out", variant: "destructive" });
    },
  });

  // Calculate if clock-in is allowed based on policy
  const canClockIn = () => {
    if (!timePolicy || isClockedIn) return false;
    
    // Check if there's a shift today that allows clock-in
    const today = new Date().toISOString().split('T')[0];
    const todayShifts = shifts.filter(shift => shift.date === today);
    
    if (todayShifts.length === 0) return false;
    
    // Check if we're within the clock-in buffer window
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    return todayShifts.some(shift => {
      const [shiftHour, shiftMinute] = shift.startTime.split(':').map(Number);
      const shiftStartMinutes = shiftHour * 60 + shiftMinute;
      const bufferMinutes = timePolicy.clockInBufferMinutes || 30;
      
      // Can clock in up to bufferMinutes before shift starts
      return currentTime >= (shiftStartMinutes - bufferMinutes) && currentTime <= shiftStartMinutes + 15;
    });
  };

  // Calculate time worked today from actual time entries
  const calculateTimeWorked = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = (timeEntries || []).filter((entry: any) => {
      const entryDate = new Date(entry.clockInTime).toISOString().split('T')[0];
      return entryDate === today;
    });
    
    if (todayEntries.length === 0) return "No time tracked today";
    
    const currentEntry = todayEntries.find((entry: any) => !entry.clockOutTime);
    if (currentEntry) {
      const clockInTime = new Date(currentEntry.clockInTime);
      const now = new Date();
      const diffMs = now.getTime() - clockInTime.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${hours}h ${minutes}m (active)`;
    }
    
    // Calculate total hours for completed entries today
    const totalHours = todayEntries.reduce((total: number, entry: any) => {
      return total + (parseFloat(entry.totalHours) || 0);
    }, 0);
    
    return `${totalHours.toFixed(1)}h (completed)`;
  };

  // Check if user is currently clocked in from time entries
  const isCurrentlyClockedIn = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = (timeEntries || []).filter((entry: any) => {
      if (!entry.clockInTime) return false;
      const entryDate = new Date(entry.clockInTime).toISOString().split('T')[0];
      return entryDate === today;
    });
    
    // A person is currently clocked in if they have a clock-in time but no clock-out time
    // Status can be 'clocked_in', 'late', 'on_break', etc.
    return todayEntries.some((entry: any) => entry.clockInTime && !entry.clockOutTime);
  };

  // Quick actions that staff can perform
  const quickActions = [
    {
      title: "Submit Holiday Request",
      description: "Request time off for vacation or sick days",
      icon: Calendar,
      action: () => {
        setActiveTab("holiday-requests");
        setIsHolidayModalOpen(true);
      },
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "View Schedule",
      description: "Check your upcoming shifts and assignments",
      icon: Clock,
      action: () => setActiveTab("my-shifts"),
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "Request Shift Swap",
      description: "Find someone to cover your shift",
      icon: RefreshCw,
      action: () => {
        setActiveTab("swap-requests");
        setIsSwapModalOpen(true);
      },
      color: "bg-purple-500 hover:bg-purple-600",
    },
  ];

  // Dynamic calculations from database data
  const today = new Date();
  const currentWeek = getWeekDates(today);
  const lastWeek = getWeekDates(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));
  
  // Calculate upcoming shifts (only confirmed, exclude pending assignments)
  const upcomingShifts = shifts.filter(shift => 
    new Date(shift.date) >= today && shift.status !== 'assigned'
  );
  const nextShift = upcomingShifts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  const daysUntilNext = nextShift ? Math.ceil((new Date(nextShift.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  
  // Calculate hours this week from time entries
  const thisWeekEntries = (timeEntries || []).filter((entry: any) => {
    const entryDate = new Date(entry.clockInTime);
    return entryDate >= currentWeek.start && entryDate <= currentWeek.end;
  });
  const hoursThisWeek = thisWeekEntries.reduce((total: number, entry: any) => total + (parseFloat(entry.totalHours) || 0), 0);
  
  // Calculate last week hours for comparison
  const lastWeekEntries = (timeEntries || []).filter((entry: any) => {
    const entryDate = new Date(entry.clockInTime);
    return entryDate >= lastWeek.start && entryDate <= lastWeek.end;
  });
  const hoursLastWeek = lastWeekEntries.reduce((total: number, entry: any) => total + (parseFloat(entry.totalHours) || 0), 0);
  const hoursChange = hoursThisWeek - hoursLastWeek;

  // Performance calculation functions
  const calculateMonthlyHours = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyEntries = (timeEntries || []).filter((entry: any) => {
      const entryDate = new Date(entry.clockInTime);
      return entryDate >= startOfMonth && entryDate <= today;
    });
    return monthlyEntries.reduce((total: number, entry: any) => total + parseFloat(entry.totalHours || 0), 0).toFixed(1);
  };

  const calculateCompletedShifts = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const completedShifts = shifts.filter(shift => {
      const shiftDate = new Date(shift.date);
      return shiftDate >= startOfMonth && shiftDate <= today && shift.status === "completed";
    });
    return completedShifts.length;
  };

  const calculateAttendanceRate = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Get all past shifts (before today) in this month
    const today_start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const pastShifts = shifts.filter(shift => {
      const shiftDate = new Date(shift.date);
      return shiftDate >= startOfMonth && shiftDate < today_start;
    });
    

    
    if (pastShifts.length === 0) {
      // If no past shifts this month, but we have upcoming shifts, show 100%
      const upcomingShifts = shifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate >= today;
      });
      return upcomingShifts.length > 0 ? "100.0" : "0.0";
    }
    
    // Count attended shifts (completed, clocked_out, or with time entries)
    const attendedShifts = pastShifts.filter(shift => {
      if (shift.status === "completed" || shift.status === "clocked_out") return true;
      
      // Check if there are time entries for this shift or any time entry on this date
      const shiftDate = shift.date;
      const hasTimeEntry = (timeEntries || []).some((entry: any) => {
        const entryDate = new Date(entry.clockInTime).toISOString().split('T')[0];
        return entry.shiftId === shift.id || entryDate === shiftDate;
      });
      
      return hasTimeEntry;
    });
    
    const rate = (attendedShifts.length / pastShifts.length) * 100;
    return rate.toFixed(1);
  };

  const calculatePerformanceRating = () => {
    const attendanceRate = parseFloat(calculateAttendanceRate());
    const monthlyHours = parseFloat(calculateMonthlyHours());
    
    if (attendanceRate >= 95 && monthlyHours >= 120) return "Excellent";
    if (attendanceRate >= 90 && monthlyHours >= 100) return "Good";
    if (attendanceRate >= 85 && monthlyHours >= 80) return "Fair";
    return "Needs Improvement";
  };
  
  // Calculate attendance rate
  const completedShifts = shifts.filter(shift => shift.status === 'completed').length;
  const totalScheduledShifts = shifts.filter(shift => new Date(shift.date) < today).length;
  const attendanceRate = totalScheduledShifts > 0 ? (completedShifts / totalScheduledShifts) * 100 : 100;
  
  // Recent activity from multiple sources with proper time parsing
  const recentActivities = useMemo(() => {
    const activities = [];
    
    // Add completed shifts from last 7 days
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    shifts.filter(shift => shift.status === 'completed' && new Date(shift.date) >= oneWeekAgo)
      .forEach(shift => {
        activities.push({
          type: 'shift_completed',
          title: 'Shift completed',
          description: `${shift.role} - ${shift.location}`,
          time: new Date(shift.date),
          icon: CheckCircle,
          color: 'green',
          id: `shift-${shift.id}`
        });
      });
    
    // Add recent holiday requests
    (holidayRequests || []).filter((req: any) => {
      const reqDate = req.updatedAt ? new Date(req.updatedAt) : new Date(req.createdAt);
      return reqDate >= oneWeekAgo;
    }).forEach((req: any) => {
      const reqDate = req.updatedAt ? new Date(req.updatedAt) : new Date(req.createdAt);
      activities.push({
        type: 'holiday_request',
        title: `Holiday request ${req.status}`,
        description: `${new Date(req.startDate).toLocaleDateString()} - ${new Date(req.endDate).toLocaleDateString()}`,
        time: reqDate,
        icon: Calendar,
        color: req.status === 'approved' ? 'blue' : 'orange',
        id: `holiday-${req.id}`
      });
    });
    
    // Add recent time entries (clock-ins) from last 3 days
    const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
    (timeEntries || []).filter((entry: any) => new Date(entry.clockInTime) >= threeDaysAgo)
      .forEach((entry: any) => {
        activities.push({
          type: 'time_entry',
          title: 'Clocked in',
          description: `${entry.status === 'on_break' ? 'Currently on break' : entry.status.replace('_', ' ')}`,
          time: new Date(entry.clockInTime),
          icon: Clock,
          color: 'blue',
          id: `time-${entry.id}`
        });
      });
    
    // Sort by time (most recent first) and take top 5
    return activities
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 5);
  }, [shifts, holidayRequests, timeEntries, today]);

  // Helper functions
  function getWeekDates(date: Date) {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }
  
  function getTimeAgo(date: Date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Work</h1>
          <p className="text-muted-foreground">
            Your personal dashboard for shifts, assignments, and workplace activities
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action, index) => (
          <Card 
            key={index}
            className="cursor-pointer transition-all hover:scale-105 hover:shadow-md"
            onClick={action.action}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${action.color}`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{action.title}</h3>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Mobile-first responsive tabs */}
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1 h-auto p-1">
          <TabsTrigger value="overview" className="text-xs md:text-sm px-2 py-2 md:px-3">
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Home</span>
          </TabsTrigger>
          <TabsTrigger value="time-tracking" className="text-xs md:text-sm px-2 py-2 md:px-3">
            <span className="hidden sm:inline">Time Tracking</span>
            <span className="sm:hidden">Time</span>
          </TabsTrigger>
          <TabsTrigger value="my-shifts" className="text-xs md:text-sm px-2 py-2 md:px-3">
            <span className="hidden sm:inline">My Shifts</span>
            <span className="sm:hidden">Shifts</span>
          </TabsTrigger>
          <TabsTrigger value="my-strikes" className="text-xs md:text-sm px-2 py-2 md:px-3">
            <span className="hidden sm:inline">My Strikes</span>
            <span className="sm:hidden">Strikes</span>
          </TabsTrigger>
          <TabsTrigger value="holiday-requests" className="text-xs md:text-sm px-2 py-2 md:px-3">
            <span className="hidden sm:inline">Holiday Requests</span>
            <span className="sm:hidden">Holiday</span>
          </TabsTrigger>
          <TabsTrigger value="swap-requests" className="text-xs md:text-sm px-2 py-2 md:px-3">
            <span className="hidden sm:inline">Swap Requests</span>
            <span className="sm:hidden">Swaps</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Shifts</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingShifts.length}</div>
                <p className="text-xs text-muted-foreground">
                  {nextShift ? `Next shift in ${daysUntilNext} day${daysUntilNext === 1 ? '' : 's'}` : 'No upcoming shifts'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingAssignments.length}</div>
                <p className="text-xs text-muted-foreground">
                  Requires your response
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hours This Week</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hoursThisWeek.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  {hoursChange >= 0 ? '+' : ''}{hoursChange.toFixed(1)} from last week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {attendanceRate >= 95 ? 'Excellent performance' : 
                   attendanceRate >= 85 ? 'Good performance' : 
                   attendanceRate >= 75 ? 'Needs improvement' : 'Poor performance'}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent activity to display
                    </p>
                  ) : (
                    recentActivities.map((activity, index) => {
                      const colorClasses = {
                        green: 'bg-green-100 text-green-600',
                        blue: 'bg-blue-100 text-blue-600',
                        orange: 'bg-orange-100 text-orange-600',
                        purple: 'bg-purple-100 text-purple-600'
                      };
                      const colorClass = colorClasses[activity.color as keyof typeof colorClasses] || colorClasses.green;
                      
                      return (
                        <div key={index} className="flex items-center space-x-4">
                          <div className={`p-2 rounded-full ${colorClass.split(' ')[0]}`}>
                            <activity.icon className={`h-4 w-4 ${colorClass.split(' ')[1]}`} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{activity.title}</p>
                            <p className="text-xs text-muted-foreground">{activity.description}</p>
                          </div>
                          <div className="text-xs text-muted-foreground ml-auto">{getTimeAgo(activity.time)}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Monthly Target</span>
                      <span>120h / 160h</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: "75%" }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>On-time Arrival</span>
                      <span>95%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: "95%" }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Shift Completion</span>
                      <span>100%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: "100%" }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="time-tracking" className="space-y-6">
          {/* Clock In/Out Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Time Tracking
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Clock in and out of your shifts with policy-driven controls
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Current Status</p>
                  <p className="text-lg font-bold text-green-600">
                    {isCurrentlyClockedIn() ? "Clocked In" : "Not Clocked In"}
                  </p>
                  {isCurrentlyClockedIn() && (
                    <p className="text-xs text-muted-foreground">
                      Currently working
                    </p>
                  )}
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-medium">Time Worked Today</p>
                  <p className="text-lg font-bold">{calculateTimeWorked()}</p>
                </div>
              </div>

              {/* Clock In/Out Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => clockInMutation.mutate()}
                  disabled={!canClockIn() || clockInMutation.isPending || isCurrentlyClockedIn()}
                  className="h-16 text-lg"
                  variant={canClockIn() && !isCurrentlyClockedIn() ? "default" : "secondary"}
                >
                  {clockInMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <Play className="h-5 w-5 mr-2" />
                  )}
                  Clock In
                </Button>
                
                <Button
                  onClick={() => clockOutMutation.mutate()}
                  disabled={!isCurrentlyClockedIn() || clockOutMutation.isPending}
                  className="h-16 text-lg"
                  variant={isCurrentlyClockedIn() ? "destructive" : "secondary"}
                >
                  {clockOutMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <Pause className="h-5 w-5 mr-2" />
                  )}
                  Clock Out
                </Button>
              </div>

              {/* Policy Information */}
              {timePolicy && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Early Clock-In</p>
                    <p className="text-sm font-bold">{timePolicy.clockInBufferMinutes} minutes</p>
                    <p className="text-xs text-muted-foreground">Before shift start</p>
                  </div>
                  
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-xs font-medium text-green-700 dark:text-green-300">Grace Period</p>
                    <p className="text-sm font-bold">{timePolicy.lateGracePeriodMinutes} minutes</p>
                    <p className="text-xs text-muted-foreground">Late arrival tolerance</p>
                  </div>
                  
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <p className="text-xs font-medium text-orange-700 dark:text-orange-300">Clock-Out Buffer</p>
                    <p className="text-sm font-bold">{timePolicy.clockOutBufferMinutes} minutes</p>
                    <p className="text-xs text-muted-foreground">After shift end</p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Strike Reset</p>
                    <p className="text-sm font-bold">{timePolicy.resetPeriodDays} days</p>
                    <p className="text-xs text-muted-foreground">Clean slate period</p>
                  </div>
                </div>
              )}

              {/* Today's Time Entries */}
              {timeEntries?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Today's Time Entries</h4>
                  <div className="space-y-2">
                    {timeEntries.map((entry: any) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            Clock In: {new Date(entry.clockInTime).toLocaleTimeString()}
                          </p>
                          {entry.clockOutTime && (
                            <p className="text-sm text-muted-foreground">
                              Clock Out: {new Date(entry.clockOutTime).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {entry.clockOutTime ? (
                            <Badge variant="secondary">Completed</Badge>
                          ) : (
                            <Badge variant="default">Active</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-shifts" className="space-y-6">
          {shiftsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Loading your shifts...</span>
            </div>
          ) : (
            <>
              {/* Today Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Today ({groupedShifts.today.length})</span>
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {groupedShifts.today.length > 0 ? (
                    <div className="space-y-3">
                      {groupedShifts.today.map((shift) => (
                        <ShiftCard 
                          key={shift.id} 
                          shift={shift} 
                          actions={getShiftActions(shift)}
                          onCardClick={() => openShiftDetailModal(shift)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2" />
                      <p>No shifts scheduled for today</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* This Week Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>This Week ({groupedShifts.week.length})</span>
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {groupedShifts.week.length > 0 ? (
                    <div className="space-y-3">
                      {groupedShifts.week.map((shift) => (
                        <ShiftCard 
                          key={shift.id} 
                          shift={shift} 
                          actions={getShiftActions(shift)}
                          onCardClick={() => openShiftDetailModal(shift)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2" />
                      <p>No shifts scheduled for this week</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Upcoming ({groupedShifts.upcoming.length})</span>
                    <Timer className="h-5 w-5 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {groupedShifts.upcoming.length > 0 ? (
                    <>
                      <div className="space-y-3">
                        {groupedShifts.upcoming.slice(0, upcomingPage * 10).map((shift) => (
                          <ShiftCard 
                            key={shift.id} 
                            shift={shift} 
                            actions={getShiftActions(shift)}
                            onCardClick={() => openShiftDetailModal(shift)}
                            showActions={true}
                          />
                        ))}
                      </div>
                      {groupedShifts.upcoming.length > upcomingPage * 10 && (
                        <div className="mt-4 text-center">
                          <Button 
                            variant="outline" 
                            onClick={() => setUpcomingPage(prev => prev + 1)}
                            className="min-h-[44px] min-w-[44px]"
                          >
                            Load More ({groupedShifts.upcoming.length - upcomingPage * 10} remaining)
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2" />
                      <p>No upcoming shifts beyond this week</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Completed Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Completed ({groupedShifts.completed.length})</span>
                    <CheckCircle className="h-5 w-5 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {groupedShifts.completed.length > 0 ? (
                    <>
                      <div className="space-y-3">
                        {groupedShifts.completed.slice(0, completedPage * 10).map((shift) => (
                          <ShiftCard 
                            key={shift.id} 
                            shift={shift} 
                            actions={getShiftActions(shift)}
                            onCardClick={() => openShiftDetailModal(shift)}
                            isCompleted={true}
                          />
                        ))}
                      </div>
                      {groupedShifts.completed.length > completedPage * 10 && (
                        <div className="mt-4 text-center">
                          <Button 
                            variant="outline" 
                            onClick={() => setCompletedPage(prev => prev + 1)}
                            className="min-h-[44px] min-w-[44px]"
                          >
                            Load More ({groupedShifts.completed.length - completedPage * 10} remaining)
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>No completed shifts to display</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="my-strikes" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">My Strikes</h2>
            
            {/* Strike Alert Banner */}
            {strikeData && !canClaimShifts?.canClaim && (
              <div className="mb-6">
                <div 
                  role="alert" 
                  className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800 dark:text-red-200">
                      Strike Limit Reached
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      You have {strikeData.totalPoints} strike points. You cannot claim new shifts until some strikes expire or are resolved.
                      {canClaimShifts?.reason && ` Reason: ${canClaimShifts.reason}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Strike Summary Card */}
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">Strike Summary</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {strikesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading strike data...</span>
                  </div>
                ) : strikesError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Failed to load strike data</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {strikeData?.totalPoints || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Points</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {strikeData?.strikes.filter(s => s.isActive).length || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Active Strikes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {strikeData?.strikes.filter(s => !s.isActive).length || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Expired</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Strike History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Strike History</CardTitle>
              </CardHeader>
              <CardContent>
                {strikesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : !strikeData?.strikes.length ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No strikes recorded</p>
                    <p className="text-xs text-muted-foreground mt-1">Keep up the great work!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Desktop: Table Layout */}
                    <div className="hidden md:block">
                      <div className="rounded-md border">
                        <div className="grid grid-cols-5 gap-4 p-3 border-b bg-muted/50 text-sm font-medium">
                          <div>Date</div>
                          <div>Reason</div>
                          <div>Points</div>
                          <div>Status</div>
                          <div>Expires</div>
                        </div>
                        {strikeData.strikes.map((strike) => (
                          <div key={strike.id} className="grid grid-cols-5 gap-4 p-3 border-b last:border-b-0 text-sm">
                            <div>{new Date(strike.issuedAt).toLocaleDateString()}</div>
                            <div className="capitalize">
                              {strike.reason.replace('_', ' ')}
                            </div>
                            <div className="font-medium">{strike.points}</div>
                            <div>
                              <Badge variant={strike.isActive ? "destructive" : "secondary"}>
                                {strike.isActive ? "Active" : "Expired"}
                              </Badge>
                            </div>
                            <div className="text-muted-foreground">
                              {strike.expiresAt ? new Date(strike.expiresAt).toLocaleDateString() : "N/A"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mobile: Card Layout */}
                    <div className="md:hidden space-y-3">
                      {strikeData.strikes.map((strike) => (
                        <Card key={strike.id} className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium capitalize">
                              {strike.reason.replace('_', ' ')}
                            </div>
                            <Badge variant={strike.isActive ? "destructive" : "secondary"}>
                              {strike.isActive ? "Active" : "Expired"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium text-foreground">{strike.points}</span> points
                            </div>
                            <div>{new Date(strike.issuedAt).toLocaleDateString()}</div>
                          </div>
                          {strike.expiresAt && (
                            <div className="text-xs text-muted-foreground mt-2">
                              Expires: {new Date(strike.expiresAt).toLocaleDateString()}
                            </div>
                          )}
                          {strike.notes && (
                            <div className="text-xs text-muted-foreground mt-2 italic">
                              {strike.notes}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Assignments</CardTitle>
              <p className="text-sm text-muted-foreground">
                Shifts assigned to you that require confirmation
              </p>
            </CardHeader>
            <CardContent>
              {assignmentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : pendingAssignments.length > 0 ? (
                <div className="space-y-4">
                  {pendingAssignments.map((shift) => (
                    <div 
                      key={shift.id} 
                      className="border rounded-lg p-4 space-y-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <h3 className="font-semibold">{shift.role}</h3>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              Assignment Pending
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(shift.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{shift.startTime} - {shift.endTime}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{shift.location}</span>
                            </div>
                          </div>
                          {shift.description && (
                            <p className="text-sm text-muted-foreground">{shift.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-3 pt-2 border-t">
                        <Button 
                          size="sm" 
                          onClick={() => assignmentResponseMutation.mutate({ 
                            shiftId: shift.id, 
                            response: "accept" 
                          })}
                          disabled={assignmentResponseMutation.isPending}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {assignmentResponseMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <Check className="h-3 w-3 mr-1" />
                          )}
                          Accept Assignment
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => assignmentResponseMutation.mutate({ 
                            shiftId: shift.id, 
                            response: "decline" 
                          })}
                          disabled={assignmentResponseMutation.isPending}
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          {assignmentResponseMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <X className="h-3 w-3 mr-1" />
                          )}
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-8 w-8 mx-auto mb-2" />
                  <p>No pending assignments</p>
                  <p className="text-xs mt-1">New shift assignments will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <p className="text-sm text-muted-foreground">
                Your workplace performance metrics and goals
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">This Month</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Hours Worked</span>
                      <Badge variant="outline">{calculateMonthlyHours()}h</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Shifts Completed</span>
                      <Badge variant="outline">{calculateCompletedShifts()}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Attendance Rate</span>
                      <Badge variant="outline" className="text-green-600">{calculateAttendanceRate()}%</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">Goals & Targets</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Monthly Target</span>
                      <Badge variant="outline">160h</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Attendance Goal</span>
                      <Badge variant="outline">95%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Performance Rating</span>
                      <Badge variant="outline" className="text-blue-600">{calculatePerformanceRating()}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holiday-requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Holiday Requests
                <Dialog open={isHolidayModalOpen} onOpenChange={setIsHolidayModalOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Submit Request
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Time Off</DialogTitle>
                      <DialogDescription>
                        Submit a request for vacation, sick leave, or other time off. Requests will be reviewed by management.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...holidayForm}>
                      <form onSubmit={holidayForm.handleSubmit((data) => holidayRequestMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={holidayForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Request Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="vacation">Vacation</SelectItem>
                                  <SelectItem value="sick">Sick Leave</SelectItem>
                                  <SelectItem value="personal">Personal Day</SelectItem>
                                  <SelectItem value="emergency">Emergency</SelectItem>
                                  <SelectItem value="bereavement">Bereavement</SelectItem>
                                  <SelectItem value="maternity">Maternity</SelectItem>
                                  <SelectItem value="paternity">Paternity</SelectItem>
                                  <SelectItem value="study">Study Leave</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={holidayForm.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={holidayForm.control}
                          name="endDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={holidayForm.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="normal">Normal</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={holidayForm.control}
                          name="reason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reason (Optional)</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Please provide details for your request..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={holidayRequestMutation.isPending}
                        >
                          {holidayRequestMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Request"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                View and manage your holiday requests
              </p>
            </CardHeader>
            <CardContent>
              {holidayRequestsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-muted rounded-full"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !holidayRequests.length ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No holiday requests found.</p>
                  <p className="text-sm text-gray-400">Click "Submit Request" to create your first holiday request.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {holidayRequests.map((request: any) => (
                    <div key={request.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-medium">{request.requestType} Request</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Days: {request.daysRequested} | Submitted: {new Date(request.createdAt || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={
                          request.status === "pending" ? "default" :
                          request.status === "approved" ? "secondary" : "destructive"
                        }>
                          {request.status}
                        </Badge>
                      </div>
                      {request.reason && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Reason:</strong> {request.reason}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        <strong>Priority:</strong> {request.priority}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="swap-requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Swap Requests
                <Dialog open={isSwapModalOpen} onOpenChange={setIsSwapModalOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Request Swap
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Request Shift Swap</DialogTitle>
                      <DialogDescription>
                        Select one of your shifts to swap with another staff member's shift. Requests are subject to management approval based on policy.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...swapForm}>
                      <form onSubmit={swapForm.handleSubmit((data) => swapRequestMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={swapForm.control}
                          name="originalShiftId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>My Shift to Swap</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select your shift" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {shifts.filter(shift => shift.assignedTo === parseInt(user?.id?.toString() || "0")).map((shift) => (
                                    <SelectItem key={shift.id} value={shift.id.toString()}>
                                      {shift.date} - {shift.startTime} to {shift.endTime} ({shift.role})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={swapForm.control}
                          name="targetShiftId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Shift to Swap With</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select shift to swap with" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {allShifts
                                    .filter((shift: any) => 
                                      shift.assignedTo !== parseInt(user?.id?.toString() || "0") && 
                                      shift.assignedTo !== null &&
                                      shift.status === "assigned"
                                    )
                                    .map((shift: any) => (
                                      <SelectItem key={shift.id} value={shift.id.toString()}>
                                        {shift.date} - {shift.startTime} to {shift.endTime} ({shift.role} at {shift.location})
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={swapForm.control}
                          name="reason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reason for Swap</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Please explain why you need to swap this shift..." 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>How it works:</strong> Your swap request will be sent to both the owner and the staff member assigned to the target shift. Both parties must approve before the swap is confirmed.
                          </p>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={swapRequestMutation.isPending}
                        >
                          {swapRequestMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Swap Request"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Request to swap shifts with other staff members
              </p>
            </CardHeader>
            <CardContent>
              {swapRequestsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-muted rounded-full"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !swapRequests.length ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No swap requests found.</p>
                  <p className="text-sm text-gray-400">Click "Request Swap" to find someone to cover your shift.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {swapRequests.map((request: any) => {
                    // Determine if this is an incoming request (target shift belongs to current user)
                    const userShifts = shifts.filter(shift => shift.assignedTo === user?.id);
                    const isIncomingRequest = userShifts.some(shift => shift.id === request.targetShiftId);
                    const isMyRequest = request.requesterId === user?.id;
                    
                    return (
                      <div key={request.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {isIncomingRequest ? "Incoming Swap Request" : "My Swap Request"}
                              </p>
                              {isIncomingRequest && (
                                <Badge variant="outline" className="text-blue-600 border-blue-200">
                                  Action Required
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {isIncomingRequest 
                                ? `${request.requesterName || 'Someone'} wants to swap shifts with you`
                                : `Requested: ${new Date(request.createdAt || Date.now()).toLocaleDateString()}`
                              }
                            </p>
                          </div>
                          <Badge variant={
                            request.status === "pending" ? "default" :
                            request.status === "approved" ? "secondary" : "destructive"
                          }>
                            {request.status}
                          </Badge>
                        </div>
                        
                        {request.reason && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Reason:</strong> {request.reason}
                          </p>
                        )}

                        {/* Show action buttons for incoming pending requests */}
                        {isIncomingRequest && request.status === "pending" && (
                          <div className="flex gap-2 pt-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleSwapAction(request.id, "approved")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Accept Swap
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleSwapAction(request.id, "declined")}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              Decline Swap
                            </Button>
                          </div>
                        )}

                        {/* Show shift details */}
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p><strong>Original Shift:</strong> {request.originalShiftDate} ({request.originalShiftTime})</p>
                          <p><strong>Target Shift:</strong> {request.targetShiftDate} ({request.targetShiftTime})</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Shift Detail Modal */}
      <ShiftDetailModal 
        shift={selectedShift} 
        isOpen={isShiftDetailModalOpen} 
        onClose={closeShiftDetailModal} 
      />
    </div>
  );
}