import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/DataTable";
import { CalendarView } from "@/components/CalendarView";
import { CalendarDayModal } from "@/components/CalendarDayModal";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Trash2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Shift, ScheduleTemplate, InsertScheduleTemplate } from "@shared/schema";
import { insertScheduleTemplateSchema } from "@shared/schema";
import { z } from "zod";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

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
  const { user, tenantId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Template modal state
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ScheduleTemplate | null>(null);
  const [templateSubmitting, setTemplateSubmitting] = useState(false);

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

  // Data queries
  const { data: shifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ["/api/shifts", tenantId],
    queryFn: () => apiRequest(`/api/shifts?tenantId=${tenantId}`)
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/schedule-templates", tenantId],
    queryFn: () => apiRequest(`/api/schedule-templates?tenantId=${tenantId}`)
  });

  const { data: jobRoles = [] } = useQuery({
    queryKey: ["/api/job-roles", tenantId],
    queryFn: () => apiRequest(`/api/job-roles?tenantId=${tenantId}`)
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["/api/staff", tenantId],
    queryFn: () => apiRequest(`/api/staff?tenantId=${tenantId}`)
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations", tenantId],
    queryFn: () => apiRequest(`/api/locations?tenantId=${tenantId}`)
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
      apiRequest(`/api/schedule-templates/${templateId}/use`, {
        method: "POST",
        body: JSON.stringify({ startDate, endDate })
      }),
    onSuccess: (result) => {
      toast({ 
        title: "Shifts Generated",
        description: `Created ${result.assignedCreated} assigned shifts and ${result.opportunitiesCreated} open opportunities`
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
    { header: "Date", accessorKey: "date" },
    { header: "Role", accessorKey: "role" },
    { header: "Time", accessorKey: "startTime" },
    { header: "Location", accessorKey: "location" },
    { header: "Status", accessorKey: "status" },
  ];

  const templateColumns: Column<ScheduleTemplate>[] = [
    { header: "Name", accessorKey: "name" },
    { header: "Recurrence", accessorKey: "recurrence" },
    { 
      header: "Roles", 
      cell: ({ row }: { row: { original: ScheduleTemplate } }) => {
        const template = row.original;
        if (template.slots && Array.isArray(template.slots)) {
          return template.slots.map((slot: any) => slot.role).join(", ");
        }
        return template.positions?.join(", ") || "";
      }
    },
    { 
      header: "Status", 
      cell: ({ row }: { row: { original: ScheduleTemplate } }) => 
        row.original.isActive ? 
          <Badge variant="default">Active</Badge> : 
          <Badge variant="secondary">Inactive</Badge>
    },
    {
      header: "Actions",
      cell: ({ row }: { row: { original: ScheduleTemplate } }) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            onClick={() => handleUseTemplate(row.original.id)}
            disabled={useTemplateMutation.isPending}
          >
            {useTemplateMutation.isPending ? "Using..." : "Use"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingTemplate(row.original);
              setTemplateModalOpen(true);
            }}
          >
            <Settings className="h-4 w-4" />
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
            <Button onClick={openTemplateModal} variant="outline" className="flex items-center space-x-2">
              <Copy className="h-4 w-4" />
              <span>Create Template</span>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="shifts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="shifts">Shifts</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="shifts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Shifts</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable 
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
              <CardContent>
                <CalendarView 
                  shifts={shifts} 
                  onDateClick={(date) => console.log("Date clicked:", date)}
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

      {/* Enhanced Template Form Modal */}
      <Dialog open={templateModalOpen} onOpenChange={setTemplateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
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
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active Template</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Enable this template for shift generation
                        </div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Section 2: Pattern Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pattern Settings</h3>
                
                <FormField
                  control={templateForm.control}
                  name="recurrence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurrence Pattern</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select recurrence pattern" />
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

              {/* Section 3: Position Slots Configuration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Position Slots Configuration</h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const currentSlots = templateForm.getValues('slots') || [];
                      templateForm.setValue('slots', [
                        ...currentSlots,
                        { role: '', quantity: 1, staffIds: [] }
                      ]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Position
                  </Button>
                </div>

                {/* Dynamic Slots Table */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role</TableHead>
                        <TableHead>Total Slots</TableHead>
                        <TableHead>Pre-assigned Staff</TableHead>
                        <TableHead>Open Slots</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(templateForm.watch('slots') || []).map((slot: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Select 
                              value={slot.role || ''} 
                              onValueChange={(value) => {
                                const currentSlots = templateForm.getValues('slots') || [];
                                currentSlots[index] = { ...currentSlots[index], role: value };
                                templateForm.setValue('slots', currentSlots);
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                {jobRoles.map((role: any) => (
                                  <SelectItem key={role.id} value={role.title}>
                                    {role.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={slot.quantity || 1}
                              onChange={(e) => {
                                const currentSlots = templateForm.getValues('slots') || [];
                                const newQuantity = parseInt(e.target.value) || 1;
                                currentSlots[index] = { 
                                  ...currentSlots[index], 
                                  quantity: newQuantity,
                                  // Ensure staffIds don't exceed quantity
                                  staffIds: (currentSlots[index].staffIds || []).slice(0, newQuantity)
                                };
                                templateForm.setValue('slots', currentSlots);
                              }}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              {Array.from({ length: slot.quantity || 1 }, (_, staffIndex) => {
                                const currentStaffId = (slot.staffIds || [])[staffIndex];
                                return (
                                  <Select
                                    key={staffIndex}
                                    value={currentStaffId ? currentStaffId.toString() : ''}
                                    onValueChange={(value) => {
                                      const currentSlots = templateForm.getValues('slots') || [];
                                      const staffIds = [...(currentSlots[index].staffIds || [])];
                                      if (value) {
                                        staffIds[staffIndex] = parseInt(value);
                                      } else {
                                        staffIds.splice(staffIndex, 1);
                                      }
                                      currentSlots[index] = { ...currentSlots[index], staffIds };
                                      templateForm.setValue('slots', currentSlots);
                                    }}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder={`Slot ${staffIndex + 1} (Optional)`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="">Leave Open</SelectItem>
                                      {staff.map((member: any) => (
                                        <SelectItem key={member.id} value={member.id.toString()}>
                                          {member.firstName} {member.lastName}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                );
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center font-medium">
                              {(slot.quantity || 1) - ((slot.staffIds || []).filter(Boolean).length)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const currentSlots = templateForm.getValues('slots') || [];
                                  const duplicatedSlot = { ...currentSlots[index], staffIds: [] };
                                  templateForm.setValue('slots', [...currentSlots, duplicatedSlot]);
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const currentSlots = templateForm.getValues('slots') || [];
                                  currentSlots.splice(index, 1);
                                  templateForm.setValue('slots', currentSlots);
                                }}
                                disabled={(templateForm.watch('slots') || []).length <= 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={closeTemplateModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={templateSubmitting}>
                  {templateSubmitting ? "Saving..." : editingTemplate ? "Update Template" : "Create Template"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}