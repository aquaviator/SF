import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardApi } from "@/lib/dashboardApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  MonitorSpeaker, 
  Users, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  FileText,
  RefreshCw,
  Eye,
  Settings,
  Bell,
  Activity,
  CheckCircle,
  XCircle,
  Pause,
  Play
} from "lucide-react";

// Pre-mounted modals (hidden by default)
interface CoverageDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  coverageData?: any;
}

function CoverageDetailsModal({ isOpen, onClose, coverageData }: CoverageDetailsModalProps) {
  console.log("🎯 COVERAGE_MODAL_RENDER", { isOpen, hasData: !!coverageData, timestamp: new Date() });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-labelledby="coverage-modal-title">
        <DialogHeader>
          <DialogTitle id="coverage-modal-title">Shift Coverage Details</DialogTitle>
          <DialogDescription>
            Detailed breakdown of shift coverage across your business locations
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {coverageData?.details?.map((day: any, index: number) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">{new Date(day.date).toLocaleDateString()}</h3>
                <Badge variant={day.understaffed ? "destructive" : "default"}>
                  {day.filled}/{day.shifts} filled
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {day.understaffed ? "⚠️ Understaffed" : "✅ Fully covered"}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: number;
  userName?: string;
}

function TimeEntryModal({ isOpen, onClose, userId, userName }: TimeEntryModalProps) {
  console.log("⏰ TIME_ENTRY_MODAL_RENDER", { isOpen, userId, userName, timestamp: new Date() });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent aria-labelledby="time-entry-modal-title">
        <DialogHeader>
          <DialogTitle id="time-entry-modal-title">Time Entry Details - {userName}</DialogTitle>
          <DialogDescription>
            Current time tracking status and recent activity
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Time entry details for User ID: {userId}
          </p>
          {/* Placeholder for real implementation */}
          <div className="p-4 bg-muted rounded">
            <p>Real-time time entry data will be displayed here</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface BulkHolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingRequests?: any[];
}

function BulkHolidayModal({ isOpen, onClose, pendingRequests }: BulkHolidayModalProps) {
  console.log("📋 BULK_HOLIDAY_MODAL_RENDER", { isOpen, requestCount: pendingRequests?.length, timestamp: new Date() });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" aria-labelledby="holiday-modal-title">
        <DialogHeader>
          <DialogTitle id="holiday-modal-title">Bulk Holiday Request Review</DialogTitle>
          <DialogDescription>
            Review and action multiple holiday requests efficiently
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {pendingRequests?.map((request: any, index: number) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{request.requesterName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {request.type} - {request.startDate} to {request.endDate}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Approve</Button>
                  <Button size="sm" variant="destructive">Reject</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function OwnerOperationsPage() {
  const { tenantId } = useAuth();
  const [, navigate] = useLocation();

  // Modal visibility states
  const [showCoverageModal, setShowCoverageModal] = useState(false);
  const [showTimeEntryModal, setShowTimeEntryModal] = useState(false);
  const [showBulkHolidayModal, setShowBulkHolidayModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number>();
  const [selectedUserName, setSelectedUserName] = useState<string>();

  // Auto-refresh timestamps
  const [lastRefresh, setLastRefresh] = useState(new Date());

  console.log("🎮 LIVE_OPS_PAGE_MOUNT", { tenantId, timestamp: new Date() });

  // Panel data queries with auto-refresh
  const { data: coverageData, isLoading: coverageLoading, refetch: refetchCoverage } = useQuery({
    queryKey: ["/api/dashboard/shift-coverage", tenantId],
    queryFn: () => dashboardApi.getShiftCoverage({ tenantId: tenantId! }),
    enabled: !!tenantId,
    refetchInterval: 60000, // 60 seconds
  });

  const { data: strikesData, isLoading: strikesLoading, refetch: refetchStrikes } = useQuery({
    queryKey: ["/api/dashboard/strikes-summary", tenantId],
    queryFn: () => dashboardApi.getStrikesSummary(tenantId!),
    enabled: !!tenantId,
    refetchInterval: 120000, // 2 minutes
  });

  const { data: timeEntriesData, isLoading: timeEntriesLoading, refetch: refetchTimeEntries } = useQuery({
    queryKey: ["/api/dashboard/live-time-entries", tenantId],
    queryFn: () => dashboardApi.getLiveTimeEntries(tenantId!),
    enabled: !!tenantId,
    refetchInterval: 30000, // 30 seconds
  });

  const { data: pendingRequestsData, isLoading: pendingLoading, refetch: refetchPending } = useQuery({
    queryKey: ["/api/dashboard/pending-requests", tenantId],
    queryFn: () => dashboardApi.getPendingHolidayRequests(tenantId!),
    enabled: !!tenantId,
    refetchInterval: 300000, // 5 minutes
  });

  const { data: escalationsData, isLoading: escalationsLoading, refetch: refetchEscalations } = useQuery({
    queryKey: ["/api/dashboard/escalations", tenantId],
    queryFn: () => dashboardApi.getEscalations(tenantId!),
    enabled: !!tenantId,
    refetchInterval: 60000, // 1 minute
  });

  // Panel mount logging
  useEffect(() => {
    console.log("📊 PANEL_MOUNT", { panel: "ShiftCoverage", timestamp: new Date() });
    console.log("🚨 PANEL_MOUNT", { panel: "StrikeAlerts", timestamp: new Date() });
    console.log("⏰ PANEL_MOUNT", { panel: "TimeEntryMonitor", timestamp: new Date() });
    console.log("📋 PANEL_MOUNT", { panel: "HolidayQueue", timestamp: new Date() });
    console.log("🚨 PANEL_MOUNT", { panel: "EscalationAlerts", timestamp: new Date() });
  }, []);

  // Manual refresh all data
  const handleRefreshAll = useCallback(() => {
    console.log("🔄 MANUAL_REFRESH_ALL", { timestamp: new Date() });
    
    refetchCoverage();
    refetchStrikes();
    refetchTimeEntries();
    refetchPending();
    refetchEscalations();
    setLastRefresh(new Date());
  }, [refetchCoverage, refetchStrikes, refetchTimeEntries, refetchPending, refetchEscalations]);

  // Click handlers with console logging
  const openCoverageDetails = () => {
    console.log("🎯 OPEN_COVERAGE_MODAL", { timestamp: new Date() });
    setShowCoverageModal(true);
  };

  const openTimeEntryModal = (userId: number, userName: string) => {
    console.log("⏰ OPEN_TIME_ENTRY_MODAL", { userId, userName, timestamp: new Date() });
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setShowTimeEntryModal(true);
  };

  const openBulkHolidayModal = () => {
    console.log("📋 OPEN_BULK_HOLIDAY_MODAL", { requestCount: pendingRequestsData?.length, timestamp: new Date() });
    setShowBulkHolidayModal(true);
  };

  const navigateToStrikes = () => {
    console.log("🚨 NAVIGATE_TO_STRIKES", { destination: "/owner/strikes", timestamp: new Date() });
    navigate("/owner/strikes");
  };

  const navigateToScheduling = () => {
    console.log("📅 NAVIGATE_TO_SCHEDULING", { destination: "/owner/scheduling", filter: "escalations", timestamp: new Date() });
    navigate("/owner/scheduling?filter=escalations");
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "clocked_in": return "bg-green-500";
      case "on_break": return "bg-yellow-500";
      case "overdue": return "bg-red-500";
      default: return "bg-gray-400";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "outline";
      default: return "secondary";
    }
  };

  if (!tenantId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading operations dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MonitorSpeaker className="h-6 w-6" />
            Live Operations
          </h1>
          <p className="text-muted-foreground">Mission Control for your business operations</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button 
            onClick={handleRefreshAll}
            variant="outline" 
            size="sm"
            aria-label="Refresh all panels"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Main Grid - 4 columns on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Shift Coverage Panel */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Shift Coverage</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {coverageLoading ? (
              <div className="space-y-2">
                <div className="h-8 bg-muted animate-pulse rounded"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {coverageData?.active || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Active</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {coverageData?.upcoming || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Upcoming</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {coverageData?.unfilled || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Unfilled</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {coverageData?.underUtilized || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Under-utilized</div>
                  </div>
                </div>
                <Button 
                  onClick={openCoverageDetails}
                  variant="outline" 
                  size="sm" 
                  className="w-full min-h-[44px]"
                  aria-label="View detailed shift coverage information"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Strike Alerts Panel */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Strike Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {strikesLoading ? (
              <div className="space-y-2">
                <div className="h-8 bg-muted animate-pulse rounded"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {strikesData && strikesData.totalPoints >= strikesData.maxStrikePoints && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Strike Limit Reached</span>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {strikesData?.totalPoints || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Points</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {strikesData?.staffWithStrikes || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Staff w/ Strikes</div>
                  </div>
                </div>
                <Button 
                  onClick={navigateToStrikes}
                  variant="outline" 
                  size="sm" 
                  className="w-full min-h-[44px]"
                  aria-label="View staff strikes dashboard"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Staff Strikes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time-Entry Monitor Panel */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Time Tracking</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {timeEntriesLoading ? (
              <div className="space-y-2">
                <div className="h-8 bg-muted animate-pulse rounded"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  {timeEntriesData?.slice(0, 4).map((entry: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => openTimeEntryModal(entry.userId, entry.userName)}
                      className="flex items-center justify-between w-full p-2 rounded hover:bg-muted transition-colors min-h-[44px]"
                      aria-label={`View time entry details for ${entry.userName}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusDotColor(entry.status)}`}></div>
                        <span className="text-sm font-medium">{entry.userName}</span>
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">
                        {entry.status.replace('_', ' ')}
                      </span>
                    </button>
                  ))}
                </div>
                {timeEntriesData && timeEntriesData.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active time entries
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Holiday & Sickness Queue Panel */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Request Queue</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {pendingLoading ? (
              <div className="space-y-2">
                <div className="h-8 bg-muted animate-pulse rounded"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {pendingRequestsData?.filter(r => r.type === 'holiday').length || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Holiday</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {pendingRequestsData?.filter(r => r.type === 'sick').length || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Sick</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {pendingRequestsData?.filter(r => r.priority === 'urgent').length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Urgent</div>
                </div>
                <Button 
                  onClick={openBulkHolidayModal}
                  variant="outline" 
                  size="sm" 
                  className="w-full min-h-[44px]"
                  aria-label="Review pending holiday requests"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Review Requests
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Escalation Alerts - Full Width */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">Swap & Cancellation Escalations</CardTitle>
          <Bell className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {escalationsLoading ? (
            <div className="space-y-2">
              <div className="h-8 bg-muted animate-pulse rounded"></div>
              <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {escalationsData && escalationsData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {escalationsData.map((escalation: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="space-y-1">
                          <h4 className="font-medium text-sm">{escalation.description}</h4>
                          <Badge variant={getUrgencyColor(escalation.urgency)} className="text-xs">
                            {escalation.urgency}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {escalation.affectedShifts} shifts
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(escalation.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No active escalations</p>
                </div>
              )}
              <div className="flex justify-center">
                <Button 
                  onClick={navigateToScheduling}
                  variant="outline"
                  className="min-h-[44px]"
                  aria-label="Manage escalations in scheduling"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Escalations
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pre-mounted Hidden Modals */}
      <CoverageDetailsModal 
        isOpen={showCoverageModal}
        onClose={() => setShowCoverageModal(false)}
        coverageData={coverageData}
      />
      
      <TimeEntryModal 
        isOpen={showTimeEntryModal}
        onClose={() => setShowTimeEntryModal(false)}
        userId={selectedUserId}
        userName={selectedUserName}
      />
      
      <BulkHolidayModal 
        isOpen={showBulkHolidayModal}
        onClose={() => setShowBulkHolidayModal(false)}
        pendingRequests={pendingRequestsData}
      />
    </div>
  );
}