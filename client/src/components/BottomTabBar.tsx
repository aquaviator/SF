import { Menu } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { getMenuForRole } from "@/config/menus";

interface BottomTabBarProps {
  onMoreClick: () => void;
}

export function BottomTabBar({ onMoreClick }: BottomTabBarProps) {
  const { role } = useAuth();
  const [location] = useLocation();
  
  const menuItems = getMenuForRole(role);

  const isActiveTab = (route: string) => {
    // Handle special cases for route matching
    if (route === "/my-shifts" && (location === "/my-shifts" || location === "/staff/my-shifts")) {
      return true;
    }
    if (route === "/owner/dashboard" && location === "/owner-dashboard") {
      return true;
    }
    return location === route || location.startsWith(route + "/");
  };

  return (
    <nav 
      role="navigation" 
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-2 safe-area-pb md:hidden"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = isActiveTab(item.route);
          const uniqueKey = `${item.route}-${item.label}-${index}`;
          
          return (
            <Link
              key={uniqueKey}
              href={item.route}
              className={cn(
                "flex flex-col items-center justify-center min-w-[48px] min-h-[48px] p-2 rounded-lg transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                isActive 
                  ? "text-blue-600 bg-blue-50" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
              aria-label={`Navigate to ${item.description || item.label}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
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