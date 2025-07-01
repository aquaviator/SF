import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  Calendar,
  BarChart3,
  Users,
  CalendarCheck,
  Search,
  ArrowLeftRight,
  User,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const navigationConfig = {
  owner: [
    { id: "dashboard", label: "Dashboard", icon: <Home className="w-5 h-5" />, path: "/" },
    { id: "shifts", label: "Shifts", icon: <Calendar className="w-5 h-5" />, path: "/shifts" },
    { id: "staff", label: "Staff", icon: <Users className="w-5 h-5" />, path: "/staff" },
    { id: "reports", label: "Reports", icon: <BarChart3 className="w-5 h-5" />, path: "/reports" },
  ],
  staff: [
    { id: "my-shifts", label: "My Shifts", icon: <CalendarCheck className="w-5 h-5" />, path: "/my-shifts" },
    { id: "opportunities", label: "Opportunities", icon: <Search className="w-5 h-5" />, path: "/opportunities" },
    { id: "swap-requests", label: "Swaps", icon: <ArrowLeftRight className="w-5 h-5" />, path: "/swaps" },
    { id: "profile", label: "Profile", icon: <User className="w-5 h-5" />, path: "/profile" },
  ],
};

export const Menu: React.FC = () => {
  const { role, switchRole, user } = useAuth();
  const [location] = useLocation();
  const navItems = navigationConfig[role];

  const RoleSwitcher = () => (
    <div className="fixed top-4 right-4 z-50 bg-yellow-100 border border-yellow-300 rounded-lg p-2 shadow-lg">
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="outline" className="bg-yellow-200 text-yellow-800">
          DEV
        </Badge>
        <select
          value={role}
          onChange={(e) => switchRole(e.target.value as "owner" | "staff")}
          className="bg-white border border-gray-300 rounded px-2 py-1 text-xs"
        >
          <option value="owner">Owner</option>
          <option value="staff">Staff</option>
        </select>
      </div>
    </div>
  );

  const DesktopNav = () => (
    <nav className="hidden lg:flex bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-primary">
                <Calendar className="w-6 h-6 inline mr-2" />
                Agent Shifts
              </h1>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <Link key={item.id} href={item.path}>
                    <Button
                      variant={location === item.path ? "default" : "ghost"}
                      className="flex items-center gap-2"
                    >
                      {item.icon}
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Acme Corp</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <span className="text-sm font-medium capitalize">{role}</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );

  const MobileNav = () => (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => (
          <Link key={item.id} href={item.path}>
            <Button
              variant="ghost"
              className={`flex flex-col items-center justify-center h-full rounded-none ${
                location === item.path
                  ? "text-primary bg-primary/10"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {item.icon}
              <span className="text-xs font-medium mt-1">{item.label}</span>
            </Button>
          </Link>
        ))}
      </div>
    </nav>
  );

  return (
    <>
      <RoleSwitcher />
      <DesktopNav />
      <MobileNav />
    </>
  );
};
