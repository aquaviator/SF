import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { getMenuForRole, getMoreMenuForRole } from "@/config/menus";

export function SidebarNav() {
  const { role } = useAuth();
  const [location] = useLocation();
  
  const menuItems = getMenuForRole(role);
  const moreMenuItems = getMoreMenuForRole(role);
  
  const isActiveRoute = (route: string) => {
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
    <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900">Agent Shifts</h1>
        <p className="text-sm text-gray-500 mt-1">
          {role === 'owner' ? 'Business Dashboard' : 'Staff Portal'}
        </p>
      </div>
      
      <nav 
        className="flex-1 px-4 pb-4 space-y-1"
        role="navigation" 
        aria-label="Main navigation"
      >
        {/* Primary Menu Items */}
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.route);
          const uniqueKey = `${item.route}-${item.label}-${index}`;
          
          return (
            <Link
              key={uniqueKey}
              href={item.route}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              )}
              aria-label={`Navigate to ${item.description || item.label}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        
        {/* Separator */}
        <div className="border-t border-gray-200 my-4" />
        
        {/* Secondary Menu Items */}
        <div className="space-y-1">
          <h3 className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
            More
          </h3>
          {moreMenuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.route);
            const uniqueKey = `more-${item.route}-${item.label}-${index}`;
            
            return (
              <Link
                key={uniqueKey}
                href={item.route}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                )}
                aria-label={`Navigate to ${item.description || item.label}`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}