import { X, HelpCircle, LogOut } from "lucide-react";
import { useRole } from "@/hooks/useRole";
// Mobile cache refresh: 2025-07-06 10:33
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { getMoreMenuForRole } from "@/config/menus";

interface MoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}
export function MoreDrawer({ isOpen, onClose }: MoreDrawerProps) {
  const { logout } = useAuth();
  const { role, tenantId, user } = useRole();
  const drawerRef = useRef<HTMLDivElement>(null);
  
  const moreMenuItems = getMoreMenuForRole(role);
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
  // Fetch business profile for real business name
  const { data: businessProfile } = useQuery({
    queryKey: ["/api/business-profile", tenantId],
    queryFn: () => fetch(`/api/business-profile?tenantId=${tenantId}`).then(res => res.json()),
    enabled: !!tenantId,
  // Fetch complete user profile with photo
  const { data: userProfile } = useQuery({
    queryKey: ["/api/users", user?.id],
    queryFn: () => fetch(`/api/users/${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
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
  // Handle logout
  const handleLogout = async () => {
    await logout();
    onClose();
    window.location.href = '/login';
  // Focus trap and escape key handling
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    // Focus the first focusable element
    const firstFocusable = drawerRef.current?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    firstFocusable?.focus();
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return (
    <div 
      className="fixed inset-0 z-50 md:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      {/* Drawer */}
      <div 
        ref={drawerRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-white rounded-t-lg shadow-lg",
          "transform transition-transform duration-300 ease-out",
          "max-h-[70vh] overflow-y-auto safe-area-pb",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 id="drawer-title" className="text-lg font-semibold text-gray-900">
            More Options
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close more options menu"
            className="p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        {/* User Profile Section */}
        <div className="p-4 border-b border-gray-200">
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
                {(businessProfile?.name || tenantId) && (
                  <span className="text-xs text-gray-500 truncate">
                    {businessProfile?.name || tenantId?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                )}
              </div>
          </div>
        {/* Content */}
        <nav className="p-4 space-y-2" role="navigation" aria-label="More options navigation">
          {/* Menu Items from config */}
          {moreMenuItems.map((item, index) => {
            const Icon = item.icon;
            const uniqueKey = `${item.route}-${item.label}-${index}`;
            
            return (
              <Link
                key={uniqueKey}
                href={item.route}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-colors",
                  "text-gray-700 hover:text-gray-900 hover:bg-gray-50",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  "min-h-[48px]"
                aria-label={`Navigate to ${item.description || item.label}`}
              >
                <Icon className="w-5 h-5 text-gray-500" />
                <span className="font-medium">{item.label}</span>
                {item.label === "Requests" && role === "owner" && pendingRequestsCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                    {pendingRequestsCount}
              </Link>
            );
          })}
          {/* Separator before help */}
          <Separator className="my-4" />
          {/* Help & Support */}
          <Link
            href="/help"
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg transition-colors",
              "text-gray-700 hover:text-gray-900 hover:bg-gray-50",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              "min-h-[48px]"
            )}
            aria-label="Navigate to help and support"
            <HelpCircle className="w-5 h-5 text-gray-500" />
            <span className="font-medium">Help & Support</span>
          </Link>
          {/* Logout Button */}
          
          <button
            onClick={handleLogout}
              "flex items-center gap-3 p-3 rounded-lg transition-colors w-full",
              "text-red-600 hover:text-red-700 hover:bg-red-50",
              "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
            aria-label="Log out of account"
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Log Out</span>
          </button>
        </nav>
      </div>
    </div>
  );
