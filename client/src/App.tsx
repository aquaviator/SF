import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { Menu } from "@/components/Menu";
import { BrandedHeader } from "@/components/BrandedHeader";
import { BottomTabBar } from "@/components/BottomTabBar";
import { MoreDrawer } from "@/components/MoreDrawer";
import Dashboard from "@/pages/dashboard";
import Shifts from "@/pages/shifts";
import Staff from "@/pages/staff";
import MyWork from "@/pages/my-work";
import Opportunities from "@/pages/opportunities";
import SwapRequests from "@/pages/swap-requests";
import HolidayRequests from "@/pages/holiday-requests";
import Profile from "@/pages/profile";
import OwnerDashboard from "@/pages/owner-dashboard";
import Scheduling from "@/pages/scheduling";
import Workforce from "@/pages/workforce";
import OwnerRequests from "@/pages/owner-requests";
import BusinessSettings from "@/pages/business-settings";
import Policies from "@/pages/policies";
import Analytics from "@/pages/analytics";
import Subscription from "@/pages/subscription";
import SeatBasedSubscription from "@/pages/seat-based-subscription";
import Performance from "@/pages/performance";
import StaffStrikes from "@/pages/staff/strikes";
import StaffRequests from "@/pages/staff/requests";
import OwnerStrikes from "@/pages/owner/strikes";
import OwnerOperations from "@/pages/owner/operations";
import StaffActivation from "@/pages/staff-activation";
import BusinessRegistration from "@/pages/business-registration";
import SimplifiedRegistration from "@/pages/simplified-registration";
import RegistrationSuccess from "@/pages/registration-success";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import SiteAdminPortal from "@/pages/site-admin";
import PageBuilder from "@/pages/page-builder";
import Help from "@/pages/help";
import PublicHelp from "@/pages/public-help";
import ConfirmEmail from "@/pages/confirm-email";
import CheckEmail from "@/pages/check-email";
import ForgotPassword from "@/pages/forgot-password";
import Admin2FASetup from "@/pages/admin-2fa-setup";
import Admin2FAVerify from "@/pages/admin-2fa-verify";
import NotFound from "@/pages/not-found";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

// Component to handle dashboard redirection based on user role
function DashboardRedirect({ user }: { user: any }) {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    const targetRoute = user.role === 'owner' ? '/owner/dashboard' : '/dashboard';
    setLocation(targetRoute);
  }, [user.role, setLocation]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  );
}

// Protected routes component that wraps the main app layout
function ProtectedRoutes() {
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Layout: Sidebar + Main Content Side-by-Side */}
      <div className="flex h-screen lg:overflow-hidden">
        {/* Desktop Sidebar */}
        <Menu />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto lg:ml-0 pb-20 lg:pb-0">
          <BrandedHeader />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Switch>
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/shifts" component={Shifts} />
              <Route path="/staff" component={Staff} />
              <Route path="/my-work" component={MyWork} />
              <Route path="/opportunities" component={Opportunities} />
              <Route path="/swap-requests" component={SwapRequests} />
              <Route path="/holiday-requests" component={HolidayRequests} />
              <Route path="/staff/holiday-requests" component={HolidayRequests} />
              <Route path="/owner/dashboard" component={OwnerDashboard} />
              <Route path="/owner/profile" component={Profile} />
              <Route path="/owner/operations" component={OwnerOperations} />
              <Route path="/owner/scheduling" component={Scheduling} />
              <Route path="/owner/workforce" component={Workforce} />
              <Route path="/owner/requests" component={OwnerRequests} />
              <Route path="/owner/settings" component={BusinessSettings} />
              <Route path="/owner/policies" component={Policies} />
              <Route path="/owner/analytics" component={Analytics} />
              <Route path="/owner/subscription" component={SeatBasedSubscription} />
              <Route path="/staff/strikes" component={StaffStrikes} />
              <Route path="/staff/requests" component={StaffRequests} />
              <Route path="/staff/profile" component={Profile} />
              <Route path="/owner/strikes" component={OwnerStrikes} />
              <Route path="/staff/performance" component={Performance} />
              <Route path="/help" component={Help} />
              
              {/* Special Pages - accessible to both authenticated and unauthenticated users */}
              <Route path="/confirm-email" component={ConfirmEmail} />
              
              <Route component={NotFound} />
            </Switch>
          </div>
        </main>
      </div>
      
      {/* Mobile Navigation */}
      <BottomTabBar onMoreClick={() => setIsMoreDrawerOpen(true)} />
      <MoreDrawer 
        isOpen={isMoreDrawerOpen} 
        onClose={() => setIsMoreDrawerOpen(false)} 
      />
    </div>
  );
}

// Public routes component for unauthenticated users
function PublicRoutes() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/business-registration" component={BusinessRegistration} />
      <Route path="/register" component={BusinessRegistration} />
      <Route path="/registration-success" component={RegistrationSuccess} />
      <Route path="/activate" component={StaffActivation} />
      <Route path="/confirm-email" component={ConfirmEmail} />
      <Route path="/check-email" component={CheckEmail} />
      <Route path="/help" component={PublicHelp} />
      <Route path="/public-help" component={PublicHelp} />
      
      {/* Admin Portal Routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/2fa-setup" component={Admin2FASetup} />
      <Route path="/admin/2fa-verify" component={Admin2FAVerify} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/site-admin" component={SiteAdminPortal} />
      <Route path="/admin/page-builder" component={PageBuilder} />
      
      {/* Public pages for logged-out users */}
      <Route path="/check-email" component={CheckEmail} />
      <Route path="/confirm-email" component={ConfirmEmail} />
      
      <Route component={Landing} />
    </Switch>
  );
}

// Main router that handles authentication state
function Router() {
  const { isAuthenticated, isLoading, user } = useRole();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    // Authenticated users get the full app with appropriate dashboard
    return (
      <Switch>
        <Route path="/">
          <DashboardRedirect user={user} />
        </Route>
        <Route>
          <ProtectedRoutes />
        </Route>
      </Switch>
    );
  }

  // Unauthenticated users get public routes
  return <PublicRoutes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
