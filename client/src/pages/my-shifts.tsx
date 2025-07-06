import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRole } from "@/hooks/useRole";
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

export default function MyShifts() {
  const { tenantId, user } = useRole();
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

  // Define columns for shifts table
  const columns: Column<Shift>[] = [
    {
      key: "date",
      header: "Date",
      cell: (shift) => new Date(shift.date).toLocaleDateString(),
    },
    {
      key: "startTime",
      header: "Time",
      cell: (shift) => `${shift.startTime} - ${shift.endTime}`,
    },
    {
      key: "role",
      header: "Role",
      cell: (shift) => shift.role,
    },
    {
      key: "location",
      header: "Location", 
      cell: (shift) => shift.location,
    },
    {
      key: "status",
      header: "Status",
      cell: (shift) => getStatusBadge(shift.status),
    },
  ];

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
            {new Date(shift.date).toLocaleDateString()}
          </div>
          <div className="text-sm text-gray-500">
            {shift.startTime} - {shift.endTime}
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
    },
    {
      key: "status",
      header: "Status",
      cell: (shift) => getStatusBadge(shift.status),
    },
    {
      key: "notes",
      header: "Notes",
      cell: (shift) => (
        <div className="text-sm text-gray-600 max-w-xs truncate">
          {shift.notes || "No notes"}
        </div>
      ),
    },
  ];

  const upcomingShifts = shifts?.filter(shift => new Date(shift.date) >= new Date()) || [];
  const nextShift = upcomingShifts[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Shifts</h2>
        <p className="text-gray-600">View and manage your scheduled shifts</p>
      </div>

      {nextShift && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Next Shift
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">
                    {new Date(nextShift.date).toLocaleDateString()} at {nextShift.startTime}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{nextShift.role}</span>
                </div>
                {nextShift.notes && (
                  <p className="text-sm text-gray-600">{nextShift.notes}</p>
                )}
              </div>
              <div className="text-right">
                {getStatusBadge(nextShift.status)}
                {nextShift.status === "assigned" && (
                  <Button size="sm" className="ml-2">
                    Confirm
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable
        data={shifts || []}
        columns={columns}
        title="All My Shifts"
        isLoading={shiftsLoading}
        emptyState={
          <div className="text-center py-8">
            <p className="text-gray-500">No shifts assigned</p>
            <p className="text-sm text-gray-400">Check back later for new assignments</p>
          </div>
        }
      />
    </div>
  );
}
