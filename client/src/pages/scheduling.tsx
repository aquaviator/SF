import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/DataTable";
import { CalendarView } from "@/components/CalendarView";
import { CalendarLegend } from "@/components/CalendarLegend";
import { useCrud } from "@/hooks/useCrud";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
  CalendarDays,
  Trash2,
  Edit
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Shift, ScheduleTemplate, InsertScheduleTemplate } from "@shared/schema";
import { insertScheduleTemplateSchema } from "@shared/schema";
import { z } from "zod";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

// Define shift form schema
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

// Define enhanced template schema with slots
const enhancedTemplateSchema = insertScheduleTemplateSchema.extend({
  slots: z.array(z.object({
    role: z.string(),
    quantity: z.number().min(1),
    staffIds: z.array(z.number()).default([])
  })).optional().default([])
});

type EnhancedTemplateData = z.infer<typeof enhancedTemplateSchema>;

export default function Scheduling() {
  const { user, tenantId, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Template modal state
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ScheduleTemplate | null>(null);
  const [templateSubmitting, setTemplateSubmitting] = useState(false);
  const [templateDeleteDialogOpen, setTemplateDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<ScheduleTemplate | null>(null);

  // Calendar functionality
  const [calendarView, setCalendarView] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [calendarEditMode, setCalendarEditMode] = useState(false);
  


  // Shift CRUD functionality
  const {
    data: shifts = [],
    isLoading: shiftsLoading,
    isModalOpen: shiftModalOpen,
    editingItem: editingShift,
    isSubmitting: shiftSubmitting,
    deleteDialogOpen: shiftDeleteDialogOpen,
    itemToDelete: shiftToDelete,
    openCreateModal: openCreateShiftModal,
    openEditModal: openEditShiftModal,
    closeModal: closeShiftModal,
    handleSubmit: handleShiftSubmit,
    handleDelete: handleShiftDelete,
    confirmDelete: confirmShiftDelete,
    cancelDelete: cancelShiftDelete,
  } = useCrud<Shift>({
    queryKey: [`/api/shifts?tenantId=${tenantId}`],
    endpoint: `/api/shifts?tenantId=${tenantId}`,
  });

  // Shift form with default values
  const shiftForm = useForm<ShiftFormData>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      date: "",
      startTime: "",
      endTime: "",
      role: "",
      description: "",
      location: "",
      assignedTo: "",
      notes: "",
    }
  });

  // Reset form when editing changes
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
        date: "",
        startTime: "",
        endTime: "",
        role: "",
        description: "",
        location: "",
        assignedTo: "",
        notes: "",
      });
    }
  }, [editingShift, shiftForm]);

  // Additional data queries for shift form dropdowns
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: [`/api/schedule-templates?tenantId=${tenantId}`],
    enabled: !!tenantId
  });

  const { data: jobRoles = [] } = useQuery({
    queryKey: [`/api/job-roles?tenantId=${tenantId}`],
    enabled: !!tenantId
  });

  const { data: staff = [] } = useQuery({
    queryKey: [`/api/staff?tenantId=${tenantId}`],
    enabled: !!tenantId
  });

  const { data: locations = [] } = useQuery({
    queryKey: [`/api/locations?tenantId=${tenantId}`],
    enabled: !!tenantId
  });

  // Handle shift form submission
  const onShiftSubmit = async (formData: ShiftFormData) => {
    try {
      const shiftData = {
        ...formData,
        assignedTo: formData.assignedTo && formData.assignedTo !== "unassigned" ? parseInt(formData.assignedTo) : null,
        status: (formData.assignedTo && formData.assignedTo !== "unassigned" ? "assigned" : "open") as "assigned" | "open",
        tenantId,
        assignmentType: (formData.assignedTo && formData.assignedTo !== "unassigned" ? "assigned" : "opportunity") as "assigned" | "opportunity",
        requiredStaff: 1,
        claimedBy: null,
        templateId: null,
        createdBy: Number(user?.id) || 1,
        notes: formData.notes || null,
      };

      await handleShiftSubmit(shiftData);
    } catch (error) {
      console.error("Error submitting shift:", error);
    }
  };

  // Handle shift duplication
  const handleShiftDuplicate = (shift: Shift) => {
    // Open create modal with shift data pre-filled
    shiftForm.reset({
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      role: shift.role,
      description: shift.description,
      location: shift.location,
      assignedTo: shift.assignedTo?.toString() || "",
      notes: shift.notes || "",
    });
    openCreateShiftModal();
  };

  // Initialize template form with slots support
  const templateForm = useForm<EnhancedTemplateData>({
    resolver: zodResolver(enhancedTemplateSchema),
    defaultValues: {
      tenantId: tenantId,
      name: "",
      description: "",
      positions: [],
      assignmentType: "assigned",
      requiredStaffPerPosition: 1,
      recurrence: "weekly",
      isActive: true,
      createdBy: Number(user?.id) || 1,
      slots: [{ role: "", quantity: 1, staffIds: [] }]
    }
  });

  // Template management functions
  const openTemplateModal = () => {
    setEditingTemplate(null);
    templateForm.reset({
      tenantId: tenantId,
      name: "",
      description: "",
      positions: [],
      assignmentType: "assigned",
      requiredStaffPerPosition: 1,
      recurrence: "weekly",
      isActive: true,
      createdBy: Number(user?.id) || 1,
      slots: [{ role: "", quantity: 1, staffIds: [] }]
    });
    setTemplateModalOpen(true);
  };

  const closeTemplateModal = () => {
    setTemplateModalOpen(false);
    setEditingTemplate(null);
  };

  const openEditTemplateModal = (template: ScheduleTemplate) => {
    setEditingTemplate(template);
    templateForm.reset({
      tenantId: template.tenantId,
      name: template.name,
      description: template.description || "",
      positions: template.positions || [],
      assignmentType: template.assignmentType,
      requiredStaffPerPosition: template.requiredStaffPerPosition,
      recurrence: template.recurrence,
      isActive: template.isActive,
      createdBy: template.createdBy,
      slots: (template.slots || [{ role: "", quantity: 1, staffIds: [] }]) as Array<{ role?: string; quantity?: number; staffIds?: number[] }>
    });
    setTemplateModalOpen(true);
  };

  const openDeleteTemplateDialog = (template: ScheduleTemplate) => {
    setTemplateToDelete(template);
    setTemplateDeleteDialogOpen(true);
  };



  const confirmTemplateDelete = async () => {
    if (!templateToDelete) return;
    
    try {
      await fetch(`/api/schedule-templates/${templateToDelete.id}`, {
        method: "DELETE"
      });
      
      toast({
        title: "Template Deleted",
        description: "Template has been successfully deleted.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/schedule-templates", tenantId] });
      setTemplateDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const cancelTemplateDelete = () => {
    setTemplateDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };

  const handleTemplateSubmit = async (formData: EnhancedTemplateData) => {
    try {
      setTemplateSubmitting(true);
      
      // Clean up slots data
      const cleanedSlots = formData.slots?.filter(slot => slot.role && slot.quantity > 0) || [];
      
      const templateData = {
        ...formData,
        slots: cleanedSlots,
        // Keep positions for backward compatibility
        positions: cleanedSlots.map(slot => slot.role)
      };

      if (editingTemplate) {
        const response = await fetch(`/api/schedule-templates/${editingTemplate.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(templateData)
        });
        if (!response.ok) throw new Error("Failed to update template");
        toast({ title: "Template updated successfully" });
      } else {
        const response = await fetch("/api/schedule-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(templateData)
        });
        if (!response.ok) throw new Error("Failed to create template");
        toast({ title: "Template created successfully" });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/schedule-templates"] });
      closeTemplateModal();
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to save template",
        variant: "destructive" 
      });
    } finally {
      setTemplateSubmitting(false);
    }
  };

  // Use template to generate shifts
  const useTemplateMutation = useMutation({
    mutationFn: ({ templateId, startDate, endDate }: { templateId: number, startDate: string, endDate: string }) =>
      apiRequest(`/api/schedule-templates/${templateId}/use`, "POST", { startDate, endDate }),
    onSuccess: (result: any) => {
      toast({ 
        title: "Shifts Generated",
        description: `Created shifts from template successfully`
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to generate shifts from template",
        variant: "destructive"
      });
    }
  });

  const handleUseTemplate = (templateId: number) => {
    // For demo purposes, use current date and next 7 days
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    useTemplateMutation.mutate({ templateId, startDate, endDate });
  };

  const shiftColumns: Column<Shift>[] = [
    { 
      key: "date",
      header: "Date", 
      cell: (shift) => shift.date 
    },
    { 
      key: "role",
      header: "Role", 
      cell: (shift) => shift.role 
    },
    { 
      key: "time",
      header: "Time", 
      cell: (shift) => `${shift.startTime} - ${shift.endTime}` 
    },
    { 
      key: "location",
      header: "Location", 
      cell: (shift) => shift.location 
    },
    { 
      key: "status",
      header: "Status", 
      cell: (shift) => (
        <Badge variant={shift.status === "assigned" ? "default" : "secondary"}>
          {shift.status}
        </Badge>
      )
    },
    {
      key: "actions",
      header: "Actions",
      cell: (shift) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openEditShiftModal(shift)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleShiftDelete(shift)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const templateColumns: Column<ScheduleTemplate>[] = [
    { 
      key: "name",
      header: "Name", 
      cell: (template) => template.name 
    },
    { 
      key: "recurrence",
      header: "Recurrence", 
      cell: (template) => template.recurrence 
    },
    { 
      key: "roles",
      header: "Roles", 
      cell: (template) => {
        if (template.slots && Array.isArray(template.slots)) {
          return template.slots.map((slot: any) => slot.role).join(", ");
        }
        return template.positions?.join(", ") || "";
      }
    },
    { 
      key: "status",
      header: "Status", 
      cell: (template) => 
        template.isActive ? 
          <Badge variant="default">Active</Badge> : 
          <Badge variant="secondary">Inactive</Badge>
    },
    {
      key: "actions",
      header: "Actions",
      cell: (template) => (
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openEditTemplateModal(template)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={() => handleUseTemplate(template.id)}
            disabled={useTemplateMutation.isPending}
            className="h-8 px-2 text-xs"
          >
            <Settings className="h-3 w-3 mr-1" />
            {useTemplateMutation.isPending ? "Using..." : "Use"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openDeleteTemplateDialog(template)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Scheduling</h1>
          <div className="flex items-center space-x-2">
            <Button onClick={openCreateShiftModal} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create Shift</span>
            </Button>
            <Button onClick={openTemplateModal} variant="outline" className="flex items-center space-x-2">
              <Copy className="h-4 w-4" />
              <span>Create Template</span>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="shifts" className="w-full">
          <TabsList className="grid w-full grid-cols-3 gap-1">
            <TabsTrigger value="shifts" className="text-xs md:text-sm p-2 min-h-[44px]">
              <span className="truncate">Shifts</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs md:text-sm p-2 min-h-[44px]">
              <span className="truncate">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="text-xs md:text-sm p-2 min-h-[44px]">
              <span className="truncate">Templates</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shifts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Shifts</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable 
                  title="Shifts"
                  data={shifts} 
                  columns={shiftColumns}
                  isLoading={shiftsLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Calendar View</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Role Legend */}
                <CalendarLegend />
                
                {/* Calendar View */}
                <CalendarView 
                  shifts={shifts}
                  onCreateShift={(date: Date) => {
                    // Convert Date object to YYYY-MM-DD string format
                    const dateString = date.toISOString().split('T')[0];
                    openCreateShiftModal();
                    // Pre-fill the date in the form
                    shiftForm.setValue('date', dateString);
                  }}
                  onEditShift={openEditShiftModal}
                  onDuplicateShift={handleShiftDuplicate}
                  onDeleteShift={(shiftId: number) => {
                    const shift = shifts.find(s => s.id === shiftId);
                    if (shift) handleShiftDelete(shift);
                  }}

                  userRole={role || "staff"}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Schedule Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable 
                  data={templates} 
                  columns={templateColumns}
                  isLoading={templatesLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Shift CRUD Modal */}
      <Dialog open={shiftModalOpen} onOpenChange={closeShiftModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingShift ? "Edit Shift" : "Create Shift"}</DialogTitle>
          </DialogHeader>
          
          <Form {...shiftForm}>
            <form onSubmit={shiftForm.handleSubmit(onShiftSubmit)} className="space-y-4">
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
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.isArray(jobRoles) && jobRoles.map((role: any) => (
                          <SelectItem key={role.id} value={role.title}>
                            {role.title}
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
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.isArray(locations) && locations.map((location: any) => (
                          <SelectItem key={location.id} value={location.name}>
                            {location.name}
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
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Staff (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select staff member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {Array.isArray(staff) && staff.map((member: any) => (
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
                      <Input placeholder="Shift description" {...field} />
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
                      <Textarea 
                        placeholder="Additional notes"
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeShiftModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={shiftSubmitting}>
                  {shiftSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingShift ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingShift ? "Update Shift" : "Create Shift"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={shiftDeleteDialogOpen}
        onClose={() => cancelShiftDelete()}
        onConfirm={() => confirmShiftDelete()}
        title="Delete Shift"
        description="Are you sure you want to delete this shift? This action cannot be undone."
      />

      {/* Enhanced Template Form Modal */}
      <Dialog open={templateModalOpen} onOpenChange={setTemplateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
            <DialogDescription>
              Create reusable schedule templates with staff assignments and recurring patterns.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...templateForm}>
            <form onSubmit={templateForm.handleSubmit(handleTemplateSubmit)} className="space-y-6">
              {/* Section 1: Template Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Template Details</h3>
                
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
                          placeholder="Template description"
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
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
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
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
                            <SelectItem value="assigned">Pre-assigned</SelectItem>
                            <SelectItem value="opportunity">Open Opportunity</SelectItem>
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
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Template</FormLabel>
                        <FormDescription>
                          Enable this template for shift generation
                        </FormDescription>
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

              {/* Section 2: Position Slots */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Position Requirements</h3>
                
                {templateForm.watch("slots")?.map((slot, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Position {index + 1}</h4>
                      {templateForm.watch("slots")!.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentSlots = templateForm.getValues("slots") || [];
                            const newSlots = currentSlots.filter((_, i) => i !== index);
                            templateForm.setValue("slots", newSlots);
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={templateForm.control}
                        name={`slots.${index}.role`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.isArray(jobRoles) && jobRoles.map((role: any) => (
                                  <SelectItem key={role.id} value={role.title}>
                                    {role.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={templateForm.control}
                        name={`slots.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Required Staff</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {templateForm.watch("assignmentType") === "assigned" && (
                      <div>
                        <FormLabel>Pre-assign Staff (Optional)</FormLabel>
                        <div className="mt-2 space-y-2">
                          {Array.isArray(staff) && staff
                            .filter((member: any) => !member.role || slot.role === "" || member.role === slot.role)
                            .map((member: any) => (
                            <div key={member.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`staff-${index}-${member.id}`}
                                checked={slot.staffIds?.includes(member.id) || false}
                                onChange={(e) => {
                                  const currentSlots = templateForm.getValues("slots") || [];
                                  const updatedSlots = [...currentSlots];
                                  if (!updatedSlots[index].staffIds) {
                                    updatedSlots[index].staffIds = [];
                                  }
                                  
                                  if (e.target.checked) {
                                    updatedSlots[index].staffIds = [...updatedSlots[index].staffIds, member.id];
                                  } else {
                                    updatedSlots[index].staffIds = updatedSlots[index].staffIds.filter(id => id !== member.id);
                                  }
                                  
                                  templateForm.setValue("slots", updatedSlots);
                                }}
                                className="rounded border-gray-300"
                              />
                              <label htmlFor={`staff-${index}-${member.id}`} className="text-sm">
                                {member.firstName} {member.lastName}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const currentSlots = templateForm.getValues("slots") || [];
                    templateForm.setValue("slots", [...currentSlots, { role: "", quantity: 1, staffIds: [] }]);
                  }}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Position
                </Button>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeTemplateModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={templateSubmitting}>
                  {templateSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingTemplate ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingTemplate ? "Update Template" : "Create Template"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Template Delete Dialog */}
      <AlertDialog open={templateDeleteDialogOpen} onOpenChange={setTemplateDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the template "{templateToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelTemplateDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmTemplateDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


    </>
  );
}