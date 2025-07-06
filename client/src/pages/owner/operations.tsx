import { useState, useEffect, useCallback } from "react";
import { useRole } from "@/hooks/useRole";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { dashboardApi } from "@/lib/dashboardApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverrideClockModal } from "@/components/OverrideClockModal";
import { EscalationModal } from "@/components/EscalationModal";
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
  const { tenantId } = useRole();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [coverageThreshold, setCoverageThreshold] = useState(80);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [autoAssign, setAutoAssign] = useState(false);
  console.log("🎯 COVERAGE_MODAL_RENDER", { isOpen, hasData: !!coverageData, timestamp: new Date() });
  // Fetch additional data for comprehensive coverage management
  const { data: shiftsData, isLoading: shiftsLoading } = useQuery({
    queryKey: ["/api/shifts", tenantId],
    queryFn: () => fetch(`/api/shifts?tenantId=${tenantId}`).then(res => res.json()),
    enabled: isOpen && !!tenantId,
  });
  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ["/api/staff", tenantId],
    queryFn: () => fetch(`/api/staff?tenantId=${tenantId}`).then(res => res.json()),
  const handleQuickAssign = async (shiftId: number, staffId: number) => {
    try {
      console.log("🔄 QUICK_ASSIGN_SHIFT", { shiftId, staffId, timestamp: new Date() });
      const response = await fetch(`/api/shifts/${shiftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo: staffId })
      });
      
      if (response.ok) {
        console.log("✅ SHIFT_ASSIGNED", { shiftId, staffId, timestamp: new Date() });
        // Refresh data after successful assignment
        window.location.reload();
      }
    } catch (error) {
      console.error("❌ ASSIGN_SHIFT_ERROR", { error: error.message, timestamp: new Date() });
    }
  };
  const handleNavigateToScheduling = () => {
    console.log("📅 NAVIGATE_TO_SCHEDULING_FROM_COVERAGE", { timestamp: new Date() });
    onClose();
    navigate("/owner/scheduling");
  const getUnfilledShifts = () => {
    if (!shiftsData) return [];
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    return shiftsData.filter((shift: any) => {
      const shiftDate = new Date(shift.date);
      return shiftDate >= today && 
             shiftDate <= nextWeek && 
             shift.status === "open" && 
             !shift.assignedTo;
    });
  const getCoverageRate = () => {
    if (!coverageData?.details) return 0;
    const total = coverageData.details.reduce((sum: number, day: any) => sum + day.shifts, 0);
    const filled = coverageData.details.reduce((sum: number, day: any) => sum + day.filled, 0);
    return total > 0 ? Math.round((filled / total) * 100) : 0;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" aria-labelledby="coverage-modal-title">
        <DialogHeader>
          <DialogTitle id="coverage-modal-title">Shift Coverage Management</DialogTitle>
          <DialogDescription>
            Comprehensive shift coverage monitoring, configuration, and management
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Coverage Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{getCoverageRate()}%</div>
                <div className="text-sm text-muted-foreground">Coverage Rate</div>
              </div>
            </Card>
                <div className="text-2xl font-bold text-blue-600">{coverageData?.active || 0}</div>
                <div className="text-sm text-muted-foreground">Confirmed Shifts</div>
                <div className="text-2xl font-bold text-red-600">{coverageData?.unfilled || 0}</div>
                <div className="text-sm text-muted-foreground">Unfilled</div>
                <div className="text-2xl font-bold text-orange-600">{coverageData?.underUtilized || 0}</div>
                <div className="text-sm text-muted-foreground">Under-utilized</div>
          </div>
          {/* Tabs for different views */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Daily Overview</TabsTrigger>
              <TabsTrigger value="unfilled">
                Unfilled Shifts ({getUnfilledShifts().length})
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-1" />
                Settings
            </TabsList>
            <TabsContent value="overview" className="mt-6">
              <div className="space-y-4">
                {coverageData?.details?.map((day: any, index: number) => (
                  <Card key={index} className={day.understaffed ? "border-red-200 bg-red-50" : ""}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium">{new Date(day.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'short', 
                              day: 'numeric' 
                            })}</h3>
                            <Badge variant={day.understaffed ? "destructive" : "default"}>
                              {day.filled}/{day.shifts} filled
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {day.understaffed ? (
                              <span className="text-red-600 flex items-center gap-1">
                                <AlertTriangle className="h-4 w-4" />
                                Below {coverageThreshold}% coverage threshold
                              </span>
                            ) : (
                              <span className="text-green-600 flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                Meeting coverage requirements
                            )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleNavigateToScheduling}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            View Schedule
                          </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>
            <TabsContent value="unfilled" className="mt-6">
            <div className="space-y-4">
              {shiftsLoading ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">Loading unfilled shifts...</div>
                </div>
              ) : getUnfilledShifts().length === 0 ? (
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Shifts Covered</h3>
                  <p className="text-muted-foreground">No unfilled shifts in the next 7 days</p>
              ) : (
                getUnfilledShifts().map((shift: any) => (
                  <Card key={shift.id} className="border-orange-200 bg-orange-50">
                            <h3 className="font-medium">{new Date(shift.date).toLocaleDateString()}</h3>
                            <Badge variant="secondary">{shift.role}</Badge>
                            <Badge variant="outline">{shift.location}</Badge>
                            {shift.startTime} - {shift.endTime}
                            <Users className="h-4 w-4 mr-2" />
                            Assign Staff
                ))
              )}
            </div>
            <TabsContent value="settings" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Coverage Thresholds</CardTitle>
                  <CardDescription>
                    Configure when shifts are considered understaffed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Minimum Coverage Threshold: {coverageThreshold}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={coverageThreshold}
                      onChange={(e) => setCoverageThreshold(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
                  <CardTitle>Alert Preferences</CardTitle>
                    Configure how you receive coverage notifications
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Coverage Alerts</div>
                      <div className="text-sm text-muted-foreground">
                        Get notified when shifts fall below threshold
                    <Button
                      variant={alertsEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAlertsEnabled(!alertsEnabled)}
                    >
                      {alertsEnabled ? (
                        <>
                          <Bell className="h-4 w-4 mr-2" />
                          Enabled
                        </>
                      ) : (
                          Disabled
                      )}
                    </Button>
                  
                      <div className="font-medium">Auto-Assignment</div>
                        Automatically suggest staff for unfilled shifts
                      variant={autoAssign ? "default" : "outline"}
                      onClick={() => setAutoAssign(!autoAssign)}
                      {autoAssign ? (
                          <Activity className="h-4 w-4 mr-2" />
                          <Pause className="h-4 w-4 mr-2" />
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  console.log("💾 SAVE_COVERAGE_SETTINGS", { 
                    threshold: coverageThreshold, 
                    alerts: alertsEnabled, 
                    autoAssign,
                    timestamp: new Date() 
                  });
                  onClose();
                }}>
                  Save Settings
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
interface TimeEntryModalProps {
  userId?: number;
  userName?: string;
function TimeEntryModal({ isOpen, onClose, userId, userName }: TimeEntryModalProps) {
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  
  console.log("⏰ TIME_ENTRY_MODAL_RENDER", { isOpen, userId, userName, timestamp: new Date() });
  // Calculate how late a staff member was
  const calculateLateDuration = (scheduledStart: string | Date | null, actualClockIn: string | Date | null) => {
    if (!scheduledStart || !actualClockIn) return null;
    const scheduled = new Date(scheduledStart);
    const actual = new Date(actualClockIn);
    if (actual <= scheduled) return null; // Not late
    const diffMs = actual.getTime() - scheduled.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  // Fetch today's time entries for this user
  const { data: timeEntries, isLoading, refetch } = useQuery({
    queryKey: ["/api/time-entries", tenantId, userId, "today"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/time-entries?tenantId=${tenantId}&userId=${userId}&date=${today}`);
      if (!response.ok) {
        throw new Error('Failed to fetch time entries');
      return response.json();
    },
    enabled: isOpen && !!userId && !!tenantId
  const handleOverride = (entry: any) => {
    console.log("🔧 OVERRIDE_TIME_ENTRY", { entryId: entry.id, userName, timestamp: new Date() });
    setSelectedEntry(entry);
    setShowOverrideModal(true);
  const handleOverrideSaved = (updatedEntry: any) => {
    console.log("✅ OVERRIDE_SAVED", { entryId: updatedEntry.id, userName, timestamp: new Date() });
    setShowOverrideModal(false);
    setSelectedEntry(null);
    refetch(); // Refresh the time entries data
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-labelledby="time-entry-modal-title">
          <DialogHeader>
            <DialogTitle id="time-entry-modal-title">Time Entry Details - {userName}</DialogTitle>
            <DialogDescription>
              Current time tracking status and recent activity for today
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                <div className="h-20 bg-muted animate-pulse rounded"></div>
            ) : (
              <>
                {timeEntries && timeEntries.length > 0 ? (
                  <div className="space-y-3">
                    {timeEntries.map((entry: any) => (
                      <div key={entry.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              entry.status === 'clocked_in' ? 'bg-green-500' : 
                              entry.status === 'on_break' ? 'bg-yellow-500' : 
                              entry.status === 'adjusted' ? 'bg-blue-500' : 
                              'bg-gray-400'
                            }`}></div>
                            <Badge variant={entry.status === 'adjusted' ? 'secondary' : 'outline'}>
                              {entry.status.replace('_', ' ')}
                          <Button
                            variant="outline"
                            onClick={() => handleOverride(entry)}
                            className="min-h-[32px]"
                            Override
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium">Clock In</p>
                            <p className="text-muted-foreground">
                              {entry.clockInTime ? new Date(entry.clockInTime).toLocaleString() : 'Not clocked in'}
                            </p>
                            {/* Show late duration if staff member was late */}
                            {entry.clockInTime && entry.scheduledStartTime && (() => {
                              const lateDuration = calculateLateDuration(entry.scheduledStartTime, entry.clockInTime);
                              return lateDuration ? (
                                <p className="text-red-600 text-xs font-medium mt-1">
                                  Late by {lateDuration}
                                </p>
                              ) : null;
                            })()}
                            <p className="font-medium">Clock Out</p>
                              {entry.clockOutTime ? new Date(entry.clockOutTime).toLocaleString() : 'Not clocked out'}
                        {entry.overrideNote && (
                          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-sm font-medium text-blue-800">Override Note:</p>
                            <p className="text-sm text-blue-700">{entry.overrideNote}</p>
                        )}
                        {entry.adjustedAt && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Adjusted on {new Date(entry.adjustedAt).toLocaleString()}
                    ))}
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No time entries found for today</p>
                )}
              </>
            )}
        </DialogContent>
      </Dialog>
      {/* Override Modal */}
      {showOverrideModal && selectedEntry && (
        <OverrideClockModal
          entry={selectedEntry}
          onClose={() => setShowOverrideModal(false)}
          onSaved={handleOverrideSaved}
        />
      )}
    </>
interface BulkHolidayModalProps {
  pendingRequests?: any[];
function BulkHolidayModal({ isOpen, onClose, pendingRequests }: BulkHolidayModalProps) {
  console.log("📋 BULK_HOLIDAY_MODAL_RENDER", { isOpen, requestCount: pendingRequests?.length, timestamp: new Date() });
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" aria-labelledby="holiday-modal-title">
          <DialogTitle id="holiday-modal-title">Bulk Holiday Request Review</DialogTitle>
            Review and action multiple holiday requests efficiently
        <div className="space-y-4">
          {pendingRequests?.map((request: any, index: number) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{request.requesterName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {request.type} - {request.startDate} to {request.endDate}
                  </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Approve</Button>
                  <Button size="sm" variant="destructive">Reject</Button>
          ))}
export default function OwnerOperationsPage() {
  // Modal visibility states
  const [showCoverageModal, setShowCoverageModal] = useState(false);
  const [showTimeEntryModal, setShowTimeEntryModal] = useState(false);
  const [showBulkHolidayModal, setShowBulkHolidayModal] = useState(false);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number>();
  const [selectedUserName, setSelectedUserName] = useState<string>();
  // Auto-refresh timestamps
  const [lastRefresh, setLastRefresh] = useState(new Date());
  // Extensive debugging
  console.log("🚨 LIVE_OPS_DEBUG_INIT", { 
    timestamp: new Date().toISOString(),
    authLoading,
    isAuthenticated,
    user: user ? {
      id: user.id,
      username: user.username,
      role: user.role,
      tenantId: user.tenantId,
      firstName: user.firstName,
      lastName: user.lastName
    } : null,
    extractedRole: role,
    extractedTenantId: tenantId,
    isOwner,
    pageLocation: window.location.pathname
  // Early return if not authenticated or not owner
  if (authLoading) {
    console.log("🔄 LIVE_OPS_AUTH_LOADING");
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p>Loading authentication...</p>
      </div>
    </div>;
  }
  if (!isAuthenticated) {
    console.log("🚫 LIVE_OPS_NOT_AUTHENTICATED");
        <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
        <p>Please log in to access Live Operations.</p>
  if (!isOwner) {
    console.log("🚫 LIVE_OPS_NOT_OWNER", { role, isOwner });
        <h2 className="text-xl font-semibold mb-2">Owner Access Required</h2>
        <p>Only business owners can access Live Operations.</p>
  if (!tenantId) {
    console.log("🚫 LIVE_OPS_NO_TENANT", { tenantId, user });
        <h2 className="text-xl font-semibold mb-2">Business Context Missing</h2>
        <p>Unable to determine business context.</p>
  console.log("✅ LIVE_OPS_INITIALIZED", { tenantId, userId: user?.id, role });
  // Panel data queries with auto-refresh
  const { data: coverageData, isLoading: coverageLoading, refetch: refetchCoverage } = useQuery({
    queryKey: ["/api/dashboard/shift-coverage", tenantId],
    queryFn: () => dashboardApi.getShiftCoverage({ tenantId: tenantId! }),
    enabled: !!tenantId,
    refetchInterval: 60000, // 60 seconds
  const { data: strikesData, isLoading: strikesLoading, refetch: refetchStrikes } = useQuery({
    queryKey: ["/api/dashboard/strikes-summary", tenantId],
    queryFn: () => dashboardApi.getStrikesSummary(tenantId!),
    refetchInterval: 120000, // 2 minutes
  const { data: timeEntriesData, isLoading: timeEntriesLoading, refetch: refetchTimeEntries } = useQuery({
    queryKey: ["/api/dashboard/live-time-entries", tenantId],
    queryFn: () => dashboardApi.getLiveTimeEntries(tenantId!),
    refetchInterval: 30000, // 30 seconds
  const { data: pendingRequestsData, isLoading: pendingLoading, refetch: refetchPending } = useQuery({
    queryKey: ["/api/dashboard/pending-requests", tenantId],
    queryFn: () => dashboardApi.getPendingHolidayRequests(tenantId!),
    refetchInterval: 300000, // 5 minutes
  const { data: escalationsData, isLoading: escalationsLoading, refetch: refetchEscalations } = useQuery({
    queryKey: ["/api/dashboard/escalations", tenantId],
    queryFn: () => dashboardApi.getEscalations(tenantId!),
    refetchInterval: 60000, // 1 minute
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
  const openTimeEntryModal = (userId: number, userName: string) => {
    console.log("⏰ OPEN_TIME_ENTRY_MODAL", { userId, userName, timestamp: new Date() });
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setShowTimeEntryModal(true);
  const openBulkHolidayModal = () => {
    console.log("📋 OPEN_BULK_HOLIDAY_MODAL", { requestCount: pendingRequestsData?.length, timestamp: new Date() });
    setShowBulkHolidayModal(true);
  const navigateToStrikes = () => {
    console.log("🚨 NAVIGATE_TO_STRIKES", { destination: "/owner/strikes", timestamp: new Date() });
    navigate("/owner/strikes");
  const navigateToScheduling = () => {
    console.log("📅 NAVIGATE_TO_SCHEDULING", { destination: "/owner/scheduling", filter: "escalations", timestamp: new Date() });
    navigate("/owner/scheduling?filter=escalations");
  const navigateToRequests = () => {
    console.log("📋 NAVIGATE_TO_REQUESTS", { destination: "/owner/requests", timestamp: new Date() });
    navigate("/owner/requests");
  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "clocked_in": return "bg-green-500";
      case "on_break": return "bg-yellow-500";
      case "overdue": return "bg-red-500";
      default: return "bg-gray-400";
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "outline";
      default: return "secondary";
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading operations dashboard...</p>
    );
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MonitorSpeaker className="h-6 w-6" />
            Live Operations
          </h1>
          <p className="text-muted-foreground">Mission Control for your business operations</p>
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
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {coverageData?.active || 0}
                    <div className="text-xs text-muted-foreground">Confirmed</div>
                    <div className="text-xs text-gray-500 mt-1">Staff assigned and confirmed</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {coverageData?.upcoming || 0}
                    <div className="text-xs text-muted-foreground">Upcoming</div>
                    <div className="text-xs text-gray-500 mt-1">Shifts starting soon</div>
                    <div className="text-2xl font-bold text-red-600">
                      {coverageData?.unfilled || 0}
                    <div className="text-xs text-muted-foreground">Unfilled</div>
                    <div className="text-xs text-gray-500 mt-1">Shifts needing staff</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {coverageData?.underUtilized || 0}
                    <div className="text-xs text-muted-foreground">Under-utilized</div>
                    <div className="text-xs text-gray-500 mt-1">Shifts below capacity</div>
                <Button 
                  onClick={openCoverageDetails}
                  variant="outline" 
                  size="sm" 
                  className="w-full min-h-[44px]"
                  aria-label="View detailed shift coverage information"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
          </CardContent>
        </Card>
        {/* Strike Alerts Panel */}
            <CardTitle className="text-base font-medium">Strike Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            {strikesLoading ? (
                {strikesData && strikesData.totalPoints >= strikesData.maxStrikePoints && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Strike Limit Reached</span>
                      {strikesData?.totalPoints || 0}
                    <div className="text-xs text-muted-foreground">Total Points</div>
                      {strikesData?.staffWithStrikes || 0}
                    <div className="text-xs text-muted-foreground">Staff w/ Strikes</div>
                  onClick={navigateToStrikes}
                  aria-label="View staff strikes dashboard"
                  View Staff Strikes
        {/* Time-Entry Monitor Panel */}
            <CardTitle className="text-base font-medium">Time Tracking</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
            {timeEntriesLoading ? (
                <div className="space-y-2">
                  {timeEntriesData?.slice(0, 4).map((entry: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => openTimeEntryModal(entry.userId, entry.userName)}
                      className="flex items-center justify-between w-full p-2 rounded hover:bg-muted transition-colors min-h-[44px]"
                      aria-label={`View time entry details for ${entry.userName}`}
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusDotColor(entry.status)}`}></div>
                        <span className="text-sm font-medium">{entry.userName}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {entry.status.replace('_', ' ')}
                      </span>
                    </button>
                  ))}
                {timeEntriesData && timeEntriesData.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No staff currently working
        {/* Holiday & Sickness Queue Panel */}
            <CardTitle className="text-base font-medium">Request Queue</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
            {pendingLoading ? (
                      {pendingRequestsData?.filter(r => r.type === 'holiday').length || 0}
                    <div className="text-xs text-muted-foreground">Holiday</div>
                      {pendingRequestsData?.filter(r => r.type === 'sick').length || 0}
                    <div className="text-xs text-muted-foreground">Sick</div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {pendingRequestsData?.filter(r => r.priority === 'urgent').length || 0}
                  <div className="text-xs text-muted-foreground">Urgent</div>
                  onClick={navigateToRequests}
                  aria-label="Review pending holiday requests"
                  <FileText className="h-4 w-4 mr-2" />
                  Review Requests
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
          ) : (
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
                        <span className="text-xs text-muted-foreground">
                          {escalation.affectedShifts} shifts
                        </span>
                      <p className="text-xs text-muted-foreground">
                        {new Date(escalation.createdAt).toLocaleString()}
                      </p>
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No active escalations</p>
              <div className="flex justify-center">
                  onClick={() => setShowEscalationModal(true)}
                  variant="outline"
                  className="min-h-[44px]"
                  aria-label="Manage escalations in scheduling"
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Escalations
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
      <BulkHolidayModal 
        isOpen={showBulkHolidayModal}
        onClose={() => setShowBulkHolidayModal(false)}
        pendingRequests={pendingRequestsData}
      <EscalationModal 
        isOpen={showEscalationModal}
        onClose={() => setShowEscalationModal(false)}
        escalations={escalationsData || []}
        tenantId={tenantId!}
    </div>
