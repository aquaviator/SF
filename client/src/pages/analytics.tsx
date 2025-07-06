import React from "react";
import { useRole } from "@/hooks/useRole";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, FileText, Activity, Download, Filter, RefreshCw } from "lucide-react";

interface AnalyticsMetric {
  id: number;
  tenantId: string;
  metricType: string;
  metricValue: number;
  metricDate: Date;
  createdAt: Date;
}
interface AnalyticsReport {
  name: string;
  type: string;
  status: "ready" | "processing" | "failed";
  generatedAt: Date;
  downloadUrl?: string;
interface ActivityLog {
  userId: number;
  action: string;
  details: string;
  timestamp: Date;
export default function Analytics() {
  const { tenantId } = useRole();
  // Fetch analytics metrics from database
  const { data: analyticsMetrics = [], isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/analytics/metrics", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/metrics?tenantId=${tenantId}`);
      if (!response.ok) throw new Error("Failed to fetch analytics metrics");
      return response.json() as Promise<AnalyticsMetric[]>;
    },
  });
  // Fetch analytics reports from database
  const { data: analyticsReports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/analytics/reports", tenantId],
      const response = await fetch(`/api/analytics/reports?tenantId=${tenantId}`);
      if (!response.ok) throw new Error("Failed to fetch analytics reports");
      return response.json() as Promise<AnalyticsReport[]>;
  // Fetch activity logs from database
  const { data: activityLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["/api/activity-logs", tenantId],
      const response = await fetch(`/api/activity-logs?tenantId=${tenantId}`);
      if (!response.ok) throw new Error("Failed to fetch activity logs");
      return response.json() as Promise<ActivityLog[]>;
  // Calculate labor cost data from metrics
  const laborCostData = React.useMemo(() => {
    const lastSixMonths = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      
      // Find labor cost metrics for this month
      const monthlyMetrics = analyticsMetrics.filter(metric => {
        const metricDate = new Date(metric.metricDate);
        return metricDate.getMonth() === date.getMonth() && 
               metricDate.getFullYear() === date.getFullYear() &&
               metric.metricType === 'labor_cost';
      });
      const totalCost = monthlyMetrics.reduce((sum, metric) => sum + metric.metricValue, 0);
      lastSixMonths.push({
        month: monthKey,
        cost: totalCost,
        budget: 0, // Budget data would come from business settings
    }
    return lastSixMonths;
  }, [analyticsMetrics]);
  // Calculate fill rate data from metrics
  const fillRateData = React.useMemo(() => {
    const departments = ['Kitchen', 'Service', 'Management', 'Cleaning'];
    return departments.map(dept => {
      const fillRateMetrics = analyticsMetrics.filter(metric => 
        metric.metricType === 'fill_rate' && 
        metric.metricDate.toString().includes(dept.toLowerCase())
      );
      const avgFillRate = fillRateMetrics.length > 0 
        ? fillRateMetrics.reduce((sum, metric) => sum + metric.metricValue, 0) / fillRateMetrics.length 
        : 0;
      return {
        department: dept,
        fillRate: Math.round(avgFillRate),
        target: 85, // Target would come from business policies
      };
    });
  // Calculate time spend data from metrics
  const timeSpendData = React.useMemo(() => {
    const lastFourWeeks = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
      const weekLabel = `Week ${4 - i}`;
      // Find time tracking metrics for this week
      const weeklyMetrics = analyticsMetrics.filter(metric => {
        const weekEnd = new Date(weekStart.getTime() + (6 * 24 * 60 * 60 * 1000));
        return metricDate >= weekStart && metricDate <= weekEnd;
      const scheduledHours = weeklyMetrics
        .filter(m => m.metricType === 'scheduled_hours')
        .reduce((sum, metric) => sum + metric.metricValue, 0);
      const actualHours = weeklyMetrics
        .filter(m => m.metricType === 'actual_hours')
      const overtimeHours = weeklyMetrics
        .filter(m => m.metricType === 'overtime_hours')
      lastFourWeeks.push({
        week: weekLabel,
        scheduled: scheduledHours,
        actual: actualHours,
        overtime: overtimeHours,
    return lastFourWeeks;
  const getStatusBadge = (status: AnalyticsReport["status"]) => {
    const variants = {
      ready: "bg-green-100 text-green-800",
      processing: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
    };
    return (
      <Badge className={`text-xs ${variants[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };
  if (metricsLoading || reportsLoading || logsLoading) {
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Track performance and generate insights</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
              <Download className="w-4 h-4 mr-2" />
              Export
        </div>
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Labor Cost</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£0.00</div>
              <p className="text-xs text-muted-foreground">+0% from last month</p>
            </CardContent>
          </Card>
          
              <CardTitle className="text-sm font-medium">Average Fill Rate</CardTitle>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">0% from target</p>
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <div className="text-2xl font-bold">0.0h</div>
              <p className="text-xs text-muted-foreground">0.0h overtime</p>
              <CardTitle className="text-sm font-medium">Active Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">{analyticsReports.length}</div>
              <p className="text-xs text-muted-foreground">
                {analyticsReports.filter(r => r.status === 'processing').length} processing
              </p>
        {/* Charts Section */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Labor Cost Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Labor Cost Trends</CardTitle>
                  <CardDescription>Monthly labor costs vs budget</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={laborCostData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`£${value}`, '']} />
                      <Bar dataKey="cost" fill="#3b82f6" name="Actual Cost" />
                      <Bar dataKey="budget" fill="#e5e7eb" name="Budget" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              {/* Fill Rate Chart */}
                  <CardTitle>Department Fill Rates</CardTitle>
                  <CardDescription>Current vs target fill rates</CardDescription>
                    <BarChart data={fillRateData}>
                      <XAxis dataKey="department" />
                      <Tooltip formatter={(value) => [`${value}%`, '']} />
                      <Bar dataKey="fillRate" fill="#10b981" name="Current" />
                      <Bar dataKey="target" fill="#e5e7eb" name="Target" />
              {/* Time Tracking Chart */}
              <Card className="lg:col-span-2">
                  <CardTitle>Time Tracking Overview</CardTitle>
                  <CardDescription>Scheduled vs actual hours worked</CardDescription>
                    <LineChart data={timeSpendData}>
                      <XAxis dataKey="week" />
                      <Tooltip formatter={(value) => [`${value}h`, '']} />
                      <Line type="monotone" dataKey="scheduled" stroke="#3b82f6" name="Scheduled" />
                      <Line type="monotone" dataKey="actual" stroke="#10b981" name="Actual" />
                      <Line type="monotone" dataKey="overtime" stroke="#f59e0b" name="Overtime" />
                    </LineChart>
            </div>
          </TabsContent>
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Reports</CardTitle>
                <CardDescription>Generated reports and scheduled analytics</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsReports.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No reports generated yet. Create your first report to get started.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analyticsReports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{report.name}</h4>
                          <p className="text-sm text-gray-600">{report.type}</p>
                          <p className="text-xs text-gray-500">
                            Generated {new Date(report.generatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(report.status)}
                          {report.status === 'ready' && report.downloadUrl && (
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                      </div>
                    ))}
                )}
              </CardContent>
            </Card>
          <TabsContent value="activity" className="space-y-4">
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Recent system activity and user actions</CardDescription>
                {activityLogs.length === 0 ? (
                    No activity recorded yet. Activity will appear here as users interact with the system.
                    {activityLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <Activity className="w-4 h-4 mt-1 text-blue-500" />
                          <p className="font-medium">{log.action}</p>
                          <p className="text-sm text-gray-600">{log.details}</p>
                            {new Date(log.timestamp).toLocaleString()}
        </Tabs>
    </div>
  );
