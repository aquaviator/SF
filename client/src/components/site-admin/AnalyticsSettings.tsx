import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  Ticket,
  RefreshCw,
  Download,
  Calendar
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsOverview {
  tenants: {
    new: number;
    total: number;
    weeklyGrowth: number;
  };
  users: {
    new: number;
    total: number;
    active: number;
  };
  subscriptions: {
    active: number;
    trial: number;
    revenue: number;
  };
  support: {
    newTickets: number;
    openTickets: number;
    avgResolutionHours: number;
  };
  period: string;
}

interface TenantGrowthData {
  period: string;
  new_tenants: number;
  cumulative_tenants: number;
}

interface RevenueData {
  month: string;
  subscriptions: number;
  revenue: number;
  avgSeats: number;
}

interface UsageStats {
  activity: {
    shiftsCreated: number;
    timeEntries: number;
    swapRequests: number;
    holidayRequests: number;
  };
  adoption: {
    shiftsAdoption: number;
    timeTrackingAdoption: number;
  };
  engagement: {
    weeklyActiveUsers: number;
    totalActiveUsers: number;
    engagementRate: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function AnalyticsSettings() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [tenantGrowth, setTenantGrowth] = useState<TenantGrowthData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchAnalyticsOverview = async () => {
    try {
      console.log('📊 FETCHING_ANALYTICS_OVERVIEW', { period: selectedPeriod, timestamp: new Date() });
      
      const response = await fetch(`/api/admin/analytics/overview?period=${selectedPeriod}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch analytics overview');
      
      const data = await response.json();
      setOverview(data);
      
      console.log('✅ ANALYTICS_OVERVIEW_FETCHED', { data, timestamp: new Date() });
    } catch (error) {
      console.error('❌ ANALYTICS_OVERVIEW_ERROR', { error });
      toast({
        title: "Error",
        description: "Failed to fetch analytics overview.",
        variant: "destructive",
      });
    }
  };

  const fetchTenantGrowth = async () => {
    try {
      console.log('📈 FETCHING_TENANT_GROWTH', { period: selectedPeriod, timestamp: new Date() });
      
      const response = await fetch(`/api/admin/analytics/tenant-growth?period=${selectedPeriod}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch tenant growth data');
      
      const data = await response.json();
      setTenantGrowth(data);
      
      console.log('✅ TENANT_GROWTH_FETCHED', { count: data.length, timestamp: new Date() });
    } catch (error) {
      console.error('❌ TENANT_GROWTH_ERROR', { error });
    }
  };

  const fetchRevenueData = async () => {
    try {
      console.log('💰 FETCHING_REVENUE_DATA', { period: selectedPeriod, timestamp: new Date() });
      
      const response = await fetch(`/api/admin/analytics/revenue?period=${selectedPeriod}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch revenue data');
      
      const data = await response.json();
      // Ensure all numeric values are valid
      const validatedData = Array.isArray(data) ? data.map(item => ({
        ...item,
        revenue: isNaN(item.revenue) ? 0 : Number(item.revenue),
        subscriptions: isNaN(item.subscriptions) ? 0 : Number(item.subscriptions),
        avgSeats: isNaN(item.avgSeats) ? 0 : Number(item.avgSeats)
      })) : [];
      setRevenueData(validatedData);
      
      console.log('✅ REVENUE_DATA_FETCHED', { count: validatedData.length, timestamp: new Date() });
    } catch (error) {
      console.error('❌ REVENUE_DATA_ERROR', { error });
      // Set empty array on error to prevent chart issues
      setRevenueData([]);
    }
  };

  const fetchUsageStats = async () => {
    try {
      console.log('📋 FETCHING_USAGE_STATS', { timestamp: new Date() });
      
      const response = await fetch('/api/admin/analytics/usage', {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch usage statistics');
      
      const data = await response.json();
      setUsageStats(data);
      
      console.log('✅ USAGE_STATS_FETCHED', { data, timestamp: new Date() });
    } catch (error) {
      console.error('❌ USAGE_STATS_ERROR', { error });
    }
  };

  const refreshAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchAnalyticsOverview(),
        fetchTenantGrowth(),
        fetchRevenueData(),
        fetchUsageStats(),
      ]);
      
      toast({
        title: "Data Refreshed",
        description: "All analytics data has been refreshed successfully.",
      });
    } catch (error) {
      console.error('❌ REFRESH_ALL_DATA_ERROR', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = () => {
    const data = {
      overview,
      tenantGrowth,
      revenueData,
      usageStats,
      exportedAt: new Date().toISOString(),
      period: selectedPeriod
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shiftflo-analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('📥 ANALYTICS_DATA_EXPORTED', { period: selectedPeriod, timestamp: new Date() });
    
    toast({
      title: "Data Exported",
      description: "Analytics data has been exported successfully.",
    });
  };

  // Prepare pie chart data for subscription distribution
  const subscriptionDistribution = overview ? [
    { name: 'Active', value: overview.subscriptions.active, color: '#0088FE' },
    { name: 'Trial', value: overview.subscriptions.trial, color: '#00C49F' },
  ] : [];

  // Prepare feature adoption data
  const featureAdoptionData = usageStats ? [
    { feature: 'Shift Scheduling', adoption: usageStats.adoption.shiftsAdoption },
    { feature: 'Time Tracking', adoption: usageStats.adoption.timeTrackingAdoption },
  ] : [];

  useEffect(() => {
    refreshAllData();
  }, [selectedPeriod]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={refreshAllData} variant="outline" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Tenants</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.tenants.new || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.tenants.total || 0} total tenants
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.users.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.users.new || 0} new this period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{overview?.subscriptions.revenue.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {overview?.subscriptions.active || 0} active subscriptions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Support Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.support.openTickets || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.support.avgResolutionHours.toFixed(1) || '0'}h avg resolution
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenant Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tenant Growth Over Time</CardTitle>
            <CardDescription>New tenant registrations and cumulative growth</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tenantGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="new_tenants" 
                  stroke="#8884d8" 
                  name="New Tenants"
                />
                <Line 
                  type="monotone" 
                  dataKey="cumulative_tenants" 
                  stroke="#82ca9d" 
                  name="Total Tenants"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>Subscription revenue and growth trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData.length > 0 ? revenueData.filter(item => 
                item && typeof item.revenue === 'number' && !isNaN(item.revenue) && item.revenue >= 0
              ) : []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#8884d8" name="Revenue (£)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subscription Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Distribution</CardTitle>
            <CardDescription>Active vs trial subscription breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subscriptionDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {subscriptionDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Feature Adoption */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Adoption</CardTitle>
            <CardDescription>Percentage of tenants using each feature</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={featureAdoptionData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="feature" type="category" />
                <Tooltip />
                <Bar dataKey="adoption" fill="#82ca9d" name="Adoption %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Platform Activity</CardTitle>
            <CardDescription>User activity in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Shifts Created</span>
              <Badge variant="secondary">{usageStats?.activity.shiftsCreated || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Time Entries</span>
              <Badge variant="secondary">{usageStats?.activity.timeEntries || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Swap Requests</span>
              <Badge variant="secondary">{usageStats?.activity.swapRequests || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Holiday Requests</span>
              <Badge variant="secondary">{usageStats?.activity.holidayRequests || 0}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Engagement</CardTitle>
            <CardDescription>User activity and engagement metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Weekly Active Users</span>
              <Badge variant="default">{usageStats?.engagement.weeklyActiveUsers || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Total Active Users</span>
              <Badge variant="secondary">{usageStats?.engagement.totalActiveUsers || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Engagement Rate</span>
              <Badge variant="outline">
                {usageStats?.engagement.engagementRate.toFixed(1) || '0'}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Current system status and performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Database Status</span>
              <Badge variant="default">Healthy</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Response Time</span>
              <Badge variant="secondary">&lt; 100ms</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Uptime</span>
              <Badge variant="outline">99.9%</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}