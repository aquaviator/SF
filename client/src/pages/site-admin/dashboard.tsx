import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  Shield, 
  Globe, 
  DollarSign, 
  Users, 
  Settings, 
  LogOut,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Database
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { DomainManagement } from "@/components/site-admin/DomainManagement";
import { PricingManagement } from "@/components/site-admin/PricingManagement";
import { SubscriptionOverview } from "@/components/site-admin/SubscriptionOverview";

interface SiteAdmin {
  id: number;
  username: string;
  email: string;
  role: "super_admin" | "support" | "finance" | "marketing";
  lastLogin?: string;
  is2faEnabled: boolean;
}

interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalRevenue: number;
  activeSubscriptions: number;
  domainConfigs: number;
  systemHealth: "healthy" | "warning" | "error";
}

export default function SiteAdminDashboard() {
  const [, setLocation] = useLocation();
  const [admin, setAdmin] = useState<SiteAdmin | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if admin is logged in
    const adminSession = localStorage.getItem("site_admin_session");
    if (!adminSession) {
      setLocation("/site-admin/login");
      return;
    }

    try {
      const parsedAdmin = JSON.parse(adminSession);
      setAdmin(parsedAdmin);
      console.log("🔐 ADMIN_SESSION_LOADED", { adminId: parsedAdmin.id, role: parsedAdmin.role, timestamp: new Date() });
      
      loadDashboardStats();
    } catch (error) {
      console.error("❌ ADMIN_SESSION_ERROR", { error, timestamp: new Date() });
      setLocation("/site-admin/login");
    }
  }, [setLocation]);

  const loadDashboardStats = async () => {
    try {
      console.log("📊 LOADING_DASHBOARD_STATS", { timestamp: new Date() });
      
      const response = await fetch("/api/admin/dashboard/stats");
      if (!response.ok) {
        throw new Error("Failed to load dashboard stats");
      }
      
      const statsData = await response.json();
      setStats(statsData);
      
      console.log("✅ DASHBOARD_STATS_LOADED", { stats: statsData, timestamp: new Date() });
    } catch (error) {
      console.error("❌ DASHBOARD_STATS_ERROR", { error, timestamp: new Date() });
      toast({
        title: "Error Loading Stats",
        description: "Failed to load dashboard statistics.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    console.log("🚪 ADMIN_LOGOUT", { adminId: admin?.id, timestamp: new Date() });
    localStorage.removeItem("site_admin_session");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    setLocation("/site-admin/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Site Admin Portal</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">ShiftFlo Platform Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{admin.username}</p>
                <div className="flex items-center gap-2">
                  <Badge variant={admin.role === "super_admin" ? "default" : "secondary"}>
                    {admin.role.replace("_", " ").toUpperCase()}
                  </Badge>
                  {admin.is2faEnabled && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      2FA
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTenants}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeTenants} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£{(stats.totalRevenue / 100).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeSubscriptions} subscriptions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Domain Configs</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.domainConfigs}</div>
                <p className="text-xs text-muted-foreground">
                  Environment configurations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    stats.systemHealth === "healthy" ? "bg-green-500" :
                    stats.systemHealth === "warning" ? "bg-yellow-500" : "bg-red-500"
                  }`}></div>
                  <span className="text-sm font-medium capitalize">{stats.systemHealth}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Management Tabs */}
        <Tabs defaultValue="domains" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="domains" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Domain Management
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pricing Management
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Subscription Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="domains">
            <Card>
              <CardHeader>
                <CardTitle>Domain Configuration Management</CardTitle>
                <CardDescription>
                  Manage environment-specific domain configurations for email links and redirects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DomainManagement onUpdate={loadDashboardStats} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle>Seat Pricing Management</CardTitle>
                <CardDescription>
                  Configure seat-based pricing tiers and features for the subscription model
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PricingManagement onUpdate={loadDashboardStats} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Overview</CardTitle>
                <CardDescription>
                  Monitor active subscriptions, revenue, and tenant billing status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubscriptionOverview />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}