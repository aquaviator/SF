import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { createAdminAuthHook } from "@/hooks/useAdminAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TenantManagement } from "@/components/site-admin/TenantManagement";
import { PricingManagement } from "@/components/site-admin/PricingManagement";
import { DatabaseManagement } from "@/components/site-admin/DatabaseManagement";
import { SiteConfiguration } from "@/components/site-admin/SiteConfiguration";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Building2,
  Crown,
  Shield,
  Settings,
  Database,
  Globe,
  LogOut,
  Loader2
} from "lucide-react";

interface DashboardStats {
  platform: {
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    recentRegistrations: number;
    openTickets: number;
  };
  subscriptions: {
    active: number;
    trial: number;
    totalRevenue: number;
  };
  recentTickets: Array<{
    id: number;
    subject: string;
    status: string;
    priority: string;
    createdAt: string;
  }>;
}

export default function SiteAdminPortal() {
  const [, setLocation] = useLocation();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const useAdminAuth = createAdminAuthHook();
  const { admin, isLoading: authLoading, isAuthenticated, logout } = useAdminAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation('/admin/login');
    }
  }, [authLoading, isAuthenticated, setLocation]);

  // Fetch dashboard statistics
  const { data: dashboardStats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/dashboard', refreshTrigger],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const handleDataUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in_progress': return 'default';
      case 'resolved': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  // Show loading for both auth and data
  if (authLoading || (!isAuthenticated && authLoading) || (isAuthenticated && isLoading)) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="space-y-2">
            <div className="h-8 bg-muted animate-pulse rounded w-1/3"></div>
            <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Don't render portal if not authenticated (redirecting)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">ShiftFlo Site Admin Portal</h1>
              <p className="text-muted-foreground">
                Platform management and tenant administration
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="gap-2">
              <Crown className="h-4 w-4 text-yellow-600" />
              {admin?.role.replace('_', ' ').toUpperCase()} - {admin?.username}
            </Badge>
            <button
              onClick={async () => {
                await logout();
                setLocation('/admin/login');
              }}
              className="inline-flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Dashboard Overview */}
        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{dashboardStats.platform.totalTenants}</p>
                    <p className="text-sm text-muted-foreground">Total Tenants</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{dashboardStats.subscriptions.active}</p>
                    <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{dashboardStats.subscriptions.trial}</p>
                    <p className="text-sm text-muted-foreground">Trial Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">£{dashboardStats.subscriptions.totalRevenue}</p>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold">{dashboardStats.platform.openTickets}</p>
                    <p className="text-sm text-muted-foreground">Open Tickets</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Support Tickets */}
        {dashboardStats?.recentTickets && dashboardStats.recentTickets.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Recent Support Tickets
              </CardTitle>
              <CardDescription>
                Latest customer support requests requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardStats.recentTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{ticket.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getPriorityBadge(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      <Badge variant={getStatusBadge(ticket.status)}>
                        {ticket.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Management Interface */}
        <Tabs defaultValue="tenants" className="w-full">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="tenants" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Tenants</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Pricing</span>
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Database</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
            <TabsTrigger value="domains" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Domains</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Support</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tenants" className="mt-6">
            <TenantManagement onUpdate={handleDataUpdate} />
          </TabsContent>

          <TabsContent value="pricing" className="mt-6">
            <PricingManagement onUpdate={handleDataUpdate} />
          </TabsContent>

          <TabsContent value="database" className="mt-6">
            <DatabaseManagement />
          </TabsContent>

          <TabsContent value="config" className="mt-6">
            <SiteConfiguration />
          </TabsContent>

          <TabsContent value="domains" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Domain Configuration
                </CardTitle>
                <CardDescription>
                  Manage custom domains and subdomain routing for tenants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Domain management interface will be implemented here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Support Ticket Management
                </CardTitle>
                <CardDescription>
                  Manage customer support requests and resolution workflow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Support ticket management interface will be implemented here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Platform Analytics
                </CardTitle>
                <CardDescription>
                  Monitor platform performance, usage metrics, and growth trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Platform analytics dashboard will be implemented here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  Platform Settings
                </CardTitle>
                <CardDescription>
                  Configure global platform settings, integrations, and security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Platform settings interface will be implemented here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}