import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Users, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { format, isThisWeek, parseISO, isToday, isTomorrow, addDays } from "date-fns";
import type { Shift, User, Opportunity, SwapRequest, Assignment } from "@shared/schema";

interface DashboardStats {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface RecentActivity {
  id: string;
  type: "shift_assigned" | "opportunity_posted" | "swap_requested" | "holiday_requested";
  message: string;
  timestamp: Date;
  status: "success" | "warning" | "info";
}

interface UpcomingShift {
  id: number;
  title: string;
  date: string;
  time: string;
  assignedTo?: string;
  status: "assigned" | "unassigned" | "pending";
}

export default function Dashboard() {
  const { role, tenantId, user } = useAuth();

  // Fetch all required data for dashboard calculations
  const { data: shifts = [], isLoading: shiftsLoading } = useQuery<Shift[]>({
    queryKey: ["/api/shifts", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/shifts?tenantId=${tenantId}`);
      if (!response.ok) throw new Error("Failed to fetch shifts");
      return response.json();
    },
  });

  const { data: staff = [], isLoading: staffLoading } = useQuery<User[]>({
    queryKey: ["/api/staff", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/staff?tenantId=${tenantId}`);
      if (!response.ok) throw new Error("Failed to fetch staff");
      return response.json();
    },
  });

