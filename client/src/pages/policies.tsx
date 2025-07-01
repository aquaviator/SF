import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/DataTable";
import { ModalForm } from "@/components/ModalForm";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Bell, 
  FileText, 
  Settings, 
  Mail,
  Clock,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Shift Policy Schema
const shiftPolicySchema = z.object({
  name: z.string().min(1, "Policy name is required"),
  description: z.string().min(1, "Policy description is required"),
  category: z.string().min(1, "Category is required"),
  minNoticeHours: z.number().min(0, "Must be at least 0 hours"),
  maxAdvanceBookingDays: z.number().min(1, "Must be at least 1 day"),
  cancellationDeadlineHours: z.number().min(0, "Must be at least 0 hours"),
  strikePointsOnNoShow: z.number().min(0, "Must be at least 0 points"),
  strikePointsOnLateCancellation: z.number().min(0, "Must be at least 0 points"),
  maxStrikePoints: z.number().min(1, "Must be at least 1 point"),
  isActive: z.boolean().default(true),
});

// Notification Settings Schema
const notificationSettingsSchema = z.object({
  emailEnabled: z.boolean().default(true),
  smsEnabled: z.boolean().default(false),
  pushEnabled: z.boolean().default(true),
  shiftReminderHours: z.number().min(0, "Must be at least 0 hours"),
  newShiftNotification: z.boolean().default(true),
  shiftChangeNotification: z.boolean().default(true),
  swapRequestNotification: z.boolean().default(true),
  holidayRequestNotification: z.boolean().default(true),
  emailTemplate: z.string().min(1, "Email template is required"),
});

type ShiftPolicyFormData = z.infer<typeof shiftPolicySchema>;
type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>;

