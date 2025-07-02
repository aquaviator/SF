import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/DataTable";
import { CalendarView } from "@/components/CalendarView";
import { useCrud } from "@/hooks/useCrud";
import { ModalForm } from "@/components/ModalForm";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Calendar,
  Clock,
  Users,
  Settings,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Plus,
  Copy,
  Loader2,
  List,
  CalendarDays
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Shift, ScheduleTemplate, InsertScheduleTemplate } from "@shared/schema";
import { insertScheduleTemplateSchema } from "@shared/schema";
import { z } from "zod";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

// Use template form schema that matches API exactly
const templateFormSchema = insertScheduleTemplateSchema.extend({
  description: z.string().optional(), // Allow optional description
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

// Shift form schema for CRUD operations
const shiftFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  role: z.string().min(1, "Role is required"),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
});

type ShiftFormData = z.infer<typeof shiftFormSchema>;

interface LiveOperation {
  id: number;
  staffName: string;
  shiftName: string;
  status: "clocked-in" | "clocked-out" | "on-break" | "absent";
  clockInTime?: string;
  breakTime?: string;
  location?: string;
  userId: number;
}

interface TimeEntry {
  id: number;
  tenantId: string;
  userId: number;
  shiftId?: number;
  clockInTime: string;
  clockOutTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  status: string;
  location?: string;
  notes?: string;
}

