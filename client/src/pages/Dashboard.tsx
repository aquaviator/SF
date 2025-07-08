import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, TrendingUp, Plus, Bell } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: shifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ['/api/shifts', user?.tenantId],
    enabled: !!user?.tenantId,
  });

  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: ['/api/staff', user?.tenantId],
    enabled: !!user?.tenantId && user?.role === 'owner',
  });

  const todayShifts = shifts.filter(shift => {
    const today = new Date().toISOString().split('T')[0];
    return shift.date === today;
  });

  const upcomingShifts = shifts.filter(shift => {
    const today = new Date().toISOString().split('T')[0];
    return shift.date > today;
  }).slice(0, 5);

  const openShifts = shifts.filter(shift => shift.status === 'open');
  const assignedShifts = shifts.filter(shift => shift.status === 'assigned');

  if (shiftsLoading || staffLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.firstName} {user?.lastName}
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName} {user?.lastName}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/shifts/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Shift
            </Button>
          </Link>
          <Button variant="outline">
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Shifts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayShifts.length}</div>
            <p className="text-xs text-muted-foreground">
              {todayShifts.filter(s => s.status === 'confirmed').length} confirmed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Shifts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openShifts.length}</div>
            <p className="text-xs text-muted-foreground">
              Need assignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.filter(s => s.isActive).length}</div>
            <p className="text-xs text-muted-foreground">
              {staff.length} total staff
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedShifts.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Shifts */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Shifts</CardTitle>
          <CardDescription>
            Shifts scheduled for today
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayShifts.length === 0 ? (
            <p className="text-muted-foreground">No shifts scheduled for today</p>
          ) : (
            <div className="space-y-4">
              {todayShifts.map((shift) => (
                <div key={shift.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h4 className="font-medium">{shift.role}</h4>
                      <p className="text-sm text-muted-foreground">
                        {shift.startTime} - {shift.endTime} • {shift.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      shift.status === 'confirmed' ? 'default' :
                      shift.status === 'assigned' ? 'secondary' :
                      shift.status === 'open' ? 'outline' : 'destructive'
                    }>
                      {shift.status}
                    </Badge>
                    {shift.assignedTo && (
                      <span className="text-sm text-muted-foreground">
                        Staff ID: {shift.assignedTo}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Shifts */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Shifts</CardTitle>
          <CardDescription>
            Next 5 scheduled shifts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingShifts.length === 0 ? (
            <p className="text-muted-foreground">No upcoming shifts</p>
          ) : (
            <div className="space-y-4">
              {upcomingShifts.map((shift) => (
                <div key={shift.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h4 className="font-medium">{shift.role}</h4>
                      <p className="text-sm text-muted-foreground">
                        {shift.date} • {shift.startTime} - {shift.endTime} • {shift.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      shift.status === 'confirmed' ? 'default' :
                      shift.status === 'assigned' ? 'secondary' :
                      shift.status === 'open' ? 'outline' : 'destructive'
                    }>
                      {shift.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/shifts/create">
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Shift
              </Button>
            </Link>
            <Link href="/shifts">
              <Button variant="outline" className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                View Schedule
              </Button>
            </Link>
            <Link href="/staff">
              <Button variant="outline" className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Manage Staff
              </Button>
            </Link>
            <Link href="/opportunities">
              <Button variant="outline" className="w-full">
                <Clock className="h-4 w-4 mr-2" />
                View Opportunities
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}