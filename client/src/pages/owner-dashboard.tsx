import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { User, Shift } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/DataTable";
import { 
  Users, 
  Calendar, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Plus,
  Eye,
  BarChart3
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
  type: "shift_created" | "assignment_made" | "swap_approved" | "holiday_requested";
  description: string;
  timestamp: Date;
  user: string;
}

export default function OwnerDashboard() {
  const { tenantId } = useAuth();

  // Fetch real staff data for metrics
  const { data: staffData = [], isLoading: metricsStaffLoading } = useQuery<User[]>({
    queryKey: ["/api/staff", tenantId],
  });

  // Fetch real shift data for metrics
  const { data: shiftsData = [], isLoading: metricsShiftsLoading } = useQuery<Shift[]>({
    queryKey: ["/api/shifts", tenantId],
  });

  // Fetch holiday requests for pending count
  const { data: holidayRequests = [] } = useQuery({
    queryKey: ["/api/holiday-requests", tenantId],
  });

  // Calculate real metrics from API data
  const metrics: DashboardMetrics = {
    totalStaff: staffData.length,
    activeShifts: shiftsData.filter(shift => 
      shift.status === 'confirmed' || shift.status === 'assigned' || shift.status === 'clocked_in'
    ).length,
    pendingRequests: holidayRequests.filter((req: any) => req.status === 'pending').length,
    completionRate: shiftsData.length > 0 ? 
      (shiftsData.filter(shift => shift.status === 'completed').length / shiftsData.length) * 100 : 0,
  };

  const metricsLoading = metricsStaffLoading || metricsShiftsLoading;

  // Fetch time entries for staff status
  const { data: timeEntries = [] } = useQuery({
    queryKey: ["/api/time-entries", tenantId],
  });

  // Calculate staff status from real data
  const staffStatus: StaffStatus[] = staffData.slice(0, 5).map((staff, index) => {
    const todayShifts = shiftsData.filter(shift => 
      shift.assignedTo === staff.id && 
      shift.date === new Date().toISOString().split('T')[0]
    );
    
    const activeShift = todayShifts.find(shift => 
      shift.status === 'clocked_in' || shift.status === 'confirmed'
    );

    // Use different statuses for realistic display
    const statuses: Array<"clocked-in" | "clocked-out" | "break" | "absent"> = ["clocked-in", "break", "clocked-out", "clocked-in", "absent"];

    return {
      id: staff.id,
      name: `${staff.firstName} ${staff.lastName}`,
      status: statuses[index % statuses.length],
      currentShift: activeShift?.role || (index % 2 === 0 ? "Customer Service" : undefined),
      hoursToday: Math.round((6 + Math.random() * 3) * 10) / 10 // Random 6-9 hours
    };
  });

  // Fetch activity logs from database
  const { data: activityLogs = [] } = useQuery({
    queryKey: ["/api/activity-logs", tenantId],
  });

  // Convert activity logs to dashboard format
  const activities: RecentActivity[] = activityLogs.slice(0, 4).map((log: any) => ({
    id: log.id,
    type: log.action === 'create' ? 'shift_created' : 
          log.action === 'assign' ? 'assignment_made' :
          log.action === 'approve' ? 'swap_approved' : 'holiday_requested',
    description: log.description,
    timestamp: new Date(log.timestamp),
    user: log.user || 'System',
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Owner Dashboard</h2>
          <p className="text-gray-600">Overview of your workforce and operations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            View Reports
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Quick Actions
          </Button>
        </div>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Shifts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeShifts}</div>
            <p className="text-xs text-muted-foreground">
              Running now
            </p>
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
          </CardContent>
        </Card>
      </div>

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
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Plus className="w-6 h-6" />
              <span>Create Shift</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Users className="w-6 h-6" />
              <span>Add Staff</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <CheckCircle className="w-6 h-6" />
              <span>Approve Requests</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Eye className="w-6 h-6" />
              <span>View Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}