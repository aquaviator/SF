import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { Menu } from "@/components/Menu";
import Dashboard from "@/pages/dashboard";
import Shifts from "@/pages/shifts";
import Staff from "@/pages/staff";
import MyShifts from "@/pages/my-shifts";
import Opportunities from "@/pages/opportunities";
import SwapRequests from "@/pages/swap-requests";
import Assignments from "@/pages/assignments";
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

function Router() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Menu />
      <main className="lg:pt-0 pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/shifts" component={Shifts} />
            <Route path="/staff" component={Staff} />
            <Route path="/my-shifts" component={MyShifts} />
            <Route path="/opportunities" component={Opportunities} />
            <Route path="/swap-requests" component={SwapRequests} />
            <Route path="/assignments" component={Assignments} />
            <Route path="/holiday-requests" component={HolidayRequests} />
            <Route path="/profile" component={Profile} />
            <Route path="/owner/dashboard" component={OwnerDashboard} />
            <Route path="/owner/scheduling" component={Scheduling} />
            <Route path="/owner/workforce" component={Workforce} />
            <Route path="/owner/settings" component={BusinessSettings} />
            <Route path="/owner/policies" component={Policies} />
            <Route path="/owner/analytics" component={Analytics} />
            <Route path="/owner/subscription" component={Subscription} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
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
