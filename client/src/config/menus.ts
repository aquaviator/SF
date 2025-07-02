import { 
  Home, 
  Calendar, 
  Users, 
  BarChart3, 
  User, 
  FileText, 
  ClipboardList, 
  Briefcase,
  RefreshCw,
  Settings,
  Shield,
  CreditCard,
  TrendingUp
} from "lucide-react";
import { ComponentType } from "react";

export interface MenuItem {
  label: string;
  route: string;
  icon: ComponentType<{ className?: string }>;
  description?: string;
}

export const ownerMenu: MenuItem[] = [
  {
    label: "Dashboard",
    route: "/owner/dashboard",
    icon: Home,
    description: "Overview of business metrics and alerts"
  },
  {
    label: "Scheduling",
    route: "/owner/scheduling",
    icon: Calendar,
    description: "Manage shifts and schedule templates"
  },
  {
    label: "Workforce",
    route: "/owner/workforce",
    icon: Users,
    description: "Staff management and assignments"
  },
  {
    label: "Analytics",
    route: "/owner/analytics",
    icon: BarChart3,
    description: "Reports and business insights"
  }
];

export const staffMenu: MenuItem[] = [
  {
    label: "Dashboard",
    route: "/my-shifts",
    icon: Home,
    description: "View your upcoming shifts"
  },
  {
    label: "My Work",
    route: "/my-shifts",
    icon: Calendar,
    description: "Manage your shift schedule"
  },
  {
    label: "Requests",
    route: "/swap-requests",
    icon: RefreshCw,
    description: "Swap and holiday requests"
  },
  {
    label: "Account",
    route: "/profile",
    icon: User,
    description: "Profile and account settings"
  }
];

// Extended menu items for More drawer (owner)
export const ownerMoreMenu: MenuItem[] = [
  {
    label: "Business Settings",
    route: "/owner/settings",
    icon: Settings,
    description: "Business profile and configuration"
  },
  {
    label: "Policies",
    route: "/owner/policies",
    icon: Shield,
    description: "Shift policies and rules"
  },
  {
    label: "Subscription",
    route: "/owner/subscription",
    icon: CreditCard,
    description: "Billing and plan management"
  }
];

// Extended menu items for More drawer (staff)
export const staffMoreMenu: MenuItem[] = [
  {
    label: "Opportunities",
    route: "/opportunities",
    icon: Briefcase,
    description: "Available shift opportunities"
  },
  {
    label: "Assignments",
    route: "/assignments",
    icon: ClipboardList,
    description: "Current shift assignments"
  },
  {
    label: "Performance",
    route: "/staff/performance",
    icon: TrendingUp,
    description: "View your performance metrics"
  }
];

// Helper function to get menu items based on role
export const getMenuForRole = (role: 'owner' | 'staff'): MenuItem[] => {
  return role === 'owner' ? ownerMenu : staffMenu;
};

export const getMoreMenuForRole = (role: 'owner' | 'staff'): MenuItem[] => {
  return role === 'owner' ? ownerMoreMenu : staffMoreMenu;
};