import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Award,
  Calendar,
  Target
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface PerformanceMetric {
  id: number;
  userId: number;
  metricType: string;
  value: number;
  period: string;
  date: Date;
}

interface AttendanceData {
  month: string;
  attendance: number;
  punctuality: number;
  target: number;
}

interface ShiftData {
  week: string;
  completed: number;
  missed: number;
  late: number;
}

export default function Performance() {
  const { user, tenantId } = useAuth();
  const [timeRange, setTimeRange] = React.useState("last-6-months");
  
  // Fetch performance metrics
  const { data: performanceMetrics = [] } = useQuery({
    queryKey: ["/api/performance-metrics", tenantId, user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/performance-metrics?tenantId=${tenantId}&userId=${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch performance metrics");
      return response.json();
    },
  });

  // Fetch user's shifts for performance calculation
  const { data: userShifts = [] } = useQuery({
    queryKey: ["/api/shifts", tenantId, user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/shifts?tenantId=${tenantId}&userId=${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch shifts");
      return response.json();
    },
  });

  // Fetch time entries for punctuality data
  const { data: timeEntries = [] } = useQuery({
    queryKey: ["/api/time-entries", tenantId, user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/time-entries?tenantId=${tenantId}&userId=${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch time entries");
      return response.json();
    },
  });

  // Calculate attendance data from real shifts and time entries
  const attendanceData: AttendanceData[] = React.useMemo(() => {
    if (!Array.isArray(userShifts) || userShifts.length === 0) {
      return [
        { month: "Jan", attendance: 0, punctuality: 0, target: 95 },
        { month: "Feb", attendance: 0, punctuality: 0, target: 95 },
        { month: "Mar", attendance: 0, punctuality: 0, target: 95 },
        { month: "Apr", attendance: 0, punctuality: 0, target: 95 },
        { month: "May", attendance: 0, punctuality: 0, target: 95 },
        { month: "Jun", attendance: 0, punctuality: 0, target: 95 },
      ];
    }

    const monthlyData = userShifts.reduce((acc: Record<string, any>, shift: any) => {
      const date = new Date(shift.date);
      const month = date.toLocaleString('default', { month: 'short' });
      
      if (!acc[month]) {
        acc[month] = { total: 0, attended: 0, onTime: 0 };
      }
      
      acc[month].total++;
      
      // Check if shift was attended (has time entry or completed status)
      const hasTimeEntry = timeEntries.some((entry: any) => entry.shiftId === shift.id);
      const isCompleted = shift.status === 'completed' || shift.status === 'clocked_out';
      
      if (hasTimeEntry || isCompleted) {
        acc[month].attended++;
        
        // Check punctuality from time entries
        const timeEntry = timeEntries.find((entry: any) => entry.shiftId === shift.id);
        if (timeEntry && timeEntry.status !== 'late') {
          acc[month].onTime++;
        }
      }
      
      return acc;
    }, {});

    return Object.entries(monthlyData).map(([month, data]: [string, any]) => ({
      month,
      attendance: data.total > 0 ? Math.round((data.attended / data.total) * 100) : 0,
      punctuality: data.attended > 0 ? Math.round((data.onTime / data.attended) * 100) : 0,
      target: 95,
    }));
  }, [userShifts, timeEntries]);

  // Calculate weekly shift performance
  const shiftData: ShiftData[] = React.useMemo(() => {
    if (!Array.isArray(userShifts) || userShifts.length === 0) {
      return [
        { week: "Week 1", completed: 0, missed: 0, late: 0 },
        { week: "Week 2", completed: 0, missed: 0, late: 0 },
        { week: "Week 3", completed: 0, missed: 0, late: 0 },
        { week: "Week 4", completed: 0, missed: 0, late: 0 },
      ];
    }

    const weeklyData = userShifts.reduce((acc: Record<string, any>, shift: any) => {
      const date = new Date(shift.date);
      const week = `Week ${Math.ceil(date.getDate() / 7)}`;
      
      if (!acc[week]) {
        acc[week] = { completed: 0, missed: 0, late: 0 };
      }
      
      const timeEntry = timeEntries.find((entry: any) => entry.shiftId === shift.id);
      
      if (shift.status === 'completed' || timeEntry) {
        acc[week].completed++;
        if (timeEntry?.status === 'late') {
          acc[week].late++;
        }
      } else if (shift.status === 'cancelled' || !timeEntry) {
        acc[week].missed++;
      }
      
      return acc;
    }, {});

    return Object.entries(weeklyData).map(([week, data]: [string, any]) => ({
      week,
      completed: data.completed,
      missed: data.missed,
      late: data.late,
    }));
  }, [userShifts, timeEntries]);

  // Calculate summary statistics
  const summaryStats = React.useMemo(() => {
    const totalShifts = userShifts.length;
    const completedShifts = userShifts.filter((shift: any) => 
      shift.status === 'completed' || timeEntries.some((entry: any) => entry.shiftId === shift.id)
    ).length;
    const lateShifts = timeEntries.filter((entry: any) => entry.status === 'late').length;
    const attendanceRate = totalShifts > 0 ? Math.round((completedShifts / totalShifts) * 100) : 0;
    const punctualityRate = completedShifts > 0 ? Math.round(((completedShifts - lateShifts) / completedShifts) * 100) : 0;

    return {
      totalShifts,
      completedShifts,
      attendanceRate,
      punctualityRate,
      totalHours: timeEntries.reduce((sum: number, entry: any) => sum + (parseFloat(entry.totalHours) || 0), 0),
    };
  }, [userShifts, timeEntries]);

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Performance</h1>
          <p className="text-muted-foreground">Track your work performance and attendance</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last-30-days">Last 30 Days</SelectItem>
            <SelectItem value="last-3-months">Last 3 Months</SelectItem>
            <SelectItem value="last-6-months">Last 6 Months</SelectItem>
            <SelectItem value="last-year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total Shifts</p>
                <p className="text-lg font-bold">{summaryStats.totalShifts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-lg font-bold">{summaryStats.completedShifts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Attendance</p>
                <p className="text-lg font-bold">{summaryStats.attendanceRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Punctuality</p>
                <p className="text-lg font-bold">{summaryStats.punctualityRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total Hours</p>
                <p className="text-lg font-bold">{summaryStats.totalHours.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="attendance">Attendance & Punctuality</TabsTrigger>
          <TabsTrigger value="shifts">Shift Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Attendance & Punctuality Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="attendance" stroke="#8884d8" name="Attendance %" />
                  <Line type="monotone" dataKey="punctuality" stroke="#82ca9d" name="Punctuality %" />
                  <Line type="monotone" dataKey="target" stroke="#ff7300" strokeDasharray="5 5" name="Target %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shifts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Weekly Shift Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={shiftData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="#8884d8" name="Completed" />
                  <Bar dataKey="late" fill="#ffc658" name="Late" />
                  <Bar dataKey="missed" fill="#ff7300" name="Missed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Performance Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Performance Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Attendance Rate</p>
              <p className="text-sm text-muted-foreground">Target: 95%</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(summaryStats.attendanceRate, 100)}%` }}
                />
              </div>
              <Badge variant={summaryStats.attendanceRate >= 95 ? "default" : "secondary"}>
                {summaryStats.attendanceRate}%
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Punctuality Rate</p>
              <p className="text-sm text-muted-foreground">Target: 90%</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(summaryStats.punctualityRate, 100)}%` }}
                />
              </div>
              <Badge variant={summaryStats.punctualityRate >= 90 ? "default" : "secondary"}>
                {summaryStats.punctualityRate}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}