import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function NotificationBell() {
  const { role, tenantId } = useAuth();

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

  // Get recent notifications for dropdown
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications", tenantId],
    queryFn: async () => {
      if (role !== 'owner') return [];
      
      const [holidayRequests, swapRequests] = await Promise.all([
        fetch(`/api/holiday-requests?tenantId=${tenantId}`).then(res => res.json()).catch(() => []),
        fetch(`/api/swap-requests?tenantId=${tenantId}`).then(res => res.json()).catch(() => [])
      ]);
      
      const pendingHoliday = holidayRequests
        .filter((req: any) => req.status === "pending")
        .slice(0, 3)
        .map((req: any) => ({
          id: req.id,
          type: 'holiday',
          title: `${req.requestType || 'Holiday'} Request`,
          message: `${req.requesterName || 'Staff member'} requested time off`,
          time: new Date(req.createdAt || Date.now()).toLocaleDateString(),
          route: '/owner/requests'
        }));
      
      const pendingSwap = swapRequests
        .filter((req: any) => req.status === "pending")
        .slice(0, 3)
        .map((req: any) => ({
          id: req.id,
          type: 'swap',
          title: 'Shift Swap Request',
          message: `${req.requesterName || 'Staff member'} wants to swap shifts`,
          time: new Date(req.createdAt || Date.now()).toLocaleDateString(),
          route: '/owner/requests'
        }));
      
      return [...pendingHoliday, ...pendingSwap];
    },
    enabled: !!tenantId && role === 'owner',
    refetchInterval: 30000,
  });

  const hasNotifications = pendingRequestsCount > 0;

  if (role !== 'owner') {
    return null; // Only show notifications for owners
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={cn(
            "relative h-9 w-9 p-0",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          )}
          aria-label={`Notifications${hasNotifications ? ` (${pendingRequestsCount} pending)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {hasNotifications && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-medium"
            >
              {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {hasNotifications && (
            <Badge variant="outline" className="ml-2">
              {pendingRequestsCount} pending
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <DropdownMenuItem disabled>
            <div className="text-center py-4 text-muted-foreground">
              No pending notifications
            </div>
          </DropdownMenuItem>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem 
              key={`${notification.type}-${notification.id}`}
              className="flex flex-col items-start space-y-1 p-3 cursor-pointer"
              onClick={() => {
                window.location.href = notification.route;
              }}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-sm">{notification.title}</span>
                <span className="text-xs text-muted-foreground">{notification.time}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {notification.message}
              </span>
            </DropdownMenuItem>
          ))
        )}
        
        {hasNotifications && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-center font-medium text-blue-600 hover:text-blue-700"
              onClick={() => {
                window.location.href = '/owner/requests';
              }}
            >
              View All Requests
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}