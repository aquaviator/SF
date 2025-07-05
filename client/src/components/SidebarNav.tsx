import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { getMenuForRole, getMoreMenuForRole } from "@/config/menus";

export function SidebarNav() {
  const { role, user, tenantId, switchRole, switchStaff, currentStaffId } = useAuth();
  const [location] = useLocation();
  
  const menuItems = getMenuForRole(role);
  const moreMenuItems = getMoreMenuForRole(role);

  // Fetch business profile for real business name
  const { data: businessProfile } = useQuery({
    queryKey: ["/api/business-profile", tenantId],
    queryFn: () => fetch(`/api/business-profile?tenantId=${tenantId}`).then(res => res.json()),
    enabled: !!tenantId,
  });

  // Fetch staff users for dev mode dropdown
  const { data: staffUsers } = useQuery({
    queryKey: ["/api/staff", tenantId],
    queryFn: () => fetch(`/api/staff?tenantId=${tenantId}`).then(res => res.json()),
    enabled: role === 'staff' && !!tenantId,
  });

  // Fetch complete user profile with photo
  const { data: userProfile } = useQuery({
    queryKey: ["/api/users", user?.id],
    queryFn: () => fetch(`/api/users/${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
  });

  // Fetch pending requests count for owners
  const { data: pendingRequestsCount = 0 } = useQuery({
    queryKey: ["/api/pending-requests-count", tenantId],
    queryFn: async () => {
      if (role !== 'owner') return 0;
      
      const [holidayRequests, swapRequests] = await Promise.all([
        fetch(`/api/holiday-requests?tenantId=${tenantId}`).then(res => res.json()).catch(() => []),
        fetch(`/api/swap-requests?tenantId=${tenantId}`).then(res => res.json()).catch(() => [])
      ]);
      
      const pendingHoliday = holidayRequests.filter((req: any) => req.status === "pending").length;
      const pendingSwap = swapRequests.filter((req: any) => req.status === "pending").length;
      
      return pendingHoliday + pendingSwap;
    },
    enabled: !!tenantId && role === 'owner',
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
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
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
            {userProfile?.photoUrl ? (
              <img
                src={userProfile.photoUrl}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `<span class="text-white text-sm font-medium">${getUserInitials()}</span>`;
                }}
              />
            ) : (
              <span className="text-white text-sm font-medium">
                {getUserInitials()}
              </span>
            )}
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
              {(businessProfile?.name || tenantId) && (
                <span className="text-xs text-gray-500 truncate">
                  {businessProfile?.name || tenantId?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
          
          {/* Staff Profile Switcher - Only show when in staff mode */}
          {role === "staff" && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs font-medium text-yellow-800">STAFF USER</span>
              <select
                value={currentStaffId}
                onChange={(e) => switchStaff(parseInt(e.target.value))}
                className="text-xs bg-white border border-yellow-300 rounded px-2 py-1 text-yellow-800 focus:outline-none focus:ring-1 focus:ring-yellow-400"
              >
                {staffUsers?.filter(user => user.role === 'staff').map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}
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
              {item.label === "Requests" && role === "owner" && pendingRequestsCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                  {pendingRequestsCount}
                </span>
              )}
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