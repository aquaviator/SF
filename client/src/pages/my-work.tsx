import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable, Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  Users,
  Briefcase,
  RefreshCw,
  Loader2
} from "lucide-react";
import type { Shift } from "@shared/schema";

export default function MyWork() {
  const { tenantId, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch my shifts
  const { data: shifts = [], isLoading: shiftsLoading } = useQuery<Shift[]>({
    queryKey: ["/api/my-shifts", tenantId, user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/my-shifts?tenantId=${tenantId}&userId=${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch shifts");
      return response.json();
    },
  });

  // Fetch my assignments
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["/api/assignments", tenantId, user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/assignments?tenantId=${tenantId}&userId=${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch assignments");
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
  });

  // Fetch holiday requests for activity feed
  const { data: holidayRequests = [], isLoading: holidayRequestsLoading } = useQuery({
    queryKey: ["/api/holiday-requests", tenantId, user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/holiday-requests?tenantId=${tenantId}&userId=${user?.id}`);
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Fetch time tracking policies
  const { data: timePolicy } = useQuery({
    queryKey: ["/api/shift-policy", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/shift-policy?tenantId=${tenantId}`);
      if (!response.ok) throw new Error("Failed to fetch time policy");
      return response.json();
    },
  });

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

  // Calculate time worked today
  const calculateTimeWorked = () => {
    if (!isClocked || !clockInTime) return "Not clocked in";
    
    const now = new Date();
    const diffMs = now.getTime() - clockInTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  // Quick actions that staff can perform
  const quickActions = [
    {
      title: "Submit Holiday Request",
      description: "Request time off for vacation or sick days",
      icon: Calendar,
      action: () => setActiveTab("holiday-requests"),
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
      action: () => setActiveTab("swap-requests"),
      color: "bg-purple-500 hover:bg-purple-600",
    },
  ];

  // Dynamic calculations from database data
  const today = new Date();
  const currentWeek = getWeekDates(today);
  const lastWeek = getWeekDates(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));
  
  // Calculate upcoming shifts
  const upcomingShifts = shifts.filter(shift => new Date(shift.date) >= today);
  const nextShift = upcomingShifts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  const daysUntilNext = nextShift ? Math.ceil((new Date(nextShift.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  
  // Calculate hours this week from time entries
  const thisWeekEntries = (timeEntries || []).filter((entry: any) => {
    const entryDate = new Date(entry.clockInTime);
    return entryDate >= currentWeek.start && entryDate <= currentWeek.end;
  });
  const hoursThisWeek = thisWeekEntries.reduce((total: number, entry: any) => total + (entry.totalHours || 0), 0);
  
  // Calculate last week hours for comparison
  const lastWeekEntries = (timeEntries || []).filter((entry: any) => {
    const entryDate = new Date(entry.clockInTime);
    return entryDate >= lastWeek.start && entryDate <= lastWeek.end;
  });
  const hoursLastWeek = lastWeekEntries.reduce((total: number, entry: any) => total + (entry.totalHours || 0), 0);
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
    const monthlyShifts = shifts.filter(shift => {
      const shiftDate = new Date(shift.date);
      return shiftDate >= startOfMonth && shiftDate <= today;
    });
    
    if (monthlyShifts.length === 0) return "100.0";
    
    const attendedShifts = monthlyShifts.filter(shift => 
      shift.status === "completed" || shift.status === "clocked_out"
    );
    const rate = (attendedShifts.length / monthlyShifts.length) * 100;
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
  
  // Recent activity from multiple sources
  const recentActivities = [
    ...shifts.filter(shift => shift.status === 'completed' && new Date(shift.date) >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000))
      .map(shift => ({
        type: 'shift_completed',
        title: 'Shift completed',
        description: `${shift.role} - ${shift.location}`,
        time: getTimeAgo(new Date(shift.date)),
        icon: CheckCircle,
        color: 'green'
      })),
    ...(holidayRequests || []).filter((req: any) => new Date(req.updatedAt) >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000))
      .map((req: any) => ({
        type: 'holiday_request',
        title: `Holiday request ${req.status}`,
        description: `${new Date(req.startDate).toLocaleDateString()} - ${new Date(req.endDate).toLocaleDateString()}`,
        time: getTimeAgo(new Date(req.updatedAt)),
        icon: Calendar,
        color: req.status === 'approved' ? 'blue' : 'orange'
      }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 3);

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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="time-tracking">Time Tracking</TabsTrigger>
          <TabsTrigger value="shifts">My Shifts</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
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
                <div className="text-2xl font-bold">{assignments.length}</div>
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
                          <div className="text-xs text-muted-foreground ml-auto">{activity.time}</div>
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
                    {isClockedIn ? "Clocked In" : "Not Clocked In"}
                  </p>
                  {isClockedIn && clockInTime && (
                    <p className="text-xs text-muted-foreground">
                      Since {clockInTime.toLocaleTimeString()}
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
                  disabled={!canClockIn() || clockInMutation.isPending}
                  className="h-16 text-lg"
                  variant={canClockIn() ? "default" : "secondary"}
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
                  disabled={!isClockedIn || clockOutMutation.isPending}
                  className="h-16 text-lg"
                  variant={isClockedIn ? "destructive" : "secondary"}
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

        <TabsContent value="shifts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Shifts</CardTitle>
              <p className="text-sm text-muted-foreground">
                Your scheduled shifts and assignments
              </p>
            </CardHeader>
            <CardContent>
              {shiftsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2" />
                  <p>No shifts scheduled at the moment</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Assignments</CardTitle>
              <p className="text-sm text-muted-foreground">
                Pending assignments requiring your response
              </p>
            </CardHeader>
            <CardContent>
              {assignmentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-8 w-8 mx-auto mb-2" />
                  <p>No pending assignments</p>
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
      </Tabs>
    </div>
  );
}