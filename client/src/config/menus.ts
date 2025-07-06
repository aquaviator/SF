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
  TrendingUp,
  Bell,
  AlertTriangle,
  MonitorSpeaker
} from "lucide-react";
import { ComponentType } from "react";

export interface MenuItem {
  label: string;
  route: string;
  icon: ComponentType<{ className?: string }>;
  description?: string;
  submenu?: MenuItem[];
  notificationKey?: string;
}

export const ownerMenu: MenuItem[] = [
  {
    label: "Dashboard",
    route: "/owner/dashboard",
    icon: Home,
    description: "Overview of business metrics and alerts"
  },
  {
    label: "Operations",
    route: "/owner/operations",
    icon: MonitorSpeaker,
    description: "Real-time mission control for business operations"
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
  }
];

export const staffMenu: MenuItem[] = [
  {
    label: "Dashboard",
    route: "/dashboard",
    icon: Home,
    description: "View your dashboard with shift overview"
  },
  {
    label: "My Work",
    route: "/my-work",
    icon: Calendar,
    description: "Comprehensive work hub with schedule, assignments, time tracking, and requests"
  },
  {
    label: "Requests",
    route: "/staff/requests",
    icon: FileText,
    description: "Holiday requests and work assignments",
    submenu: [
      {
        label: "Holiday",
        route: "/staff/requests?tab=holiday",
        icon: Calendar,
        description: "Time off requests and approval status"
      },
      {
        label: "Work",
        route: "/staff/requests?tab=work",
        icon: Briefcase,
        description: "Incoming work assignment requests",
        notificationKey: "pending-assignments"
      }
    ]
  },
  {
    label: "Account",
    route: "/staff/profile",
    icon: User,
    description: "Profile and account settings"
  }
];

// Extended menu items for More drawer (owner)
export const ownerMoreMenu: MenuItem[] = [
  {
    label: "Requests",
    route: "/owner/requests",
    icon: Bell,
    description: "Review and action staff requests"
  },
  {
    label: "Analytics",
    route: "/owner/analytics",
    icon: BarChart3,
    description: "Reports and business insights"
  },
  {
    label: "Compliance",
    route: "/owner/strikes",
    icon: AlertTriangle,
    description: "Staff strikes and compliance monitoring"
  },
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
  },
  {
    label: "Profile",
    route: "/owner/profile",
    icon: User,
    description: "Personal account settings and profile"
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
    label: "Swap Requests",
    route: "/swap-requests",
    icon: RefreshCw,
    description: "Request to swap shifts with colleagues"
  },
  {
    label: "Performance",
    route: "/staff/performance",
    icon: TrendingUp,
    description: "View your performance metrics"
  },
  {
    label: "My Strikes",
    route: "/staff/strikes",
    icon: AlertTriangle,
    description: "View your strike history and status"
  }
];

// Helper function to get menu items based on role
export const getMenuForRole = (role: 'owner' | 'staff'): MenuItem[] => {
  return role === 'owner' ? ownerMenu : staffMenu;
};

export const getMoreMenuForRole = (role: 'owner' | 'staff'): MenuItem[] => {
  return role === 'owner' ? ownerMoreMenu : staffMoreMenu;
};