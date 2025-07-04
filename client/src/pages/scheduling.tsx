import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Clock, Users, MoreHorizontal, Calendar as CalendarIcon, Plus, Eye, Edit2, Trash2, Copy, Loader2 } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { 
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";

// Define shift form schema
const shiftFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  role: z.string().min(1, "Role is required"),
  location: z.string().min(1, "Location is required"),
  assignedTo: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  notes: z.string().optional(),
});

// Simple template form schema - same fields as shift creation
const templateFormSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  role: z.string().min(1, "Role is required"),
  location: z.string().min(1, "Location is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  assignedTo: z.string().optional(),
  defaultDescription: z.string().min(1, "Default description is required"),
  defaultNotes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ShiftFormData = z.infer<typeof shiftFormSchema>;
type TemplateFormData = z.infer<typeof templateFormSchema>;

const Scheduling = () => {
  const { user, tenantId } = useAuth();
  const queryClient = useQueryClient();

  // Calendar state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDateForModal, setSelectedDateForModal] = useState<Date | null>(null);

  // Modal states
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [deleteTemplateDialogOpen, setDeleteTemplateDialogOpen] = useState(false);

  // Editing states
  const [editingShift, setEditingShift] = useState<any>(null);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateToDelete, setTemplateToDelete] = useState<any>(null);

  // Loading states
  const [shiftSubmitting, setShiftSubmitting] = useState(false);
  const [templateSubmitting, setTemplateSubmitting] = useState(false);

  // Form initialization
  const shiftForm = useForm<ShiftFormData>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      date: "",
      startTime: "",
      endTime: "",
      role: "",
      location: "",
      assignedTo: "unassigned",
      description: "",
      notes: ""
    }
  });

  const templateForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      description: "",
      role: "",
      location: "",
      startTime: "",
      endTime: "",
      assignedTo: "unassigned",
      defaultDescription: "",
      defaultNotes: "",
      isActive: true
    }
  });

  // Reset form when editing changes
  useEffect(() => {
    if (editingShift) {
      shiftForm.reset({
        date: editingShift.date || "",
        startTime: editingShift.startTime || "",
        endTime: editingShift.endTime || "",
        role: editingShift.role || "",
        location: editingShift.location || "",
        assignedTo: editingShift.assignedTo?.toString() || "unassigned",
        description: editingShift.description || "",
        notes: editingShift.notes || ""
      });
    } else {
      shiftForm.reset();
    }
  }, [editingShift, shiftForm]);

  useEffect(() => {
    if (editingTemplate) {
      templateForm.reset({
        name: editingTemplate.name || "",
        description: editingTemplate.description || "",
        role: editingTemplate.role || "",
        location: editingTemplate.location || "",
        startTime: editingTemplate.startTime || "",
        endTime: editingTemplate.endTime || "",
        assignedTo: editingTemplate.assignedTo?.toString() || "unassigned",
        defaultDescription: editingTemplate.defaultDescription || "",
        defaultNotes: editingTemplate.defaultNotes || "",
        isActive: editingTemplate.isActive ?? true
      });
    } else {
      templateForm.reset();
    }
  }, [editingTemplate, templateForm]);

  // Data queries
  const { data: shifts = [], isLoading: shiftsLoading, refetch: refetchShifts } = useQuery({
    queryKey: [`/api/shifts?tenantId=${tenantId}`],
    enabled: !!tenantId
  });

  const { data: templates = [], isLoading: templatesLoading, refetch: refetchTemplates } = useQuery({
    queryKey: [`/api/schedule-templates?tenantId=${tenantId}`],
    enabled: !!tenantId
  });

  // Additional data queries for form dropdowns
  const { data: jobRoles = [] } = useQuery({
    queryKey: [`/api/job-roles?tenantId=${tenantId}`],
    enabled: !!tenantId
  });

  const { data: locations = [] } = useQuery({
    queryKey: [`/api/locations?tenantId=${tenantId}`],
    enabled: !!tenantId
  });

  const { data: staff = [] } = useQuery({
    queryKey: [`/api/users?tenantId=${tenantId}&role=staff`],
    enabled: !!tenantId
  });

  // Handle shift form submission
  const onShiftSubmit = async (formData: ShiftFormData) => {
    setShiftSubmitting(true);
    try {
      const shiftData = {
        ...formData,
        assignedTo: formData.assignedTo && formData.assignedTo !== "unassigned" ? parseInt(formData.assignedTo) : null,
        status: (formData.assignedTo && formData.assignedTo !== "unassigned" ? "assigned" : "open") as "assigned" | "open",
        tenantId,
        assignmentType: (formData.assignedTo && formData.assignedTo !== "unassigned" ? "assigned" : "opportunity") as "assigned" | "opportunity",
        startTime: formData.startTime,
        endTime: formData.endTime,
        createdBy: user?.id,
        notes: formData.notes || null,
      };

      if (editingShift) {
        await apiRequest(`/api/shifts/${editingShift.id}`, {
          method: "PUT",
          body: JSON.stringify(shiftData)
        });
        toast({ title: "Shift updated successfully" });
      } else {
        await apiRequest("/api/shifts", {
          method: "POST",
          body: JSON.stringify(shiftData)
        });
        toast({ title: "Shift created successfully" });
      }

      refetchShifts();
      closeShiftModal();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setShiftSubmitting(false);
    }
  };

  // Handle template form submission
  const onTemplateSubmit = async (formData: TemplateFormData) => {
    setTemplateSubmitting(true);
    try {
      const templateData = {
        ...formData,
        assignedTo: formData.assignedTo && formData.assignedTo !== "unassigned" ? parseInt(formData.assignedTo) : null,
        tenantId,
        createdBy: user?.id,
      };

      if (editingTemplate) {
        await apiRequest(`/api/schedule-templates/${editingTemplate.id}`, {
          method: "PUT",
          body: JSON.stringify(templateData)
        });
        toast({ title: "Template updated successfully" });
      } else {
        await apiRequest("/api/schedule-templates", {
          method: "POST",
          body: JSON.stringify(templateData)
        });
        toast({ title: "Template created successfully" });
      }

      refetchTemplates();
      closeTemplateModal();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setTemplateSubmitting(false);
    }
  };

  // Modal handlers
  const closeShiftModal = () => {
    setShiftModalOpen(false);
    setEditingShift(null);
    shiftForm.reset();
  };

  const closeTemplateModal = () => {
    setTemplateModalOpen(false);
    setEditingTemplate(null);
    templateForm.reset();
  };

  const openCreateShiftModal = (date?: Date) => {
    setEditingShift(null);
    if (date) {
      const dateStr = date.toISOString().split('T')[0];
      shiftForm.setValue("date", dateStr);
    }
    setShiftModalOpen(true);
  };

  const openEditShiftModal = (shift: any) => {
    setEditingShift(shift);
    setShiftModalOpen(true);
  };

  const openCreateTemplateModal = () => {
    setEditingTemplate(null);
    setTemplateModalOpen(true);
  };

  const openEditTemplateModal = (template: any) => {
    setEditingTemplate(template);
    setTemplateModalOpen(true);
  };

  const openDeleteTemplateDialog = (template: any) => {
    setTemplateToDelete(template);
    setDeleteTemplateDialogOpen(true);
  };

  const confirmTemplateDelete = async () => {
    if (!templateToDelete) return;
    
    try {
      await apiRequest(`/api/schedule-templates/${templateToDelete.id}`, {
        method: "DELETE"
      });
      toast({ title: "Template deleted successfully" });
      refetchTemplates();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeleteTemplateDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  // Apply template to create shift
  const applyTemplate = (template: any, date?: Date) => {
    const targetDate = date || selectedDate || new Date();
    shiftForm.reset({
      date: targetDate.toISOString().split('T')[0],
      startTime: template.startTime,
      endTime: template.endTime,
      role: template.role,
      location: template.location,
      assignedTo: template.assignedTo?.toString() || "unassigned",
      description: template.defaultDescription,
      notes: template.defaultNotes || ""
    });
    setShiftModalOpen(true);
  };

  // Table columns for shifts
  const shiftColumns = [
    {
      key: "date",
      accessorKey: "date",
      header: "Date",
      cell: (item: any) => new Date(item.date).toLocaleDateString()
    },
    {
      key: "role",
      accessorKey: "role",
      header: "Role"
    },
    {
      key: "location",
      accessorKey: "location", 
      header: "Location"
    },
    {
      key: "time",
      accessorKey: "startTime",
      header: "Time",
      cell: (item: any) => `${item.startTime} - ${item.endTime}`
    },
    {
      key: "status",
      accessorKey: "status",
      header: "Status",
      cell: (item: any) => (
        <Badge variant={item.status === "assigned" ? "default" : "secondary"}>
          {item.status}
        </Badge>
      )
    },
    {
      key: "actions",
      id: "actions",
      header: "Actions",
      cell: (item: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEditShiftModal(item)}>
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  // Table columns for templates
  const templateColumns = [
    {
      key: "name",
      accessorKey: "name",
      header: "Name"
    },
    {
      key: "role",
      accessorKey: "role",
      header: "Role"
    },
    {
      key: "location",
      accessorKey: "location",
      header: "Location"
    },
    {
      key: "time",
      accessorKey: "startTime",
      header: "Time",
      cell: (item: any) => `${item.startTime} - ${item.endTime}`
    },
    {
      key: "status",
      accessorKey: "isActive",
      header: "Status",
      cell: (item: any) => (
        <Badge variant={item.isActive ? "default" : "secondary"}>
          {item.isActive ? "Active" : "Inactive"}
        </Badge>
      )
    },
    {
      key: "actions",
      id: "actions",
      header: "Actions",
      cell: (item: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => applyTemplate(item)}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => openEditTemplateModal(item)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => openDeleteTemplateDialog(item)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Scheduling</h2>
        <Button onClick={() => openCreateShiftModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Create Shift
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md"
              showOutsideDays
            />
            {selectedDate && (
              <Button 
                className="w-full mt-4" 
                variant="outline"
                onClick={() => openCreateShiftModal(selectedDate)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Shift
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-3">
          <Tabs defaultValue="shifts" className="space-y-4">
            <TabsList>
              <TabsTrigger value="shifts">Shifts</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="shifts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Current Shifts</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable 
                    data={shifts as any[]} 
                    columns={shiftColumns}
                    isLoading={shiftsLoading}
                    title="Shifts"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Schedule Templates</CardTitle>
                  <Button onClick={openCreateTemplateModal}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Template
                  </Button>
                </CardHeader>
                <CardContent>
                  <DataTable 
                    data={templates as any[]} 
                    columns={templateColumns}
                    isLoading={templatesLoading}
                    title="Templates"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Shift CRUD Modal */}
      <Dialog open={shiftModalOpen} onOpenChange={closeShiftModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingShift ? "Edit Shift" : "Create Shift"}</DialogTitle>
            <DialogDescription>
              {editingShift ? "Update shift details" : "Create a new shift assignment"}
            </DialogDescription>
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

      {/* Template CRUD Modal - Same structure as shift modal */}
      <Dialog open={templateModalOpen} onOpenChange={closeTemplateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
            <DialogDescription>
              {editingTemplate ? "Update template details" : "Create a reusable shift template"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...templateForm}>
            <form onSubmit={templateForm.handleSubmit(onTemplateSubmit)} className="space-y-4">
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
                  control={templateForm.control}
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
                control={templateForm.control}
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
                control={templateForm.control}
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
                control={templateForm.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Assignment (Optional)</FormLabel>
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
                control={templateForm.control}
                name="defaultDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Default shift description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={templateForm.control}
                name="defaultNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Default additional notes"
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
      
      {/* Delete Template Confirmation */}
      <AlertDialog open={deleteTemplateDialogOpen} onOpenChange={setDeleteTemplateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmTemplateDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Scheduling;