import { Home, Calendar, Users, BarChart3, User, Menu, FileText, ClipboardList } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface TabItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  ariaLabel: string;
}

interface BottomTabBarProps {
  onMoreClick: () => void;
}

export function BottomTabBar({ onMoreClick }: BottomTabBarProps) {
  const { role } = useAuth();
  const [location] = useLocation();

  const ownerTabs: TabItem[] = [
    {
      icon: Home,
      label: "Dashboard",
      path: "/owner/dashboard",
      ariaLabel: "Navigate to owner dashboard"
    },
    {
      icon: Calendar,
      label: "Scheduling",
      path: "/owner/scheduling",
      ariaLabel: "Navigate to scheduling management"
    },
    {
      icon: Users,
      label: "Workforce",
      path: "/owner/workforce",
      ariaLabel: "Navigate to workforce management"
    },
    {
      icon: BarChart3,
      label: "Analytics",
      path: "/owner/analytics",
      ariaLabel: "Navigate to analytics dashboard"
    }
  ];

  const staffTabs: TabItem[] = [
    {
      icon: Home,
      label: "Dashboard",
      path: "/staff/my-shifts",
      ariaLabel: "Navigate to staff dashboard"
    },
    {
      icon: Calendar,
      label: "My Work",
      path: "/staff/my-shifts",
      ariaLabel: "Navigate to my shifts"
    },
    {
      icon: FileText,
      label: "Requests",
      path: "/staff/swap-requests",
      ariaLabel: "Navigate to swap requests"
    },
    {
      icon: User,
      label: "Account",
      path: "/profile",
      ariaLabel: "Navigate to account profile"
    }
  ];

  const tabs = role === "owner" ? ownerTabs : staffTabs;

  const isActiveTab = (path: string) => {
    if (path === "/staff/my-shifts" && (location === "/my-shifts" || location === "/staff/my-shifts")) {
      return true;
    }
    if (path === "/owner/dashboard" && location === "/owner-dashboard") {
      return true;
    }
    return location === path || location.startsWith(path + "/");
  };

  return (
    <nav 
      role="navigation" 
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-2 safe-area-pb md:hidden"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = isActiveTab(tab.path);
          
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={cn(
                "flex flex-col items-center justify-center min-w-[48px] min-h-[48px] p-2 rounded-lg transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                isActive 
                  ? "text-blue-600 bg-blue-50" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
              aria-label={tab.ariaLabel}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
        
        {/* More button */}
        <button
          onClick={onMoreClick}
          className={cn(
            "flex flex-col items-center justify-center min-w-[48px] min-h-[48px] p-2 rounded-lg transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          )}
          aria-label="Open more options menu"
        >
          <Menu className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">More</span>
        </button>
      </div>
    </nav>
  );
}