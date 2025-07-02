import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { getMenuForRole, getMoreMenuForRole } from "@/config/menus";

export function SidebarNav() {
  const { role, user, tenantId, switchRole } = useAuth();
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

  // Generate user initials for avatar
  const getUserInitials = () => {
    if (!user) return "U";
    const firstInitial = user.firstName?.[0] || "";
    const lastInitial = user.lastName?.[0] || "";
    return (firstInitial + lastInitial).toUpperCase() || user.email?.[0]?.toUpperCase() || "U";
  };

  const getUserDisplayName = () => {
    if (!user) return "User";
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email?.split('@')[0] || "User";
  };

  return (
    <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col h-full">
      {/* Header */}
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900">Agent Shifts</h1>
        <p className="text-sm text-gray-500 mt-1">
          {role === 'owner' ? 'Business Dashboard' : 'Staff Portal'}
        </p>
      </div>

      {/* User Profile Section */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {getUserInitials()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {getUserDisplayName()}
            </p>
            <div className="flex items-center gap-2">
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                role === 'owner' 
                  ? "bg-purple-100 text-purple-800"
                  : "bg-green-100 text-green-800"
              )}>
                {role === 'owner' ? 'Owner' : 'Staff'}
              </span>
              {tenantId && (
                <span className="text-xs text-gray-500 truncate">
                  {tenantId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Development Role Switcher */}
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-yellow-800">DEV MODE</span>
            <select
              value={role}
              onChange={(e) => switchRole(e.target.value as "owner" | "staff")}
              className="text-xs bg-white border border-yellow-300 rounded px-2 py-1 text-yellow-800 focus:outline-none focus:ring-1 focus:ring-yellow-400"
            >
              <option value="owner">Owner</option>
              <option value="staff">Staff</option>
            </select>
          </div>
        </div>
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