interface ShiftPolicy {
  id: number;
  name: string;
  description: string;
  category: string;
  minNoticeHours: number;
  maxAdvanceBookingDays: number;
  cancellationDeadlineHours: number;
  strikePointsOnNoShow: number;
  strikePointsOnLateCancellation: number;
  maxStrikePoints: number;
  isActive: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface NotificationSettings {
  id: number;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  shiftReminderHours: number;
  newShiftNotification: boolean;
  shiftChangeNotification: boolean;
  swapRequestNotification: boolean;
  holidayRequestNotification: boolean;
  emailTemplate: string;
  tenantId: string;
}

export default function Policies() {
  const { tenantId } = useAuth();
  const { toast } = useToast();
  const [isPolicyModalOpen, setIsPolicyModalOpen] = React.useState(false);
  const [editingPolicy, setEditingPolicy] = React.useState<ShiftPolicy | null>(null);

  // Shift Policy Form
  const policyForm = useForm<ShiftPolicyFormData>({
    resolver: zodResolver(shiftPolicySchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      minNoticeHours: 24,
      maxAdvanceBookingDays: 30,
      cancellationDeadlineHours: 4,
      strikePointsOnNoShow: 2,
      strikePointsOnLateCancellation: 1,
      maxStrikePoints: 5,
      isActive: true,
    },
  });

  // Notification Settings Form
  const notificationForm = useForm<NotificationSettingsFormData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      shiftReminderHours: 2,
      newShiftNotification: true,
      shiftChangeNotification: true,
      swapRequestNotification: true,
      holidayRequestNotification: true,
      emailTemplate: "Hello {{staff_name}},\n\nYou have a new shift assignment:\n\n{{shift_details}}\n\nThank you,\n{{business_name}}",
    },
  });

  // Fetch Shift Policies
  const { data: policies = [], isLoading: policiesLoading } = useQuery<ShiftPolicy[]>({
    queryKey: ["/api/shift-policies", tenantId],
    queryFn: async () => {
      // Mock data for now
      return [
        {
          id: 1,
          name: "Standard Notice Policy",
          description: "Minimum 24-hour notice required for shift changes",
          category: "Scheduling",
          minNoticeHours: 24,
          maxAdvanceBookingDays: 30,
          cancellationDeadlineHours: 4,
          strikePointsOnNoShow: 2,
          strikePointsOnLateCancellation: 1,
          maxStrikePoints: 5,
          isActive: true,
          tenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: "Emergency Response Policy",
          description: "Special rules for emergency shift coverage",
          category: "Emergency",
          minNoticeHours: 2,
          maxAdvanceBookingDays: 7,
          cancellationDeadlineHours: 1,
          strikePointsOnNoShow: 3,
          strikePointsOnLateCancellation: 2,
          maxStrikePoints: 3,
          isActive: true,
          tenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 3,
          name: "Weekend Coverage Policy",
          description: "Extended notice periods for weekend shifts",
          category: "Weekend",
          minNoticeHours: 48,
          maxAdvanceBookingDays: 60,
          cancellationDeadlineHours: 8,
          strikePointsOnNoShow: 2,
          strikePointsOnLateCancellation: 1,
          maxStrikePoints: 5,
          isActive: false,
          tenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
    },
  });

  // Fetch Notification Settings
  const { data: notificationSettings, isLoading: notificationLoading } = useQuery<NotificationSettings>({
    queryKey: ["/api/notification-settings", tenantId],
    queryFn: async () => {
      // Mock data for now
      return {
        id: 1,
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        shiftReminderHours: 2,
        newShiftNotification: true,
        shiftChangeNotification: true,
        swapRequestNotification: true,
        holidayRequestNotification: true,
        emailTemplate: "Hello {{staff_name}},\n\nYou have a new shift assignment:\n\n{{shift_details}}\n\nThank you,\n{{business_name}}",
        tenantId,
      };
    },
  });

  // Policy Mutations
  const policyCreateMutation = useMutation({
    mutationFn: async (data: ShiftPolicyFormData) => {
      return await apiRequest("POST", `/api/shift-policies`, { ...data, tenantId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shift-policies", tenantId] });
      setIsPolicyModalOpen(false);
      setEditingPolicy(null);
      policyForm.reset();
      toast({ title: "Shift policy created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create shift policy", description: error.message, variant: "destructive" });
    },
  });

  const policyUpdateMutation = useMutation({
    mutationFn: async (data: ShiftPolicy) => {
      return await apiRequest("PATCH", `/api/shift-policies/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shift-policies", tenantId] });
      setIsPolicyModalOpen(false);
      setEditingPolicy(null);
      policyForm.reset();
      toast({ title: "Shift policy updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update shift policy", description: error.message, variant: "destructive" });
    },
  });

  // Notification Settings Mutation
  const notificationMutation = useMutation({
    mutationFn: async (data: NotificationSettingsFormData) => {
      return await apiRequest("POST", `/api/notification-settings`, { ...data, tenantId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-settings", tenantId] });
      toast({ title: "Notification settings updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update notification settings", description: error.message, variant: "destructive" });
    },
  });

  // Initialize forms with data
  React.useEffect(() => {
    if (notificationSettings) {
      notificationForm.reset(notificationSettings);
    }
  }, [notificationSettings, notificationForm]);

  React.useEffect(() => {
    if (isPolicyModalOpen) {
      if (editingPolicy) {
        policyForm.reset({
          name: editingPolicy.name,
          description: editingPolicy.description,
          category: editingPolicy.category,
          minNoticeHours: editingPolicy.minNoticeHours,
          maxAdvanceBookingDays: editingPolicy.maxAdvanceBookingDays,
          cancellationDeadlineHours: editingPolicy.cancellationDeadlineHours,
          strikePointsOnNoShow: editingPolicy.strikePointsOnNoShow,
          strikePointsOnLateCancellation: editingPolicy.strikePointsOnLateCancellation,
          maxStrikePoints: editingPolicy.maxStrikePoints,
          isActive: editingPolicy.isActive,
        });
      } else {
        policyForm.reset({
          name: "",
          description: "",
          category: "",
          minNoticeHours: 24,
          maxAdvanceBookingDays: 30,
          cancellationDeadlineHours: 4,
          strikePointsOnNoShow: 2,
          strikePointsOnLateCancellation: 1,
          maxStrikePoints: 5,
          isActive: true,
        });
      }
    }
  }, [isPolicyModalOpen, editingPolicy, policyForm]);

  const onSubmitPolicy = (data: ShiftPolicyFormData) => {
    if (editingPolicy) {
      policyUpdateMutation.mutate({ 
        ...data, 
        id: editingPolicy.id, 
        tenantId,
        createdAt: editingPolicy.createdAt,
        updatedAt: new Date(),
      });
    } else {
      policyCreateMutation.mutate(data);
    }
  };

  const onSubmitNotifications = (data: NotificationSettingsFormData) => {
    notificationMutation.mutate(data);
  };

  const openCreatePolicy = () => {
    setEditingPolicy(null);
    setIsPolicyModalOpen(true);
  };

  const openEditPolicy = (policy: ShiftPolicy) => {
    setEditingPolicy(policy);
    setIsPolicyModalOpen(true);
  };

  const closePolicyModal = () => {
    setIsPolicyModalOpen(false);
    setEditingPolicy(null);
  };

  const handleDeletePolicy = async (policy: ShiftPolicy) => {
    try {
      await apiRequest("DELETE", `/api/shift-policies/${policy.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/shift-policies", tenantId] });
      toast({ title: "Shift policy deleted successfully" });
    } catch (error) {
      toast({ title: "Failed to delete shift policy", description: (error as Error).message, variant: "destructive" });
    }
  };

  const policyColumns: Column<ShiftPolicy>[] = [
    {
      key: "name",
      header: "Policy",
      cell: (policy) => (
        <div>
          <p className="font-medium text-sm">{policy.name}</p>
          <p className="text-xs text-gray-500">{policy.description}</p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (policy) => <Badge variant="outline">{policy.category}</Badge>,
    },
    {
      key: "rules",
      header: "Key Rules",
      cell: (policy) => (
        <div className="text-sm space-y-1">
          <p>Notice: {policy.minNoticeHours}h</p>
          <p>Cancellation: {policy.cancellationDeadlineHours}h</p>
          <p>Max strikes: {policy.maxStrikePoints}</p>
        </div>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      cell: (policy) => (
        <Badge variant={policy.isActive ? "default" : "secondary"}>
          {policy.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Policies</h2>
          <p className="text-gray-600">Manage shift policies and notification settings</p>
        </div>
      </div>

      <Tabs defaultValue="policies" className="space-y-6">
        <TabsList>
          <TabsTrigger value="policies" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Shift Policies
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-6">
          <DataTable
            data={policies}
            columns={policyColumns}
            title="Shift Policies"
            onAdd={openCreatePolicy}
            onEdit={openEditPolicy}
            onDelete={handleDeletePolicy}
            addLabel="Add Policy"
            isLoading={policiesLoading}
            emptyState={
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No policies defined</p>
                <p className="text-sm text-gray-400">Create policies to manage shift rules</p>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={notificationForm.handleSubmit(onSubmitNotifications)} className="space-y-6">
                {/* Notification Channels */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Channels</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-500">Send notifications via email</p>
                    </div>
                    <FormField
                      control={notificationForm.control}
                      name="emailEnabled"
                      render={({ field }) => (
                        <FormItem>
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

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-gray-500">Send notifications via SMS</p>
                    </div>
                    <FormField
                      control={notificationForm.control}
                      name="smsEnabled"
                      render={({ field }) => (
                        <FormItem>
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

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-gray-500">Send browser push notifications</p>
                    </div>
                    <FormField
                      control={notificationForm.control}
                      name="pushEnabled"
                      render={({ field }) => (
                        <FormItem>
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
                </div>

                {/* Notification Types */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Types</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">New Shifts</p>
                        <p className="text-sm text-gray-500">When new shifts are created</p>
                      </div>
                      <FormField
                        control={notificationForm.control}
                        name="newShiftNotification"
                        render={({ field }) => (
                          <FormItem>
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

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Shift Changes</p>
                        <p className="text-sm text-gray-500">When shifts are modified</p>
                      </div>
                      <FormField
                        control={notificationForm.control}
                        name="shiftChangeNotification"
                        render={({ field }) => (
                          <FormItem>
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

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Swap Requests</p>
                        <p className="text-sm text-gray-500">When swap requests are made</p>
                      </div>
                      <FormField
                        control={notificationForm.control}
                        name="swapRequestNotification"
                        render={({ field }) => (
                          <FormItem>
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

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Holiday Requests</p>
                        <p className="text-sm text-gray-500">When holiday requests are made</p>
                      </div>
                      <FormField
                        control={notificationForm.control}
                        name="holidayRequestNotification"
                        render={({ field }) => (
                          <FormItem>
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
                  </div>
                </div>

                {/* Timing Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Timing Settings</h3>
                  
                  <FormField
                    control={notificationForm.control}
                    name="shiftReminderHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shift Reminder (hours before)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="2"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Email Template */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Template</h3>
                  
                  <FormField
                    control={notificationForm.control}
                    name="emailTemplate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Template</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter email template..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-sm text-gray-500">
                          Available variables: {"{"}staff_name{"}"}, {"{"}shift_details{"}"}, {"{"}business_name{"}"}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={notificationMutation.isPending}>
                    {notificationMutation.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ModalForm
        isOpen={isPolicyModalOpen}
        onClose={closePolicyModal}
        title={editingPolicy ? "Edit Shift Policy" : "Add Shift Policy"}
        form={policyForm}
        onSubmit={onSubmitPolicy}
        submitLabel={editingPolicy ? "Update Policy" : "Create Policy"}
        isLoading={policyCreateMutation.isPending || policyUpdateMutation.isPending}
      >
        <div className="space-y-4">
          <FormField
            control={policyForm.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Policy Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter policy name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={policyForm.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter policy description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={policyForm.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="scheduling">Scheduling</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="weekend">Weekend</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="overtime">Overtime</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={policyForm.control}
              name="minNoticeHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min Notice (hours)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="24"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={policyForm.control}
              name="maxAdvanceBookingDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Advance Booking (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="30"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={policyForm.control}
              name="cancellationDeadlineHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cancellation Deadline (hours)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="4"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={policyForm.control}
              name="maxStrikePoints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Strike Points</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="5"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={policyForm.control}
              name="strikePointsOnNoShow"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Strike Points - No Show</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="2"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={policyForm.control}
              name="strikePointsOnLateCancellation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Strike Points - Late Cancellation</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={policyForm.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel>Active Policy</FormLabel>
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
    </div>
  );
}