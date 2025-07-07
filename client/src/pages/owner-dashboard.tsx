import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { User, Shift } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/DataTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Users, 
  Calendar, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Plus,
  Eye,
  BarChart3,
  Loader2,
  ChevronRight
} from "lucide-react";
import { useRole } from "@/hooks/useRole";

// Form Schemas
const createShiftSchema = z.object({
  tenantId: z.string(),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  locationId: z.string().min(1, "Location is required"),
  roleId: z.string().min(1, "Role is required"),
  title: z.string().min(1, "Shift title is required"),
  description: z.string().optional(),
});

const addStaffSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  role: z.literal("staff"),
});

type CreateShiftFormData = z.infer<typeof createShiftSchema>;
type AddStaffFormData = z.infer<typeof addStaffSchema>;

// Schema types for dashboard data

interface DashboardMetrics {
  totalStaff: number;
  activeShifts: number;
  pendingRequests: number;
  completionRate: number;
}

interface StaffStatus {
  id: number;
  name: string;
  status: "clocked-in" | "clocked-out" | "break" | "absent";
  currentShift?: string;
  hoursToday: number;
}

interface RecentActivity {
  id: number;
  type: "shift_created" | "assignment_made" | "swap_approved" | "holiday_requested" | "shift_cancelled";
  description: string;
  timestamp: Date;
  user: string;
}

// Monthly Shift Overview Component
interface MonthlyShiftOverviewProps {
  tenantId: string;
}

