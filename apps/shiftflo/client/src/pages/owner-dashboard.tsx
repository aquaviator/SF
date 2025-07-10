import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { Link } from "wouter";
import { 
  Users, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Activity,
  UserCheck,
  UserX,
  CalendarDays,
  Briefcase
} from "lucide-react";

interface ShiftCoverage {
  active: number;
  upcoming: number;
  unfilled: number;
  underUtilized: number;
}

interface Shift {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  role: string;
  status: string;
  assignedTo: number | null;
  location: string;
}

interface ActivityLog {
  id: number;
  action: string;
  details: string;
  createdAt: string;
}

interface Staff {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
  status?: string;
}

interface TimeEntry {
  id: number;
  userId: number;
  status: string;
  clockInTime: string;
  totalHours: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const { tenantId } = useRole();

  // Fetch shift coverage data
  const { data: shiftCoverage, isLoading: coverageLoading } = useQuery<ShiftCoverage>({
    queryKey: ["/api/dashboard/shift-coverage", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/shift-coverage?tenantId=${tenantId}`);
      if (!response.ok) throw new Error('Failed to fetch shift coverage');
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Fetch all shifts for detailed breakdown
  const { data: shifts = [], isLoading: shiftsLoading } = useQuery<Shift[]>({
    queryKey: ["/api/shifts", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/shifts?tenantId=${tenantId}`);
      if (!response.ok) throw new Error('Failed to fetch shifts');
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Fetch activity logs
  const { data: activities = [], isLoading: activitiesLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/activity-logs?tenantId=${tenantId}`);
      if (!response.ok) throw new Error('Failed to fetch activity logs');
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Fetch staff data
  const { data: staff = [], isLoading: staffLoading } = useQuery<Staff[]>({
    queryKey: ["/api/staff", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/staff?tenantId=${tenantId}`);
      if (!response.ok) throw new Error('Failed to fetch staff');
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Fetch live time entries for staff status
  const { data: timeEntries = [], isLoading: timeEntriesLoading } = useQuery<TimeEntry[]>({
    queryKey: ["/api/dashboard/live-time-entries", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/live-time-entries?tenantId=${tenantId}`);
      if (!response.ok) throw new Error('Failed to fetch time entries');
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Calculate shift statistics from real data
  const shiftStats = {
    total: shifts.length,
    assigned: shifts.filter(s => s.status === 'assigned').length,
    confirmed: shifts.filter(s => s.status === 'confirmed').length,
    open: shifts.filter(s => s.status === 'open').length,
    declined: shifts.filter(s => s.status === 'declined').length
  };

  // Calculate staff utilization
  const staffWorking = timeEntries.filter(te => ['clocked_in', 'on_break', 'late'].includes(te.status)).length;
  const staffUtilization = staff.length > 0 ? Math.round((staffWorking / staff.length) * 100) : 0;

  // Get today's shifts
  const today = new Date().toISOString().split('T')[0];
  const todayShifts = shifts.filter(s => s.date === today);

  // Get this week's shifts (next 7 days)
  const weekStart = new Date();
  const weekEnd = new Date();
  weekEnd.setDate(weekStart.getDate() + 7);
  
  const thisWeekShifts = shifts.filter(s => {
    const shiftDate = new Date(s.date);
    return shiftDate >= weekStart && shiftDate <= weekEnd;
  });

  const isLoading = coverageLoading || shiftsLoading || activitiesLoading || staffLoading || timeEntriesLoading;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Owner Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName} {user?.lastName}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/owner/scheduling">
            <Button size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              View Schedule
            </Button>
          </Link>
          <Link href="/owner/operations">
            <Button variant="outline" size="sm">
              <Activity className="h-4 w-4 mr-2" />
              Live Operations
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{staff.length}</p>
                <p className="text-xs text-muted-foreground">Total Staff</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{staffUtilization}%</p>
                <p className="text-xs text-muted-foreground">Staff Utilisation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{shiftStats.open}</p>
                <p className="text-xs text-muted-foreground">Open Opportunities</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{shiftStats.assigned}</p>
                <p className="text-xs text-muted-foreground">Assigned Shifts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{shiftStats.confirmed}</p>
                <p className="text-xs text-muted-foreground">Confirmed Shifts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{staffWorking}</p>
                <p className="text-xs text-muted-foreground">Staff Working</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{shiftCoverage?.unfilled || 0}</p>
                <p className="text-xs text-muted-foreground">Unfilled Shifts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Shift Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Today's Shifts ({todayShifts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayShifts.length === 0 ? (
              <p className="text-muted-foreground">No shifts scheduled for today</p>
            ) : (
              todayShifts.map((shift) => (
                <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{shift.role}</p>
                    <p className="text-sm text-muted-foreground">
                      {shift.startTime} - {shift.endTime} • {shift.location}
                    </p>
                  </div>
                  <Badge variant={
                    shift.status === 'confirmed' ? 'default' : 
                    shift.status === 'assigned' ? 'secondary' :
                    shift.status === 'open' ? 'outline' : 'destructive'
                  }>
                    {shift.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Staff Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {staff.length === 0 ? (
              <p className="text-muted-foreground">No staff members found</p>
            ) : (
              staff.slice(0, 6).map((member) => {
                const timeEntry = timeEntries.find(te => te.userId === member.id);
                const status = timeEntry?.status || 'available';
                
                return (
                  <div key={member.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{member.firstName} {member.lastName}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                    <Badge variant={
                      ['clocked_in', 'on_break', 'late'].includes(status) ? 'default' :
                      status === 'available' ? 'secondary' : 'outline'
                    }>
                      {status === 'clocked_in' ? 'Working' :
                       status === 'on_break' ? 'On Break' :
                       status === 'late' ? 'Late' :
                       'Available'}
                    </Badge>
                  </div>
                );
              })
            )}
            {staff.length > 6 && (
              <Link href="/owner/workforce">
                <Button variant="outline" size="sm" className="w-full">
                  View All Staff ({staff.length})
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-muted-foreground">No recent activity</p>
            ) : (
              activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="space-y-1">
                  <p className="text-sm">{activity.details}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Week Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            This Week's Overview ({thisWeekShifts.length} shifts)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-700">{thisWeekShifts.length}</p>
              <p className="text-sm text-blue-600">Total Shifts</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">
                {thisWeekShifts.filter(s => s.status === 'confirmed').length}
              </p>
              <p className="text-sm text-green-600">Confirmed</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-700">
                {thisWeekShifts.filter(s => s.status === 'assigned').length}
              </p>
              <p className="text-sm text-yellow-600">Assigned</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-700">
                {thisWeekShifts.filter(s => s.status === 'open').length}
              </p>
              <p className="text-sm text-gray-600">Open</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Daily Breakdown</h4>
            {Array.from({ length: 7 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() + i);
              const dateStr = date.toISOString().split('T')[0];
              const dayShifts = shifts.filter(s => s.date === dateStr);
              
              return (
                <div key={dateStr} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {dayShifts.length === 0 ? (
                      <span className="text-muted-foreground">No shifts</span>
                    ) : (
                      dayShifts.map((shift, idx) => (
                        <Badge 
                          key={idx}
                          variant={
                            shift.status === 'confirmed' ? 'default' : 
                            shift.status === 'assigned' ? 'secondary' :
                            'outline'
                          }
                        >
                          {shift.role}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/owner/scheduling">
              <Button className="w-full h-auto flex-col gap-2 p-4">
                <Calendar className="h-6 w-6" />
                <span>Create Shift</span>
              </Button>
            </Link>
            <Link href="/owner/workforce">
              <Button className="w-full h-auto flex-col gap-2 p-4" variant="outline">
                <Users className="h-6 w-6" />
                <span>Add Staff</span>
              </Button>
            </Link>
            <Link href="/owner/requests">
              <Button className="w-full h-auto flex-col gap-2 p-4" variant="outline">
                <CheckCircle className="h-6 w-6" />
                <span>Approve Requests</span>
              </Button>
            </Link>
            <Link href="/owner/analytics">
              <Button className="w-full h-auto flex-col gap-2 p-4" variant="outline">
                <Briefcase className="h-6 w-6" />
                <span>View Reports</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}