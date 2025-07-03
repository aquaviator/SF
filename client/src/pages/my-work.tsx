import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable, Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Play, 
  Pause,
  TrendingUp,
  Users,
  Briefcase,
  RefreshCw,
  Loader2
} from "lucide-react";
import type { Shift } from "@shared/schema";

export default function MyWork() {
  const { tenantId, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch my shifts
  const { data: shifts = [], isLoading: shiftsLoading } = useQuery<Shift[]>({
    queryKey: ["/api/my-shifts", tenantId, user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/my-shifts?tenantId=${tenantId}&userId=${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch shifts");
      return response.json();
    },
  });

  // Fetch my assignments
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["/api/assignments", tenantId, user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/assignments?tenantId=${tenantId}&userId=${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch assignments");
      return response.json();
    },
  });

  // Fetch my time entries for time tracking
  const { data: timeEntries = [], isLoading: timeEntriesLoading } = useQuery({
    queryKey: ["/api/time-entries", tenantId, user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/time-entries?tenantId=${tenantId}&userId=${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch time entries");
      return response.json();
    },
  });

  // Fetch active time entry for clock-in status
  const { data: activeTimeEntry } = useQuery({
    queryKey: ["/api/time-entries/active", tenantId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch(`/api/time-entries/active?tenantId=${tenantId}&userId=${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch active time entry");
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch swap requests
  const { data: swapRequests = [], isLoading: swapRequestsLoading } = useQuery({
    queryKey: ["/api/swap-requests", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/swap-requests?tenantId=${tenantId}`);
      if (!response.ok) throw new Error("Failed to fetch swap requests");
      return response.json();
    },
  });

  // Clock-in mutation
  const clockInMutation = useMutation({
    mutationFn: async (data: { location?: string; shiftId?: number }) => {
      return apiRequest("/api/time-entries", "POST", {
        tenantId,
        userId: user?.id,
        clockInTime: new Date().toISOString(),
        status: "clocked-in",
        location: data.location || "",
        shiftId: data.shiftId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries/active"] });
      toast({ title: "Success", description: "Clocked in successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to clock in", variant: "destructive" });
    },
  });

  // Clock-out mutation
  const clockOutMutation = useMutation({
    mutationFn: async (timeEntryId: number) => {
      return apiRequest(`/api/time-entries/${timeEntryId}`, "PATCH", {
        clockOutTime: new Date().toISOString(),
        status: "clocked-out",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries/active"] });
      toast({ title: "Success", description: "Clocked out successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to clock out", variant: "destructive" });
    },
  });

  // Helper functions
  const getStatusBadge = (status: string) => {
    const variants = {
      assigned: "bg-blue-100 text-blue-800",
      confirmed: "bg-green-100 text-green-800",
      conflict: "bg-red-100 text-red-800",
      "clocked-in": "bg-green-100 text-green-800",
      "clocked-out": "bg-gray-100 text-gray-800",
      "on-break": "bg-yellow-100 text-yellow-800",
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Column definitions for different tabs
  const shiftColumns: Column<Shift>[] = [
    {
      key: "date",
      header: "Date & Time",
      cell: (shift) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {formatDate(shift.date)}
          </div>
          <div className="text-sm text-gray-500">
            {shift.startTime} - {shift.endTime}
          </div>
        </div>
      ),
    },
    {
      key: "title",
      header: "Shift",
      cell: (shift) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{shift.role}</div>
          <div className="text-sm text-gray-500 flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            {shift.location}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (shift) => getStatusBadge(shift.status),
    },
  ];

  const assignmentColumns: Column<any>[] = [
    {
      key: "shift",
      header: "Shift Details",
      cell: (assignment) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{assignment.title || "Shift Assignment"}</div>
          <div className="text-sm text-gray-500">{formatDate(assignment.date || assignment.createdAt)} • {assignment.startTime || "TBD"} - {assignment.endTime || "TBD"}</div>
        </div>
      ),
    },
    {
      key: "instructions",
      header: "Work Instructions",
      cell: (assignment) => (
        <div className="text-sm text-gray-900">{assignment.instructions || assignment.description || "No specific instructions"}</div>
      ),
    },
    {
      key: "location",
      header: "Location & Contacts",
      cell: (assignment) => (
        <div>
          <div className="text-sm font-medium text-gray-900 flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            {assignment.location || "TBD"}
          </div>
          {assignment.contactInfo && (
            <div className="text-sm text-gray-500">{assignment.contactInfo}</div>
          )}
        </div>
      ),
    },
  ];

  const timeEntryColumns: Column<any>[] = [
    {
      key: "date",
      header: "Date",
      cell: (entry) => (
        <div className="text-sm font-medium text-gray-900">
          {formatDate(entry.clockInTime)}
        </div>
      ),
    },
    {
      key: "times",
      header: "Clock In/Out",
      cell: (entry) => (
        <div>
          <div className="text-sm text-gray-900">
            In: {formatTime(entry.clockInTime)}
          </div>
          {entry.clockOutTime && (
            <div className="text-sm text-gray-500">
              Out: {formatTime(entry.clockOutTime)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      cell: (entry) => {
        if (!entry.clockOutTime) return <span className="text-sm text-gray-500">In Progress</span>;
        const duration = new Date(entry.clockOutTime).getTime() - new Date(entry.clockInTime).getTime();
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        return <span className="text-sm font-medium text-gray-900">{hours}h {minutes}m</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (entry) => getStatusBadge(entry.status),
    },
  ];

  const requestColumns: Column<any>[] = [
    {
      key: "type",
      header: "Request Type",
      cell: (request) => (
        <div className="text-sm font-medium text-gray-900">
          {request.type === 'swap' ? 'Shift Swap' : 'Holiday Request'}
        </div>
      ),
    },
    {
      key: "details",
      header: "Details",
      cell: (request) => (
        <div className="text-sm text-gray-900">
          {request.type === 'swap' ? 
            `${request.originalShift?.title || 'Original'} → ${request.requestedShift?.title || 'Requested'}` :
            `${formatDate(request.startDate)} - ${formatDate(request.endDate)}`
          }
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (request) => getStatusBadge(request.status),
    },
    {
      key: "date",
      header: "Requested",
      cell: (request) => (
        <div className="text-sm text-gray-500">
          {formatDate(request.createdAt)}
        </div>
      ),
    },
  ];

  const isLoading = shiftsLoading || assignmentsLoading || timeEntriesLoading || swapRequestsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Work</h1>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Shift</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {shifts.length > 0 ? formatDate(shifts[0].date) : "No shifts"}
            </div>
            <p className="text-xs text-muted-foreground">
              {shifts.length > 0 ? `${shifts[0].startTime} - ${shifts[0].endTime}` : "scheduled"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shifts.length}</div>
            <p className="text-xs text-muted-foreground">shifts scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Status</CardTitle>
            {activeTimeEntry ? <Play className="h-4 w-4 text-green-600" /> : <Pause className="h-4 w-4 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeTimeEntry ? "Clocked In" : "Clocked Out"}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeTimeEntry ? `Since ${formatTime(activeTimeEntry.clockInTime)}` : "Ready to clock in"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {swapRequests.filter((r: any) => r.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">pending requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="schedule" className="w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <h2 className="page-section__title">My Work</h2>
          <TabsList className="tab-strip grid w-full md:w-auto grid-cols-2 lg:grid-cols-4 gap-1">
            <TabsTrigger value="schedule" className="tab flex items-center gap-1 p-2 text-xs md:text-sm min-h-[44px]">
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="truncate">Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="tab flex items-center gap-1 p-2 text-xs md:text-sm min-h-[44px]">
              <Briefcase className="h-4 w-4 shrink-0" />
              <span className="truncate">Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="timetracking" className="tab flex items-center gap-1 p-2 text-xs md:text-sm min-h-[44px]">
              <Clock className="h-4 w-4 shrink-0" />
              <span className="truncate">Time</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="tab flex items-center gap-1 p-2 text-xs md:text-sm min-h-[44px]">
              <RefreshCw className="h-4 w-4 shrink-0" />
              <span className="truncate">Requests</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="schedule" className="space-y-4">
          <DataTable
            data={shifts}
            columns={shiftColumns}
            title="My Schedule"
            isLoading={shiftsLoading}
            emptyState={
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No shifts scheduled</h3>
                <p className="text-gray-500">Check back later for new shift assignments.</p>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <DataTable
            data={assignments}
            columns={assignmentColumns}
            title="Work Assignments"
            isLoading={assignmentsLoading}
            emptyState={
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments</h3>
                <p className="text-gray-500">Your work assignments will appear here.</p>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="timetracking" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Time Tracking</h3>
            <div className="flex gap-2">
              {activeTimeEntry ? (
                <Button
                  onClick={() => clockOutMutation.mutate(activeTimeEntry.id)}
                  disabled={clockOutMutation.isPending}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {clockOutMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                  Clock Out
                </Button>
              ) : (
                <Button
                  onClick={() => clockInMutation.mutate({})}
                  disabled={clockInMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {clockInMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Clock In
                </Button>
              )}
            </div>
          </div>

          <DataTable
            data={timeEntries}
            columns={timeEntryColumns}
            title="Time History"
            isLoading={timeEntriesLoading}
            emptyState={
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No time entries</h3>
                <p className="text-gray-500">Clock in to start tracking your time.</p>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <DataTable
            data={swapRequests}
            columns={requestColumns}
            title="My Requests"
            isLoading={swapRequestsLoading}
            emptyState={
              <div className="text-center py-8">
                <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No requests</h3>
                <p className="text-gray-500">Your swap and holiday requests will appear here.</p>
              </div>
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}