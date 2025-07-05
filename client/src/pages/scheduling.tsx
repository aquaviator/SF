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
  Edit,
  MapPin,
  User
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

// Define enhanced template schema with slots that match shift creation patterns
const enhancedTemplateSchema = insertScheduleTemplateSchema.extend({
  slots: z.array(z.object({
    role: z.string(),
    quantity: z.number().min(1),
    assignmentType: z.enum(["open", "assigned"]).default("open"), // Individual assignment choice per slot
    staffIds: z.array(z.number()).default([])
  })).optional().default([])
});

type EnhancedTemplateData = z.infer<typeof enhancedTemplateSchema>;

export default function Scheduling() {
  const { user, tenantId, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Function to check if staff member is on holiday for a given date
  const checkStaffAvailability = async (staffId: number, date: string) => {
    try {
      const response = await fetch(`/api/holiday-requests?tenantId=${tenantId}`);
      const holidayRequests = await response.json();
      
      const staffHolidays = holidayRequests.filter((req: any) => 
        req.requesterId === staffId && 
        req.status === "approved" &&
        date >= req.startDate && 
        date <= req.endDate
      );
      
      return {
        isAvailable: staffHolidays.length === 0,
        reason: staffHolidays.length > 0 ? "On approved holiday" : null
      };
    } catch (error) {
      console.error("Error checking staff availability:", error);
      return { isAvailable: true, reason: null };
    }
  };

  // Template modal state
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ScheduleTemplate | null>(null);
  const [templateSubmitting, setTemplateSubmitting] = useState(false);
  const [templateDeleteDialogOpen, setTemplateDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<ScheduleTemplate | null>(null);

  // Create shifts from template modal state
  const [createShiftsModalOpen, setCreateShiftsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ScheduleTemplate | null>(null);
  const [templateDate, setTemplateDate] = useState<Date>(new Date());

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
      slots: [{ role: "", quantity: 1, assignmentType: "open", staffIds: [] }]
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
      slots: [{ role: "", quantity: 1, assignmentType: "open", staffIds: [] }]
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

  // Function to create shifts from template
  const createShiftsFromTemplate = async (template: any, date: Date) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      
      // Validate staff availability for pre-assigned slots
      const validationErrors = [];
      const shiftsToCreate = [];
      
      for (const slot of template.slots || []) {
        if (slot.assignmentType === "assigned" && slot.staffIds?.length > 0) {
          // Check each assigned staff member for holidays
          for (const staffId of slot.staffIds) {
            const availability = await checkStaffAvailability(staffId, dateStr);
            if (!availability.isAvailable) {
              const staffMember = (staff as any[]).find((s: any) => s.id === staffId);
              validationErrors.push(`${staffMember?.firstName} ${staffMember?.lastName} is ${availability.reason?.toLowerCase()} on ${dateStr}`);
            }
          }
          
          // Create assigned shift
          if (validationErrors.length === 0) {
            shiftsToCreate.push({
              date: dateStr,
              startTime: template.startTime,
              endTime: template.endTime,
              role: slot.role,
              location: template.location || "",
              status: "assigned",
              assignedTo: slot.staffIds[0], // Pre-assigned slots only have one staff member
              notes: `Created from template: ${template.name}`,
              tenantId: tenantId
            });
          }
        } else {
          // Create open opportunity for each required staff position
          for (let i = 0; i < slot.quantity; i++) {
            shiftsToCreate.push({
              date: dateStr,
              startTime: template.startTime,
              endTime: template.endTime,
              role: slot.role,
              location: template.location || "",
              status: "open",
              assignedTo: null,
              notes: `Created from template: ${template.name}`,
              tenantId: tenantId
            });
          }
        }
      }
      
      if (validationErrors.length > 0) {
        toast({
          title: "Staff Unavailable",
          description: validationErrors.join(", "),
          variant: "destructive"
        });
        return;
      }
      
      // Create all shifts
      const createPromises = shiftsToCreate.map(shiftData => 
        fetch("/api/shifts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(shiftData)
        })
      );
      
      const responses = await Promise.all(createPromises);
      const failedCreations = responses.filter(r => !r.ok);
      
      if (failedCreations.length > 0) {
        toast({
          title: "Partial Success",
          description: `Created ${responses.length - failedCreations.length} shifts, ${failedCreations.length} failed`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: `Created ${shiftsToCreate.length} shifts from template`
        });
      }
      
      queryClient.invalidateQueries({ queryKey: [`/api/shifts?tenantId=${tenantId}`] });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create shifts from template",
        variant: "destructive"
      });
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
            onClick={() => {
              setSelectedTemplate(template);
              setCreateShiftsModalOpen(true);
            }}
            className="h-8 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Create Shifts
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
              <CardContent>
                <DataTable 
                  data={templates as any[]} 
                  columns={templateColumns}
                  isLoading={templatesLoading}
                  title="Schedule Templates"
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

              {/* Section 2: Time Settings */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={templateForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          {...field}
                          value={field.value || "08:00"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={templateForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          {...field}
                          value={field.value || "17:00"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section 3: Position Requirements */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Position Requirements</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentSlots = templateForm.getValues("slots") || [];
                      templateForm.setValue("slots", [
                        ...currentSlots,
                        {
                          role: "",
                          quantity: 1,
                          assignmentType: "open" as const,
                          staffIds: []
                        }
                      ]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Position
                  </Button>
                </div>
                
                {/* Simple position builder */}
                {templateForm.watch("slots")?.length > 0 ? (
                  <div className="space-y-3">
                    {templateForm.watch("slots")?.map((slot, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="grid grid-cols-4 gap-4">
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
                                <FormLabel>Count</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="1" 
                                    value={field.value}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={templateForm.control}
                            name={`slots.${index}.assignmentType`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="assigned">Pre-assigned</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex items-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const currentSlots = templateForm.getValues("slots") || [];
                                const slotToDuplicate = currentSlots[index];
                                templateForm.setValue("slots", [
                                  ...currentSlots.slice(0, index + 1),
                                  { ...slotToDuplicate },
                                  ...currentSlots.slice(index + 1)
                                ]);
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
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
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {slot.assignmentType === "assigned" && (
                          <div className="mt-4 pt-4 border-t">
                            <FormLabel>Assign to Staff (Optional)</FormLabel>
                            <div className="mt-2">
                              <Select
                                value={slot.staffIds?.[0]?.toString() || "none"}
                                onValueChange={(value) => {
                                  const currentSlots = templateForm.getValues("slots") || [];
                                  const updatedSlots = [...currentSlots];
                                  updatedSlots[index].staffIds = (value && value !== "none") ? [parseInt(value)] : [];
                                  templateForm.setValue("slots", updatedSlots);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose staff member" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {Array.isArray(staff) && staff
                                    .filter((member: any) => !slot.role || slot.role === "" || member.role === slot.role)
                                    .map((member: any) => (
                                    <SelectItem key={member.id} value={member.id.toString()}>
                                      {member.firstName} {member.lastName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-40" />
                    <h4 className="text-lg font-medium mb-2">No positions added yet</h4>
                    <p className="text-sm mb-4">Add your first position to get started with this template</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        templateForm.setValue("slots", [
                          { role: "", quantity: 1, assignmentType: "open", staffIds: [] }
                        ]);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Position
                    </Button>
                  </div>
                )}
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

      {/* Create Shifts from Template Modal */}
      <Dialog open={createShiftsModalOpen} onOpenChange={setCreateShiftsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Shifts from Template</DialogTitle>
            <DialogDescription>
              Select a date to create shifts from the template "{selectedTemplate?.name}".
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={templateDate.toISOString().split('T')[0]}
                onChange={(e) => setTemplateDate(new Date(e.target.value))}
                className="mt-1"
              />
            </div>
            
            {selectedTemplate && (
              <div className="rounded-lg border p-3 bg-muted/50">
                <h4 className="font-medium mb-2">Template Preview</h4>
                <div className="text-sm space-y-1">
                  <div>Name: {selectedTemplate.name}</div>
                  <div>Time: {selectedTemplate.startTime} - {selectedTemplate.endTime}</div>
                  <div>Positions: {Array.isArray(selectedTemplate.slots) ? selectedTemplate.slots.length : 0}</div>
                  {Array.isArray(selectedTemplate.slots) && selectedTemplate.slots.length > 0 && (
                    <div className="mt-2">
                      {(selectedTemplate.slots as any[]).map((slot: any, index: number) => (
                        <div key={index} className="text-xs text-muted-foreground">
                          • {slot.role} ({slot.quantity} {slot.assignmentType === 'assigned' ? 'pre-assigned' : 'open'})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateShiftsModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createShiftsFromTemplate(selectedTemplate, templateDate)}
              disabled={!selectedTemplate}
            >
              Create Shifts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