export default function Scheduling() {
  const { tenantId, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [shiftView, setShiftView] = useState<"list" | "calendar">("list");

  // Shift Planner
  const {
    data: shifts = [],
    isLoading: shiftsLoading,
    isModalOpen: shiftModalOpen,
    editingItem: editingShift,
    isSubmitting: shiftSubmitting,
    deleteDialogOpen: shiftDeleteDialogOpen,
    itemToDelete: shiftToDelete,
    openCreateModal: openCreateShift,
    openEditModal: openEditShift,
    closeModal: closeShiftModal,
    handleSubmit: handleShiftSubmit,
    handleDelete: handleShiftDelete,
    confirmDelete: confirmShiftDelete,
    cancelDelete: cancelShiftDelete,
  } = useCrud<Shift>({
    queryKey: ["/api/shifts", tenantId],
    endpoint: `/api/shifts?tenantId=${tenantId}`,
  });

  // Shift Templates - Real API Integration
  const {
    data: templates = [],
    isLoading: templatesLoading,
    isModalOpen: templateModalOpen,
    editingItem: editingTemplate,
    isSubmitting: templateSubmitting,
    deleteDialogOpen: templateDeleteDialogOpen,
    itemToDelete: templateToDelete,
    openCreateModal: openCreateTemplate,
    openEditModal: openEditTemplate,
    closeModal: closeTemplateModal,
    handleSubmit: handleTemplateSubmit,
    handleDelete: handleTemplateDelete,
    confirmDelete: confirmTemplateDelete,
    cancelDelete: cancelTemplateDelete,
  } = useCrud<ScheduleTemplate>({
    queryKey: ["/api/schedule-templates", tenantId],
    endpoint: `/api/schedule-templates?tenantId=${tenantId}`,
  });

  // Template form - FIXED to match API structure
  const templateForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      tenantId: tenantId,
      name: "",
      description: "",
      positions: [],
      assignmentType: "assigned",
      requiredStaffPerPosition: 1,
      recurrence: "weekly",
      isActive: true,
      createdBy: user?.id || 1,
    },
  });

  React.useEffect(() => {
    if (editingTemplate) {
      templateForm.reset({
        tenantId: editingTemplate.tenantId,
        name: editingTemplate.name,
        description: editingTemplate.description || "",
        positions: editingTemplate.positions || [],
        assignmentType: editingTemplate.assignmentType,
        requiredStaffPerPosition: editingTemplate.requiredStaffPerPosition,
        recurrence: editingTemplate.recurrence,
        isActive: editingTemplate.isActive,
        createdBy: editingTemplate.createdBy,
      });
    } else {
      templateForm.reset({
        tenantId: tenantId,
        name: "",
        description: "",
        positions: [],
        assignmentType: "assigned",
        requiredStaffPerPosition: 1,
        recurrence: "weekly",
        isActive: true,
        createdBy: user?.id || 1,
      });
    }
  }, [editingTemplate, templateForm]);

  // Shift form - IMPLEMENTING MISSING CRUD FUNCTIONALITY
  const shiftForm = useForm<ShiftFormData>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      startTime: "09:00",
      endTime: "17:00",
      role: "",
      description: "",
      location: "",
      assignedTo: "",
      notes: "",
    },
  });

  React.useEffect(() => {
    if (editingShift) {
      shiftForm.reset({
        date: editingShift.date,
        startTime: editingShift.startTime,
        endTime: editingShift.endTime,
        role: editingShift.role,
        description: editingShift.description,
        location: editingShift.location,
        assignedTo: editingShift.assignedTo?.toString() || "",
        notes: editingShift.notes || "",
      });
    } else {
      shiftForm.reset({
        date: new Date().toISOString().split('T')[0],
        startTime: "09:00",
        endTime: "17:00",
        role: "",
        description: "",
        location: "",
        assignedTo: "",
        notes: "",
      });
    }
  }, [editingShift, shiftForm]);

  // Time Entries - Real API Integration
  const { data: timeEntries = [], isLoading: timeEntriesLoading } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/time-entries?tenantId=${tenantId}`);
      if (!response.ok) throw new Error("Failed to fetch time entries");
      return response.json();
    },
  });

  // Staff data for live operations
  const { data: staff = [] } = useQuery({
    queryKey: ["/api/staff", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/staff?tenantId=${tenantId}`);
      if (!response.ok) throw new Error("Failed to fetch staff");
      return response.json();
    },
  });

  // Active Time Entry for current user
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

  // Break start mutation
  const breakStartMutation = useMutation({
    mutationFn: async (timeEntryId: number) => {
      return apiRequest(`/api/time-entries/${timeEntryId}`, "PATCH", {
        breakStartTime: new Date().toISOString(),
        status: "on-break",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries/active"] });
      toast({ title: "Success", description: "Break started" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to start break", variant: "destructive" });
    },
  });

  // Break end mutation
  const breakEndMutation = useMutation({
    mutationFn: async (timeEntryId: number) => {
      return apiRequest(`/api/time-entries/${timeEntryId}`, "PATCH", {
        breakEndTime: new Date().toISOString(),
        status: "clocked-in",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries/active"] });
      toast({ title: "Success", description: "Break ended" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to end break", variant: "destructive" });
    },
  });

  // Transform time entries to live operations format
  const liveOps: LiveOperation[] = timeEntries.map((entry: TimeEntry) => {
    const staffMember = staff.find((s: any) => s.id === entry.userId);
    return {
      id: entry.id,
      staffName: staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : "Unknown",
      shiftName: entry.shiftId ? `Shift ${entry.shiftId}` : "General",
      status: entry.status as LiveOperation["status"],
      clockInTime: entry.clockInTime ? new Date(entry.clockInTime).toLocaleTimeString() : "",
      breakTime: entry.breakStartTime ? new Date(entry.breakStartTime).toLocaleTimeString() : undefined,
      location: entry.location || "",
      userId: entry.userId,
    };
  });

  const getStatusBadge = (status: LiveOperation["status"]) => {
    const variants = {
      "clocked-in": "bg-green-100 text-green-800",
      "clocked-out": "bg-gray-100 text-gray-800",
      "on-break": "bg-yellow-100 text-yellow-800",
      "absent": "bg-red-100 text-red-800",
    };

    const labels = {
      "clocked-in": "Clocked In",
      "clocked-out": "Clocked Out",
      "on-break": "On Break", 
      "absent": "Absent",
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getStatusIcon = (status: LiveOperation["status"]) => {
    switch (status) {
      case "clocked-in":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "on-break":
        return <Pause className="w-4 h-4 text-yellow-600" />;
      case "absent":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const shiftColumns: Column<Shift>[] = [
    {
      key: "description",
      header: "Shift Details",
      cell: (shift) => (
        <div>
          <p className="font-medium text-sm">{shift.description}</p>
          <p className="text-xs text-gray-500">{shift.location}</p>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date & Time",
      cell: (shift) => (
        <div>
          <p className="text-sm">{new Date(shift.date).toLocaleDateString()}</p>
          <p className="text-xs text-gray-500">{shift.startTime} - {shift.endTime}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (shift) => (
        <Badge variant={shift.status === "confirmed" ? "default" : "secondary"}>
          {shift.status}
        </Badge>
      ),
    },
  ];

  const templateColumns: Column<ScheduleTemplate>[] = [
    {
      key: "name",
      header: "Template",
      cell: (template) => (
        <div>
          <p className="font-medium text-sm">{template.name}</p>
          <p className="text-xs text-gray-500">{template.description}</p>
        </div>
      ),
    },
    {
      key: "recurrence",
      header: "Recurrence",
      cell: (template) => (
        <Badge variant="outline">{template.recurrence}</Badge>
      ),
    },
    {
      key: "shifts",
      header: "Shifts",
      cell: (template) => (
        <div className="text-sm">
          <p>{template.shifts.length} shifts</p>
          <p className="text-xs text-gray-500">Template pattern</p>
        </div>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      cell: (template) => (
        <Badge variant={template.isActive ? "default" : "secondary"}>
          {template.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (template) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Copy className="w-3 h-3 mr-1" />
            Use
          </Button>
          <Button size="sm" variant="ghost">
            <Settings className="w-3 h-3" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Scheduling</h2>
          <p className="text-gray-600">Manage shifts, templates, and live operations</p>
        </div>
      </div>

      <Tabs defaultValue="planner" className="space-y-6">
        <TabsList>
          <TabsTrigger value="planner" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Shift Planner
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Copy className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="live" className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Live Operations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="planner" className="space-y-6">
          {/* View Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Scheduled Shifts</h2>
              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                <Button
                  variant={shiftView === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setShiftView("list")}
                  className="flex items-center gap-1"
                >
                  <List className="w-4 h-4" />
                  List
                </Button>
                <Button
                  variant={shiftView === "calendar" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setShiftView("calendar")}
                  className="flex items-center gap-1"
                >
                  <CalendarDays className="w-4 h-4" />
                  Calendar
                </Button>
              </div>
            </div>
            
            {user?.role === "owner" && (
              <Button onClick={openCreateShift} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Shift
              </Button>
            )}
          </div>

          {/* View Content */}
          {shiftView === "list" ? (
            <DataTable
              data={shifts}
              columns={shiftColumns}
              title="Scheduled Shifts"
              onAdd={openCreateShift}
              onEdit={openEditShift}
              onDelete={handleShiftDelete}
              addLabel="Create Shift"
              isLoading={shiftsLoading}
              emptyState={
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No shifts scheduled</p>
                  <p className="text-sm text-gray-400">Create your first shift to get started</p>
                </div>
              }
            />
          ) : (
            <CalendarView
              shifts={shifts}
              onCreateShift={(date) => {
                // Pre-fill the shift form with the selected date
                openCreateShift();
                // TODO: Pass date to form when modal opens
              }}
              onEditShift={(shift) => {
                openEditShift(shift);
              }}
              onDuplicateShift={(shift) => {
                // Create a duplicate shift for today
                const today = new Date().toISOString().split('T')[0];
                const duplicatedShift = { 
                  ...shift, 
                  date: today,
                  id: undefined,
                  assignedTo: null,
                  status: "open" as const
                };
                // Pass the duplicated shift data to create a new shift
                openCreateShift();
                // TODO: Pre-fill form with duplicated data
              }}
              onDeleteShift={(shiftId) => {
                const shift = shifts.find(s => s.id === shiftId);
                if (shift) {
                  handleShiftDelete(shift);
                }
              }}
              userRole={user?.role || "staff"}
            />
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <DataTable
            data={templates}
            columns={templateColumns}
            title="Shift Templates"
            onAdd={openCreateTemplate}
            onEdit={openEditTemplate}
            onDelete={handleTemplateDelete}
            addLabel="Create Template"
            isLoading={templatesLoading}
            emptyState={
              <div className="text-center py-8">
                <Copy className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No templates created</p>
                <p className="text-sm text-gray-400">Create reusable shift templates</p>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="live" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Clocked In</p>
                    <p className="text-2xl font-bold text-green-600">
                      {liveOps.filter(op => op.status === "clocked-in").length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">On Break</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {liveOps.filter(op => op.status === "on-break").length}
                    </p>
                  </div>
                  <Pause className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Absent</p>
                    <p className="text-2xl font-bold text-red-600">
                      {liveOps.filter(op => op.status === "absent").length}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Staff</p>
                    <p className="text-2xl font-bold text-blue-600">{liveOps.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Staff Clock-in/out Controls for Staff Users */}
          {user?.role === "staff" && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Clock In/Out
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {!activeTimeEntry ? (
                    <Button 
                      onClick={() => clockInMutation.mutate({ location: "Office" })}
                      disabled={clockInMutation.isPending}
                    >
                      {clockInMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <Play className="w-4 h-4 mr-2" />
                      Clock In
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      {activeTimeEntry.status === "clocked-in" && (
                        <>
                          <Button 
                            variant="secondary"
                            onClick={() => breakStartMutation.mutate(activeTimeEntry.id)}
                            disabled={breakStartMutation.isPending}
                          >
                            {breakStartMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            <Pause className="w-4 h-4 mr-2" />
                            Start Break
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={() => clockOutMutation.mutate(activeTimeEntry.id)}
                            disabled={clockOutMutation.isPending}
                          >
                            {clockOutMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Clock Out
                          </Button>
                        </>
                      )}
                      {activeTimeEntry.status === "on-break" && (
                        <Button 
                          onClick={() => breakEndMutation.mutate(activeTimeEntry.id)}
                          disabled={breakEndMutation.isPending}
                        >
                          {breakEndMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          <Play className="w-4 h-4 mr-2" />
                          End Break
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {activeTimeEntry && (
                    <div className="text-sm text-gray-600">
                      Status: {getStatusBadge(activeTimeEntry.status)}
                      {activeTimeEntry.clockInTime && (
                        <span className="ml-2">
                          Since: {new Date(activeTimeEntry.clockInTime).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Play className="w-5 h-5 mr-2" />
                Live Staff Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeEntriesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : liveOps.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No active time entries</p>
                    <p className="text-sm text-gray-400">Staff will appear here when they clock in</p>
                  </div>
                ) : (
                  liveOps.map((operation) => (
                    <div key={operation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(operation.status)}
                        <div>
                          <p className="font-medium text-sm">{operation.staffName}</p>
                          <p className="text-xs text-gray-500">{operation.shiftName} • {operation.location}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {operation.clockInTime && (
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Clocked in</p>
                            <p className="text-sm font-medium">{operation.clockInTime}</p>
                          </div>
                        )}
                        {operation.breakTime && (
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Break started</p>
                            <p className="text-sm font-medium">{operation.breakTime}</p>
                          </div>
                        )}
                        {getStatusBadge(operation.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Form Modal */}
      <ModalForm
        isOpen={templateModalOpen}
        onClose={closeTemplateModal}
        title={editingTemplate ? "Edit Template" : "Create Template"}
        form={templateForm}
        onSubmit={handleTemplateSubmit}
        isLoading={templateSubmitting}
      >
        <div className="space-y-4">
          <FormField
            control={templateForm.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Morning Customer Service" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={templateForm.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the template purpose..." 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={templateForm.control}
            name="assignmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assignment Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignment type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="assigned">Assigned Staff</SelectItem>
                    <SelectItem value="open_opportunity">Open Opportunity</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={templateForm.control}
              name="requiredStaffPerPosition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Staff per Position</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1" 
                      placeholder="1" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={templateForm.control}
              name="recurrence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recurrence Pattern</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recurrence" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={templateForm.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Active Template</FormLabel>
                  <div className="text-sm text-gray-500">
                    Make this template available for use
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </ModalForm>

      {/* Shift CRUD Modal - IMPLEMENTING MISSING FUNCTIONALITY */}
      <ModalForm
        isOpen={shiftModalOpen}
        onClose={closeShiftModal}
        title={editingShift ? "Edit Shift" : "Create Shift"}
        form={shiftForm}
        onSubmit={(formData) => {
          // Transform form data to match API structure
          const shiftData = {
            tenantId: tenantId,
            date: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
            role: formData.role,
            description: formData.description,
            location: formData.location,
            assignedTo: formData.assignedTo ? parseInt(formData.assignedTo) : null,
            status: "open" as const,
            assignmentType: "assigned" as const,
            requiredStaff: 1,
            claimedBy: null,
            templateId: null,
            createdBy: Number(user?.id) || 1,
            notes: formData.notes || null,
          };
          handleShiftSubmit(shiftData);
        }}
        isLoading={shiftSubmitting}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={shiftForm.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={shiftForm.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="server">Server</SelectItem>
                      <SelectItem value="bartender">Bartender</SelectItem>
                      <SelectItem value="host">Host</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="chef">Chef</SelectItem>
                      <SelectItem value="cleaner">Cleaner</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={shiftForm.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={shiftForm.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={shiftForm.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Main Dining Hall" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={shiftForm.control}
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign To Staff (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Leave unassigned or select staff" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {staff.map((member: any) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.firstName} {member.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={shiftForm.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Shift description..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={shiftForm.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Additional notes..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </ModalForm>

      {/* Delete Confirmation Dialogs - FIXED browser confirm issue */}
      <DeleteConfirmDialog
        isOpen={shiftDeleteDialogOpen}
        onClose={cancelShiftDelete}
        onConfirm={confirmShiftDelete}
        title="Delete Shift"
        itemName={shiftToDelete ? `shift for ${shiftToDelete.date}` : "this shift"}
      />

      <DeleteConfirmDialog
        isOpen={templateDeleteDialogOpen}
        onClose={cancelTemplateDelete}
        onConfirm={confirmTemplateDelete}
        title="Delete Template"
        itemName={templateToDelete ? `template "${templateToDelete.name}"` : "this template"}
      />
    </div>
  );
}