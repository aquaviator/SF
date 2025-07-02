import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { Menu } from "@/components/Menu";
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
import BusinessSettings from "@/pages/business-settings";
import Policies from "@/pages/policies";
import Analytics from "@/pages/analytics";
import Subscription from "@/pages/subscription";
import NotFound from "@/pages/not-found";
import { useState } from "react";

function Router() {
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Layout: Sidebar + Main Content Side-by-Side */}
      <div className="flex h-screen lg:overflow-hidden">
        {/* Desktop Sidebar */}
        <Menu />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto lg:ml-0 pb-20 lg:pb-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/shifts" component={Shifts} />
              <Route path="/staff" component={Staff} />
              <Route path="/my-work" component={MyWork} />
              <Route path="/opportunities" component={Opportunities} />
              <Route path="/swap-requests" component={SwapRequests} />
              <Route path="/holiday-requests" component={HolidayRequests} />
              <Route path="/profile" component={Profile} />
              <Route path="/owner/dashboard" component={OwnerDashboard} />
              <Route path="/owner/scheduling" component={Scheduling} />
              <Route path="/owner/workforce" component={Workforce} />
              <Route path="/owner/settings" component={BusinessSettings} />
              <Route path="/owner/policies" component={Policies} />
              <Route path="/owner/analytics" component={Analytics} />
              <Route path="/owner/subscription" component={Subscription} />
              <Route path="/staff/performance" component={MyWork} />
              <Route path="/help" component={NotFound} />
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