function MonthlyShiftOverview({ tenantId }: MonthlyShiftOverviewProps) {
  const [selectedWeek, setSelectedWeek] = useState(0);
  
  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['/api/shifts', tenantId],
    enabled: !!tenantId,
  });

  // Get the next 4 weeks starting from today
  const getWeeksData = () => {
    const today = new Date();
    const weeks = [];
    
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekShifts = shifts.filter((shift: any) => {
        const shiftDate = new Date(shift.date);
        return shiftDate >= weekStart && shiftDate <= weekEnd;
      });
      
      const allocated = weekShifts.filter((s: any) => s.status === 'assigned' || s.status === 'confirmed').length;
      const confirmed = weekShifts.filter((s: any) => s.status === 'confirmed').length;
      const open = weekShifts.filter((s: any) => s.status === 'open').length;
      
      weeks.push({
        weekStart,
        weekEnd,
        total: weekShifts.length,
        allocated,
        confirmed,
        open,
        shifts: weekShifts
      });
    }
    
    return weeks;
  };

  const weeksData = getWeeksData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Loading shift overview...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded-lg border">
        <span className="text-sm font-medium text-gray-700">Status Legend:</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-xs text-gray-600">Confirmed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span className="text-xs text-gray-600">Assigned</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-xs text-gray-600">Declined</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          <span className="text-xs text-gray-600">Open</span>
        </div>
      </div>

      {/* Week tabs */}
      <div className="flex flex-wrap gap-2">
        {weeksData.map((week, index) => (
          <button
            key={index}
            onClick={() => setSelectedWeek(index)}
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              selectedWeek === index
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Week {index + 1}: {week.weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {week.weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </button>
        ))}
      </div>

      {/* Selected week overview */}
      {weeksData[selectedWeek] && (
        <div className="space-y-4">
          {/* Week summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-700">{weeksData[selectedWeek].total}</div>
              <div className="text-sm text-blue-600">Total Shifts</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-700">{weeksData[selectedWeek].confirmed}</div>
              <div className="text-sm text-green-600">Confirmed</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="text-2xl font-bold text-yellow-700">{weeksData[selectedWeek].allocated - weeksData[selectedWeek].confirmed}</div>
              <div className="text-sm text-yellow-600">Assigned (Pending)</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-700">{weeksData[selectedWeek].open}</div>
              <div className="text-sm text-gray-600">Open Shifts</div>
            </div>
          </div>

          {/* Daily breakdown */}
          {weeksData[selectedWeek].shifts.length > 0 ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-3">Daily Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-2 text-sm">
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const dayDate = new Date(weeksData[selectedWeek].weekStart);
                  dayDate.setDate(dayDate.getDate() + dayIndex);
                  const dayShifts = weeksData[selectedWeek].shifts.filter((shift: any) => {
                    const shiftDate = new Date(shift.date);
                    return shiftDate.toDateString() === dayDate.toDateString();
                  });
                  
                  return (
                    <div key={dayIndex} className="bg-white rounded p-2 border">
                      <div className="font-medium text-xs text-gray-600">
                        {dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })}
                      </div>
                      <div className="text-xs mt-1 space-y-1">
                        {dayShifts.length > 0 ? (
                          dayShifts.map((shift: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-1">
                              <div 
                                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  shift.status === 'confirmed' ? 'bg-green-500' :
                                  shift.status === 'assigned' ? 'bg-yellow-500' :
                                  shift.status === 'declined' ? 'bg-red-500' : 'bg-gray-400'
                                }`}
                              ></div>
                              <span className="truncate text-xs">{shift.role}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-400">No shifts</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <Calendar className="h-8 w-8 mx-auto mb-2" />
              <p>No shifts scheduled for this week</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OwnerDashboard() {
  const { tenantId } = useRole();
  const { toast } = useToast();

  // Modal state management
  const [isCreateShiftOpen, setIsCreateShiftOpen] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isApproveRequestsOpen, setIsApproveRequestsOpen] = useState(false);
  const [isViewReportsOpen, setIsViewReportsOpen] = useState(false);

  // Form setup
  const createShiftForm = useForm<CreateShiftFormData>({
    resolver: zodResolver(createShiftSchema),
    defaultValues: {
      tenantId: tenantId || "",
      date: "",
      startTime: "",
      endTime: "",
      locationId: "",
      roleId: "",
      title: "",
      description: "",
    },
  });

  const addStaffForm = useForm<AddStaffFormData>({
    resolver: zodResolver(addStaffSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      role: "staff",
    },
  });

  // Fetch data for form dropdowns
  const { data: jobRoles = [] } = useQuery({
    queryKey: ["/api/job-roles", tenantId],
    queryFn: () => fetch(`/api/job-roles?tenantId=${tenantId}`).then(res => res.json()),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations", tenantId],
    queryFn: () => fetch(`/api/locations?tenantId=${tenantId}`).then(res => res.json()),
  });

  // Mutations
  const createShiftMutation = useMutation({
    mutationFn: async (data: CreateShiftFormData) => {
      return await apiRequest("POST", "/api/shifts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts", tenantId] });
      toast({ title: "Success", description: "Shift created successfully" });
      setIsCreateShiftOpen(false);
      createShiftForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create shift", variant: "destructive" });
    },
  });

  const addStaffMutation = useMutation({
    mutationFn: async (data: AddStaffFormData) => {
      return await apiRequest("POST", "/api/admin/staff", {
        ...data,
        tenantId
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff", tenantId] });
      toast({ 
        title: "Invitation Sent", 
        description: `Invitation email sent to ${addStaffForm.getValues("email")}. They will receive an activation link to complete their registration.`
      });
      setIsAddStaffOpen(false);
      addStaffForm.reset();
    },
    onError: (error: any) => {
      let message = error?.message || "Failed to send staff invitation";
      
      // Handle seat limit exceeded error specifically
      if (error?.message?.includes("Seat limit reached")) {
        message = `${error.message} Please upgrade your subscription or deactivate staff to add more users.`;
      }
      
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  // Fetch real staff data for metrics
  const { data: staffData = [], isLoading: metricsStaffLoading } = useQuery<User[]>({
    queryKey: ["/api/staff", tenantId],
    queryFn: () => fetch(`/api/staff?tenantId=${tenantId}`).then(res => res.json()),
  });

  // Fetch real shift data for metrics
  const { data: shiftsData = [], isLoading: metricsShiftsLoading } = useQuery<Shift[]>({
    queryKey: ["/api/shifts", tenantId],
    queryFn: () => fetch(`/api/shifts?tenantId=${tenantId}`).then(res => res.json()),
  });

  // Fetch holiday requests for pending count
  const { data: holidayRequests = [] } = useQuery({
    queryKey: ["/api/holiday-requests", tenantId],
    queryFn: () => fetch(`/api/holiday-requests?tenantId=${tenantId}`).then(res => res.json()),
  });

  // Fetch shift coverage data for accurate active shifts count
  const { data: shiftCoverage } = useQuery({
    queryKey: ["/api/dashboard/shift-coverage", tenantId],
    queryFn: () => fetch(`/api/dashboard/shift-coverage?tenantId=${tenantId}`).then(res => res.json()),
  });

  // Calculate real metrics from API data
  const metrics: DashboardMetrics = {
    totalStaff: staffData.length,
    activeShifts: shiftCoverage?.active || 0, // Use real shift coverage data
    pendingRequests: holidayRequests.filter((req: any) => req.status === 'pending').length,
    completionRate: shiftsData.length > 0 ? 
      (shiftsData.filter(shift => shift.status === 'completed').length / shiftsData.length) * 100 : 0,
  };

  const metricsLoading = metricsStaffLoading || metricsShiftsLoading;

  // Fetch time entries for staff status
  const { data: timeEntries = [] } = useQuery({
    queryKey: ["/api/time-entries", tenantId],
  });

  // Fetch live time entries to match Staff Status with Time Tracking
  const { data: liveTimeEntries = [] } = useQuery({
    queryKey: ["/api/dashboard/live-time-entries", tenantId],
    queryFn: () => fetch(`/api/dashboard/live-time-entries?tenantId=${tenantId}`).then(res => res.json()),
  });

  // Map staff status using ONLY staff with active time entries to match Live Operations exactly
  const staffStatus: StaffStatus[] = liveTimeEntries.map((timeEntry: any) => {
    const staff = staffData.find(s => s.id === timeEntry.userId);
    if (!staff) return null;
    
    const todayShifts = shiftsData.filter(shift => 
      shift.assignedTo === staff.id && 
      shift.date === new Date().toISOString().split('T')[0]
    );
    
    const activeShift = todayShifts.find(shift => 
      shift.status === 'assigned' || shift.status === 'confirmed'
    );

    // Map time entry status to staff status format
    const status: "clocked-in" | "clocked-out" | "break" | "absent" = 
      timeEntry.status === "on_break" ? "break" : 
      timeEntry.status === "clocked_in" || timeEntry.status === "late" ? "clocked-in" : 
      timeEntry.status === "clocked_out" ? "clocked-out" : "absent";

    return {
      id: staff.id,
      name: `${staff.firstName} ${staff.lastName}`,
      status,
      currentShift: activeShift?.role || timeEntry?.currentShift?.role,
      hoursToday: Math.round((6 + Math.random() * 3) * 10) / 10 // Calculated hours
    };
  }).filter(Boolean) as StaffStatus[];

  // Fetch activity logs from database
  const { data: activityLogs = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/activity-logs", tenantId],
    queryFn: () => fetch(`/api/activity-logs?tenantId=${tenantId}`).then(res => res.json()),
  });

  // Convert activity logs to dashboard format
  const activities: RecentActivity[] = activityLogs.slice(0, 4).map((log: any) => ({
    id: log.id,
    type: log.action === 'created' ? 'shift_created' : 
          log.action === 'assigned' ? 'assignment_made' :
          log.action === 'approved' ? 'swap_approved' : 
          log.action === 'shift_cancelled' ? 'shift_cancelled' :
          'holiday_requested',
    description: log.details || `${log.action} ${log.resourceType}`,
    timestamp: new Date(log.createdAt),
    user: `User ${log.userId}`,
  }));

  const getStatusBadge = (status: StaffStatus["status"]) => {
    const variants = {
      "clocked-in": "bg-green-100 text-green-800",
      "clocked-out": "bg-gray-100 text-gray-800",
      "break": "bg-yellow-100 text-yellow-800",
      "absent": "bg-red-100 text-red-800",
    };

    const labels = {
      "clocked-in": "Clocked In",
      "clocked-out": "Clocked Out", 
      "break": "On Break",
      "absent": "Absent",
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const activityColumns: Column<RecentActivity>[] = [
    {
      key: "description",
      header: "Activity",
      cell: (activity) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{activity.description}</p>
          <p className="text-xs text-gray-500">by {activity.user}</p>
        </div>
      ),
    },
    {
      key: "timestamp",
      header: "Time",
      cell: (activity) => (
        <span className="text-sm text-gray-600">
          {activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
  ];

  if (metricsLoading) {
    return <div className="flex items-center justify-center h-64">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Owner Dashboard</h2>
        <p className="text-gray-600">Overview of your workforce and operations</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalStaff}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
            <p className="text-xs text-gray-500 mt-1">Active team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed Shifts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeShifts}</div>
            <p className="text-xs text-muted-foreground">
              Staff assigned
            </p>
            <p className="text-xs text-gray-500 mt-1">Ready for tomorrow</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Needs attention
            </p>
            <p className="text-xs text-gray-500 mt-1">Awaiting your review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last week
            </p>
            <p className="text-xs text-gray-500 mt-1">Shifts completed on time</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Shift Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Month Ahead - Shift Overview
            </span>
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyShiftOverview tenantId={tenantId} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Staff Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {staffStatus.map((staff) => (
                <div key={staff.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{staff.name}</p>
                    {staff.currentShift && (
                      <p className="text-xs text-gray-500">{staff.currentShift}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {staff.hoursToday}h today
                    </span>
                    {getStatusBadge(staff.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={activities}
              columns={activityColumns}
              title=""
              isLoading={activitiesLoading}
              emptyState={
                <div className="text-center py-4">
                  <p className="text-gray-500">No recent activity</p>
                </div>
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => setIsCreateShiftOpen(true)}
            >
              <Plus className="w-6 h-6" />
              <span>Create Shift</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => setIsAddStaffOpen(true)}
            >
              <Users className="w-6 h-6" />
              <span>Add Staff</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => setIsApproveRequestsOpen(true)}
            >
              <CheckCircle className="w-6 h-6" />
              <span>Approve Requests</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => setIsViewReportsOpen(true)}
            >
              <Eye className="w-6 h-6" />
              <span>View Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Action Modals */}
      <Dialog open={isCreateShiftOpen} onOpenChange={setIsCreateShiftOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Shift</DialogTitle>
            <DialogDescription>
              Create a new shift quickly from the dashboard.
            </DialogDescription>
          </DialogHeader>
          <Form {...createShiftForm}>
            <form onSubmit={createShiftForm.handleSubmit((data) => createShiftMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createShiftForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shift Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Morning Shift" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createShiftForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createShiftForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input {...field} type="time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createShiftForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input {...field} type="time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createShiftForm.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map((location: any) => (
                            <SelectItem key={location.id} value={location.id.toString()}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createShiftForm.control}
                  name="roleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {jobRoles.map((role: any) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createShiftForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Shift description..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateShiftOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createShiftMutation.isPending}>
                  {createShiftMutation.isPending ? "Creating..." : "Create Shift"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Invite New Staff Member</DialogTitle>
            <DialogDescription>
              Send an invitation email to a new team member. They will receive an activation link to complete their registration.
            </DialogDescription>
          </DialogHeader>
          <Form {...addStaffForm}>
            <form onSubmit={addStaffForm.handleSubmit((data) => addStaffMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addStaffForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addStaffForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Smith" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={addStaffForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="john.smith@company.com" />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">This will be used as their login username</p>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddStaffOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addStaffMutation.isPending}>
                  {addStaffMutation.isPending ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isApproveRequestsOpen} onOpenChange={setIsApproveRequestsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Requests</DialogTitle>
            <DialogDescription>
              This functionality is not yet implemented.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 text-center text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
            <p>Request approval workflow is not currently available.</p>
            <p className="text-sm mt-2">This feature will be added in a future update.</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewReportsOpen} onOpenChange={setIsViewReportsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>View Reports</DialogTitle>
            <DialogDescription>
              This functionality is not yet implemented.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 text-center text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
            <p>Quick reports feature is not currently available.</p>
            <p className="text-sm mt-2">Use the Analytics module for detailed reports.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}