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
            <Route path="/swaps" component={() => <div>Swap Requests - Coming Soon</div>} />
            <Route path="/reports" component={() => <div>Reports - Coming Soon</div>} />
            <Route path="/profile" component={() => <div>Profile - Coming Soon</div>} />
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