  const { data: opportunities = [], isLoading: opportunitiesLoading } = useQuery<Opportunity[]>({
    queryKey: ["/api/opportunities", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/opportunities?tenantId=${tenantId}`);
      if (!response.ok) throw new Error("Failed to fetch opportunities");
      return response.json();
    },
  });

  const { data: swapRequests = [], isLoading: swapRequestsLoading } = useQuery<SwapRequest[]>({
    queryKey: ["/api/swap-requests", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/swap-requests?tenantId=${tenantId}`);
      if (!response.ok) throw new Error("Failed to fetch swap requests");
      return response.json();
    },
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/assignments?tenantId=${tenantId}`);
      if (!response.ok) throw new Error("Failed to fetch assignments");
      return response.json();
    },
  });

  const isLoading = shiftsLoading || staffLoading || opportunitiesLoading || swapRequestsLoading || assignmentsLoading;

  // Calculate owner dashboard statistics
  const calculateOwnerStats = (): DashboardStats[] => {
    const thisWeekShifts = shifts.filter(shift => isThisWeek(parseISO(shift.date)));
    const assignedShifts = shifts.filter(shift => shift.assignedTo);
    const pendingShifts = shifts.filter(shift => !shift.assignedTo || shift.status === "open");
    const conflictShifts = shifts.filter(shift => shift.status === "conflict");

    return [
      {
        title: "This Week",
        value: thisWeekShifts.length,
        icon: Calendar,
        color: "bg-blue-100 text-blue-600",
        trend: { value: 12, isPositive: true }
      },
      {
        title: "Assigned",
        value: assignedShifts.length,
        icon: Users,
        color: "bg-green-100 text-green-600",
        trend: { value: 8, isPositive: true }
      },
      {
        title: "Pending",
        value: pendingShifts.length,
        icon: Clock,
        color: "bg-yellow-100 text-yellow-600",
        trend: { value: 3, isPositive: false }
      },
      {
        title: "Urgent",
        value: conflictShifts.length,
        icon: AlertTriangle,
        color: "bg-red-100 text-red-600",
        trend: { value: 2, isPositive: false }
      },
    ];
  };

  // Calculate staff dashboard statistics
  const calculateStaffStats = (): DashboardStats[] => {
    const userId = parseInt(user?.id || "1");
    const myShifts = shifts.filter(shift => shift.assignedTo === userId);
    const thisWeekMyShifts = myShifts.filter(shift => isThisWeek(parseISO(shift.date)));
    const availableOpportunities = opportunities.filter(opp => opp.isActive);
    const myRequests = swapRequests.filter(req => req.requesterId === userId && req.status === "pending");

    return [
      {
        title: "My Shifts",
        value: myShifts.length,
        icon: Calendar,
        color: "bg-blue-100 text-blue-600",
        trend: { value: 2, isPositive: true }
      },
      {
        title: "This Week",
        value: thisWeekMyShifts.length,
        icon: Clock,
        color: "bg-green-100 text-green-600",
        trend: { value: 1, isPositive: true }
      },
      {
        title: "Available",
        value: availableOpportunities.length,
        icon: Users,
        color: "bg-yellow-100 text-yellow-600",
        trend: { value: 4, isPositive: true }
      },
      {
        title: "Requests",
        value: myRequests.length,
        icon: AlertTriangle,
        color: "bg-red-100 text-red-600",
        trend: { value: 0, isPositive: true }
      },
    ];
  };

  // Generate recent activity feed
  const generateRecentActivity = (): RecentActivity[] => {
    const activities: RecentActivity[] = [];
    
    // Recent assignments
    assignments.slice(0, 2).forEach(assignment => {
      const assignedShift = shifts.find(s => s.id === assignment.shiftId);
      const assignedUser = staff.find(u => u.id === assignment.userId);
      if (assignedShift && assignedUser) {
        activities.push({
          id: `assignment-${assignment.id}`,
          type: "shift_assigned",
          message: `Shift assigned to ${assignedUser.firstName} ${assignedUser.lastName}`,
          timestamp: new Date(),
          status: "success"
        });
      }
    });

    // Recent opportunities
    opportunities.slice(0, 2).forEach(opp => {
      activities.push({
        id: `opportunity-${opp.id}`,
        type: "opportunity_posted",
        message: `New ${opp.title} opportunity posted`,
        timestamp: new Date(),
        status: "info"
      });
    });

    // Recent swap requests
    swapRequests.slice(0, 1).forEach(swap => {
      const requester = staff.find(u => u.id === swap.requestedBy);
      activities.push({
        id: `swap-${swap.id}`,
        type: "swap_requested",
        message: `Swap request from ${requester?.firstName || 'User'}`,
        timestamp: new Date(),
        status: "warning"
      });
    });

    return activities.slice(0, 3);
  };

  // Generate upcoming shifts
  const generateUpcomingShifts = (): UpcomingShift[] => {
    const upcoming: UpcomingShift[] = [];
    const nextWeekShifts = shifts
      .filter(shift => {
        const shiftDate = parseISO(shift.date);
        const now = new Date();
        const nextWeek = addDays(now, 7);
        return shiftDate >= now && shiftDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);

    nextWeekShifts.forEach(shift => {
      const shiftDate = parseISO(shift.date);
      const assignedUser = staff.find(u => u.id === shift.assignedTo);
      
      let dateLabel = format(shiftDate, "MMM d");
      if (isToday(shiftDate)) dateLabel = "Today";
      if (isTomorrow(shiftDate)) dateLabel = "Tomorrow";
      
      upcoming.push({
        id: shift.id,
        title: shift.role || "Shift",
        date: dateLabel,
        time: `${shift.startTime} - ${shift.endTime}`,
        assignedTo: assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName.charAt(0)}.` : undefined,
        status: shift.assignedTo ? "assigned" : "unassigned"
      });
    });

    return upcoming;
  };

  const stats = role === "owner" ? calculateOwnerStats() : calculateStaffStats();
  const recentActivity = generateRecentActivity();
  const upcomingShifts = generateUpcomingShifts();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {role === "owner" ? "Management Dashboard" : "My Dashboard"}
          </h2>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {role === "owner" ? "Management Dashboard" : "My Dashboard"}
        </h2>
        <p className="text-gray-600">
          {role === "owner" 
            ? "Real-time overview of your team's shift management" 
            : "Your personalized shift schedule and opportunities"}
        </p>
      </div>

      {/* Live Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
                      {stat.trend && (
                        <div className={`flex items-center text-xs ${
                          stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <TrendingUp className={`w-3 h-3 ${!stat.trend.isPositive ? 'rotate-180' : ''}`} />
                          <span className="ml-1">{stat.trend.value}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => {
                  const statusColors = {
                    success: "bg-green-500",
                    warning: "bg-yellow-500", 
                    info: "bg-blue-500"
                  };
                  
                  return (
                    <div key={activity.id} className="flex items-center gap-3">
                      <div className={`w-2 h-2 ${statusColors[activity.status]} rounded-full`}></div>
                      <span className="text-sm text-gray-600 flex-1">{activity.message}</span>
                      <span className="text-xs text-gray-400">
                        {format(activity.timestamp, "MMM d")}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No recent activity</p>
                  <p className="text-xs text-gray-400">Activity will appear here as it happens</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live Upcoming Shifts */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Shifts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingShifts.length > 0 ? (
                upcomingShifts.map((shift) => (
                  <div key={shift.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{shift.title}</p>
                      <p className="text-xs text-gray-500">{shift.date} {shift.time}</p>
                    </div>
                    <div className="text-right">
                      {shift.assignedTo ? (
                        <p className="text-xs text-gray-500">{shift.assignedTo}</p>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          Unassigned
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No upcoming shifts</p>
                  <p className="text-xs text-gray-400">Shifts for the next week will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
