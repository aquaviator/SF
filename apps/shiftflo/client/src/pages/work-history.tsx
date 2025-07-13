import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRole } from "@/hooks/useRole";
import { DataTable, Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Clock, 
  MapPin, 
  Calendar,
  DollarSign,
  FileText,
  Eye,
  Edit,
  CheckCircle,
  AlertCircle,
  Timer,
  Briefcase,
  TrendingUp,
  History,
  Loader2
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface WorkHistoryEntry {
  id: number;
  date: string;
  role: string;
  location: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  clockInTime: string | null;
  clockOutTime: string | null;
  totalHours: string | null;
  status: string;
  notes: string | null;
  shiftNotes: string | null;
  earnings: number | null;
  hourlyRate: number | null;
  lateByMinutes: number | null;
  earlyByMinutes: number | null;
  overrideNote: string | null;
  adjustmentReason: string | null;
}

const notesFormSchema = z.object({
  notes: z.string().optional(),
});

type NotesFormData = z.infer<typeof notesFormSchema>;

export default function WorkHistory() {
  const { tenantId, user } = useRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEntry, setSelectedEntry] = useState<WorkHistoryEntry | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const form = useForm<NotesFormData>({
    resolver: zodResolver(notesFormSchema),
  });

  // Fetch work history data
  const { data: workHistory = [], isLoading } = useQuery({
    queryKey: ["/api/work-history", tenantId, user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/work-history?tenantId=${tenantId}&userId=${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch work history");
      return response.json() as WorkHistoryEntry[];
    },
    enabled: !!tenantId && !!user?.id,
  });

  // Update notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: async (data: { timeEntryId: number; notes: string }) => {
      return apiRequest(`/api/time-entries/${data.timeEntryId}/notes`, {
        method: "PUT",
        body: { notes: data.notes },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-history"] });
      toast({
        title: "Notes updated",
        description: "Your notes have been saved successfully.",
      });
      setIsEditingNotes(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notes. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalShifts = workHistory.length;
    const totalEarnings = workHistory.reduce((sum, entry) => sum + (entry.earnings || 0), 0);
    const totalHours = workHistory.reduce((sum, entry) => {
      const hours = entry.totalHours ? parseFloat(entry.totalHours) : 0;
      return sum + hours;
    }, 0);
    const completedShifts = workHistory.filter(entry => entry.status === "clocked_out").length;
    const averageHours = totalShifts > 0 ? totalHours / totalShifts : 0;

    return {
      totalShifts,
      totalEarnings,
      totalHours,
      completedShifts,
      averageHours,
      completionRate: totalShifts > 0 ? (completedShifts / totalShifts) * 100 : 0,
    };
  }, [workHistory]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      clocked_out: { label: "Completed", variant: "default" as const, icon: CheckCircle },
      clocked_in: { label: "In Progress", variant: "default" as const, icon: Timer },
      on_break: { label: "On Break", variant: "secondary" as const, icon: Timer },
      missing: { label: "Missing", variant: "destructive" as const, icon: AlertCircle },
      late: { label: "Late", variant: "secondary" as const, icon: Clock },
      early_exit: { label: "Early Exit", variant: "secondary" as const, icon: Clock },
      adjusted: { label: "Adjusted", variant: "outline" as const, icon: Edit },
      on_time: { label: "On Time", variant: "default" as const, icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "outline" as const,
      icon: Clock,
    };

    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "£0.00";
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "N/A";
    try {
      return format(parseISO(timeString), "HH:mm");
    } catch {
      return timeString;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "EEE, dd MMM yyyy");
    } catch {
      return dateString;
    }
  };

  const openDetailsModal = (entry: WorkHistoryEntry) => {
    setSelectedEntry(entry);
    form.reset({ notes: entry.notes || "" });
    setIsDetailsModalOpen(true);
    setIsEditingNotes(false);
  };

  const handleUpdateNotes = (data: NotesFormData) => {
    if (!selectedEntry) return;
    updateNotesMutation.mutate({
      timeEntryId: selectedEntry.id,
      notes: data.notes || "",
    });
  };

  const columns: Column<WorkHistoryEntry>[] = [
    {
      id: "date",
      header: "Date",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{formatDate(row.date)}</span>
          <span className="text-sm text-muted-foreground">{row.role}</span>
        </div>
      ),
    },
    {
      id: "time",
      header: "Time",
      cell: ({ row }) => (
        <div className="flex flex-col text-sm">
          <span>{formatTime(row.scheduledStartTime)} - {formatTime(row.scheduledEndTime)}</span>
          {row.clockInTime && row.clockOutTime && (
            <span className="text-muted-foreground">
              Actual: {formatTime(row.clockInTime)} - {formatTime(row.clockOutTime)}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "location",
      header: "Location",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{row.location}</span>
        </div>
      ),
    },
    {
      id: "hours",
      header: "Hours",
      cell: ({ row }) => (
        <div className="flex flex-col text-sm">
          <span className="font-medium">{row.totalHours || "N/A"}</span>
          {row.lateByMinutes && (
            <span className="text-red-600 text-xs">Late: {row.lateByMinutes}m</span>
          )}
          {row.earlyByMinutes && (
            <span className="text-amber-600 text-xs">Early: {row.earlyByMinutes}m</span>
          )}
        </div>
      ),
    },
    {
      id: "earnings",
      header: "Earnings",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{formatCurrency(row.earnings)}</span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.status),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openDetailsModal(row)}
          className="h-8 w-8 p-0"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Work History</h1>
          <p className="text-muted-foreground">
            View all your completed shifts with detailed time tracking and earnings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {workHistory.length} total shifts
          </span>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalShifts}</div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.completionRate.toFixed(1)}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.completedShifts} completed shifts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.averageHours.toFixed(1)} hours/shift average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Work History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Work History</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={workHistory} />
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Shift Details</DialogTitle>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm">{formatDate(selectedEntry.date)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Role</Label>
                  <p className="text-sm">{selectedEntry.role}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Location</Label>
                  <p className="text-sm">{selectedEntry.location}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedEntry.status)}</div>
                </div>
              </div>

              {/* Time Information */}
              <div className="space-y-4">
                <h3 className="font-medium">Time Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Scheduled Time</Label>
                    <p className="text-sm">
                      {formatTime(selectedEntry.scheduledStartTime)} - {formatTime(selectedEntry.scheduledEndTime)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Actual Time</Label>
                    <p className="text-sm">
                      {selectedEntry.clockInTime && selectedEntry.clockOutTime ? 
                        `${formatTime(selectedEntry.clockInTime)} - ${formatTime(selectedEntry.clockOutTime)}` :
                        "N/A"
                      }
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Hours</Label>
                    <p className="text-sm">{selectedEntry.totalHours || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Earnings</Label>
                    <p className="text-sm font-medium">{formatCurrency(selectedEntry.earnings)}</p>
                  </div>
                </div>

                {/* Late/Early Information */}
                {(selectedEntry.lateByMinutes || selectedEntry.earlyByMinutes) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedEntry.lateByMinutes && (
                      <div>
                        <Label className="text-sm font-medium">Late By</Label>
                        <p className="text-sm text-red-600">{selectedEntry.lateByMinutes} minutes</p>
                      </div>
                    )}
                    {selectedEntry.earlyByMinutes && (
                      <div>
                        <Label className="text-sm font-medium">Early By</Label>
                        <p className="text-sm text-amber-600">{selectedEntry.earlyByMinutes} minutes</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Adjustments */}
              {(selectedEntry.overrideNote || selectedEntry.adjustmentReason) && (
                <div className="space-y-2">
                  <h3 className="font-medium">Adjustments</h3>
                  {selectedEntry.adjustmentReason && (
                    <div>
                      <Label className="text-sm font-medium">Adjustment Reason</Label>
                      <p className="text-sm">{selectedEntry.adjustmentReason}</p>
                    </div>
                  )}
                  {selectedEntry.overrideNote && (
                    <div>
                      <Label className="text-sm font-medium">Override Note</Label>
                      <p className="text-sm">{selectedEntry.overrideNote}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Shift Notes */}
              {selectedEntry.shiftNotes && (
                <div>
                  <Label className="text-sm font-medium">Shift Notes</Label>
                  <p className="text-sm">{selectedEntry.shiftNotes}</p>
                </div>
              )}

              {/* Personal Notes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">My Notes</Label>
                  {!isEditingNotes && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingNotes(true)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
                
                {isEditingNotes ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleUpdateNotes)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Add your notes about this shift..."
                                className="min-h-[100px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={updateNotesMutation.isPending}
                        >
                          {updateNotesMutation.isPending && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingNotes(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {selectedEntry.notes || "No notes added yet"}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}