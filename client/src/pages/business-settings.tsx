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
  Building2, 
  Users, 
  Clock, 
  Shield
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PlaceholderIndicator } from "@/components/ui/placeholder-indicator";
import { NotImplementedModal } from "@/components/ui/not-implemented-modal";

// Business Profile Schema
const businessProfileSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  address: z.string().min(1, "Business address is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Valid email is required"),
  website: z.string().url("Valid website URL is required").optional().or(z.literal("")),
  logoUrl: z.string().optional(),
});

// Job Role Schema
const jobRoleSchema = z.object({
  title: z.string().min(1, "Role title is required"),
  description: z.string().min(1, "Role description is required"),
  department: z.string().min(1, "Department is required"),
  permissions: z.array(z.string()).min(1, "At least one permission is required"),
  isActive: z.boolean().default(true),
});

// Location Schema
const locationSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  description: z.string().min(1, "Location description is required"),
  type: z.enum(["kitchen", "dining", "bar", "office", "storage", "other"]),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  isActive: z.boolean().default(true),
});

// Operating Hours Schema
const operatingHoursSchema = z.object({
  monday: z.object({
    isOpen: z.boolean(),
    openTime: z.string(),
    closeTime: z.string(),
  }),
  tuesday: z.object({
    isOpen: z.boolean(),
    openTime: z.string(),
    closeTime: z.string(),
  }),
  wednesday: z.object({
    isOpen: z.boolean(),
    openTime: z.string(),
    closeTime: z.string(),
  }),
  thursday: z.object({
    isOpen: z.boolean(),
    openTime: z.string(),
    closeTime: z.string(),
  }),
  friday: z.object({
    isOpen: z.boolean(),
    openTime: z.string(),
    closeTime: z.string(),
  }),
  saturday: z.object({
    isOpen: z.boolean(),
    openTime: z.string(),
    closeTime: z.string(),
  }),
  sunday: z.object({
    isOpen: z.boolean(),
    openTime: z.string(),
    closeTime: z.string(),
  }),
});

type BusinessProfileFormData = z.infer<typeof businessProfileSchema>;
type JobRoleFormData = z.infer<typeof jobRoleSchema>;
type LocationFormData = z.infer<typeof locationSchema>;
type OperatingHoursFormData = z.infer<typeof operatingHoursSchema>;

interface BusinessProfile {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logoUrl?: string;
  tenantId: string;
}

interface JobRole {
  id: number;
  title: string;
  description: string;
  department: string;
  permissions: string[];
  isActive: boolean;
  tenantId: string;
}

interface Location {
  id: number;
  name: string;
  description: string;
  type: "kitchen" | "dining" | "bar" | "office" | "storage" | "other";
  capacity: number;
  isActive: boolean;
  tenantId: string;
}

interface OperatingHours {
  id: number;
  tenantId: string;
  [key: string]: any;
}

export default function BusinessSettings() {
  const { tenantId } = useAuth();
  const { toast } = useToast();
  const [isRoleModalOpen, setIsRoleModalOpen] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState<JobRole | null>(null);
  const [notImplementedModal, setNotImplementedModal] = React.useState<{
    isOpen: boolean;
    feature: string;
    description?: string;
  }>({ isOpen: false, feature: "", description: "" });

  // Business Profile Form
  const profileForm = useForm<BusinessProfileFormData>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      logoUrl: "",
    },
  });

  // Job Role Form
  const roleForm = useForm<JobRoleFormData>({
    resolver: zodResolver(jobRoleSchema),
    defaultValues: {
      title: "",
      description: "",
      department: "",
      permissions: [],
      isActive: true,
    },
  });

  // Operating Hours Form
  const hoursForm = useForm<OperatingHoursFormData>({
    resolver: zodResolver(operatingHoursSchema),
    defaultValues: {
      monday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
      tuesday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
      wednesday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
      thursday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
      friday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
      saturday: { isOpen: false, openTime: "09:00", closeTime: "17:00" },
      sunday: { isOpen: false, openTime: "09:00", closeTime: "17:00" },
    },
  });

  // Fetch Business Profile
  const { data: businessProfile, isLoading: _profileLoading } = useQuery<BusinessProfile>({
    queryKey: ["/api/business-profile", tenantId],
    enabled: !!tenantId,
  });

  // Fetch Job Roles
  const { data: jobRoles = [], isLoading: rolesLoading } = useQuery<JobRole[]>({
    queryKey: ["/api/job-roles", tenantId],
    queryFn: async () => {
      // Mock data for now
      return [
        {
          id: 1,
          title: "Customer Service Representative",
          description: "Handle customer inquiries and support requests",
          department: "Customer Service",
          permissions: ["view_shifts", "request_swaps", "view_schedule"],
          isActive: true,
          tenantId,
        },
        {
          id: 2,
          title: "Security Officer",
          description: "Maintain building security and safety protocols",
          department: "Security",
          permissions: ["view_shifts", "emergency_response"],
          isActive: true,
          tenantId,
        },
        {
          id: 3,
          title: "Maintenance Technician",
          description: "Perform equipment maintenance and repairs",
          department: "Maintenance",
          permissions: ["view_shifts", "equipment_access"],
          isActive: false,
          tenantId,
        },
      ];
    },
  });

  // Fetch Operating Hours
  const { data: _operatingHours, isLoading: _hoursLoading } = useQuery<OperatingHours>({
    queryKey: ["/api/operating-hours", tenantId],
  });

  // Business Profile Mutation
  const profileMutation = useMutation({
    mutationFn: async (data: BusinessProfileFormData) => {
      return await apiRequest("POST", `/api/business-profile`, { ...data, tenantId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-profile", tenantId] });
      toast({ title: "Business profile updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update business profile", description: error.message, variant: "destructive" });
    },
  });

  // Job Role Mutations
  const roleCreateMutation = useMutation({
    mutationFn: async (data: JobRoleFormData) => {
      return await apiRequest("POST", `/api/job-roles`, { ...data, tenantId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-roles", tenantId] });
      setIsRoleModalOpen(false);
      setEditingRole(null);
      roleForm.reset();
      toast({ title: "Job role created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create job role", description: error.message, variant: "destructive" });
    },
  });

  const roleUpdateMutation = useMutation({
    mutationFn: async (data: JobRole) => {
      return await apiRequest("PATCH", `/api/job-roles/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-roles", tenantId] });
      setIsRoleModalOpen(false);
      setEditingRole(null);
      roleForm.reset();
      toast({ title: "Job role updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update job role", description: error.message, variant: "destructive" });
    },
  });

  // Operating Hours Mutation
  const hoursMutation = useMutation({
    mutationFn: async (data: OperatingHoursFormData) => {
      return await apiRequest("POST", `/api/operating-hours`, { ...data, tenantId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operating-hours", tenantId] });
      toast({ title: "Operating hours updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update operating hours", description: error.message, variant: "destructive" });
    },
  });

  // Initialize forms with data
  React.useEffect(() => {
    if (businessProfile) {
      profileForm.reset({
        name: businessProfile.name,
        address: businessProfile.address,
        phone: businessProfile.phone,
        email: businessProfile.email,
        website: businessProfile.website || "",
        logoUrl: businessProfile.logoUrl || "",
      });
    }
  }, [businessProfile, profileForm]);

  // Helper function to show not implemented modal
  const showNotImplemented = (feature: string, description?: string) => {
    setNotImplementedModal({ isOpen: true, feature, description });
  };

  React.useEffect(() => {
    if (isRoleModalOpen) {
      if (editingRole) {
        roleForm.reset({
          title: editingRole.title,
          description: editingRole.description,
          department: editingRole.department,
          permissions: editingRole.permissions,
          isActive: editingRole.isActive,
        });
      } else {
        roleForm.reset({
          title: "",
          description: "",
          department: "",
          permissions: [],
          isActive: true,
        });
      }
    }
  }, [isRoleModalOpen, editingRole, roleForm]);

  const onSubmitProfile = (data: BusinessProfileFormData) => {
    profileMutation.mutate(data);
  };

  const onSubmitRole = (data: JobRoleFormData) => {
    if (editingRole) {
      roleUpdateMutation.mutate({ ...data, id: editingRole.id, tenantId });
    } else {
      roleCreateMutation.mutate(data);
    }
  };

  const onSubmitHours = (data: OperatingHoursFormData) => {
    hoursMutation.mutate(data);
  };

  const openCreateRole = () => {
    setEditingRole(null);
    setIsRoleModalOpen(true);
  };

  const openEditRole = (role: JobRole) => {
    setEditingRole(role);
    setIsRoleModalOpen(true);
  };

  const closeRoleModal = () => {
    setIsRoleModalOpen(false);
    setEditingRole(null);
  };

  const handleDeleteRole = async (role: JobRole) => {
    try {
      await apiRequest("DELETE", `/api/job-roles/${role.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/job-roles", tenantId] });
      toast({ title: "Job role deleted successfully" });
    } catch (error) {
      toast({ title: "Failed to delete job role", description: (error as Error).message, variant: "destructive" });
    }
  };

  const roleColumns: Column<JobRole>[] = [
    {
      key: "title",
      header: "Role",
      cell: (role) => (
        <div>
          <p className="font-medium text-sm">{role.title}</p>
          <p className="text-xs text-gray-500">{role.description}</p>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      cell: (role) => <Badge variant="outline">{role.department}</Badge>,
    },
    {
      key: "permissions",
      header: "Permissions",
      cell: (role) => (
        <div className="flex flex-wrap gap-1">
          {(role.permissions || []).slice(0, 2).map((perm) => (
            <Badge key={perm} variant="secondary" className="text-xs">
              {perm.replace('_', ' ')}
            </Badge>
          ))}
          {(role.permissions || []).length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{(role.permissions || []).length - 2} more
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      cell: (role) => (
        <Badge variant={role.isActive ? "default" : "secondary"}>
          {role.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Settings</h2>
          <p className="text-gray-600">Manage your business profile, roles, and operating hours</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Business Profile
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Job Roles
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Operating Hours
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <PlaceholderIndicator type="test" description="Business profile loads demo data from API">
            <Card>
              <CardHeader>
                <CardTitle>Business Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter business name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter business address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={profileForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter website URL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit" disabled={profileMutation.isPending}>
                    {profileMutation.isPending ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          </PlaceholderIndicator>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <PlaceholderIndicator type="test" description="Job roles section shows demo data for testing">
            <DataTable
            data={jobRoles}
            columns={roleColumns}
            title="Job Roles"
            onAdd={openCreateRole}
            onEdit={openEditRole}
            onDelete={handleDeleteRole}
            addLabel="Add Role"
            isLoading={rolesLoading}
            emptyState={
              <div className="text-center py-8">
                <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No job roles defined</p>
                <p className="text-sm text-gray-400">Create roles to assign to your staff</p>
              </div>
            }
          />
          </PlaceholderIndicator>
        </TabsContent>

        <TabsContent value="hours" className="space-y-6">
          <PlaceholderIndicator type="test" description="Operating hours form has demo functionality">
            <Card>
              <CardHeader>
                <CardTitle>Operating Hours</CardTitle>
              </CardHeader>
              <CardContent>
              <form onSubmit={hoursForm.handleSubmit(onSubmitHours)} className="space-y-4">
                {dayNames.map((day, index) => (
                  <div key={day} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-24">
                      <label className="text-sm font-medium">{dayLabels[index]}</label>
                    </div>
                    
                    <FormField
                      control={hoursForm.control}
                      name={`${day}.isOpen` as any}
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm">Open</FormLabel>
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center gap-2">
                      <FormField
                        control={hoursForm.control}
                        name={`${day}.openTime` as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="time"
                                {...field}
                                disabled={!hoursForm.watch(`${day}.isOpen` as any)}
                                className="w-32"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <span className="text-sm text-gray-500">to</span>
                      <FormField
                        control={hoursForm.control}
                        name={`${day}.closeTime` as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="time"
                                {...field}
                                disabled={!hoursForm.watch(`${day}.isOpen` as any)}
                                className="w-32"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}

                <div className="flex justify-end">
                  <Button type="submit" disabled={hoursMutation.isPending}>
                    {hoursMutation.isPending ? "Saving..." : "Save Operating Hours"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          </PlaceholderIndicator>
        </TabsContent>
      </Tabs>

      <ModalForm
        isOpen={isRoleModalOpen}
        onClose={closeRoleModal}
        title={editingRole ? "Edit Job Role" : "Add Job Role"}
        form={roleForm}
        onSubmit={onSubmitRole}
        submitLabel={editingRole ? "Update Role" : "Create Role"}
        isLoading={roleCreateMutation.isPending || roleUpdateMutation.isPending}
      >
        <div className="space-y-4">
          <FormField
            control={roleForm.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter role title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={roleForm.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter role description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={roleForm.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="customer-service">Customer Service</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="administration">Administration</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={roleForm.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel>Active Role</FormLabel>
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

      <NotImplementedModal
        isOpen={notImplementedModal.isOpen}
        onClose={() => setNotImplementedModal({ isOpen: false, feature: '', description: '' })}
        feature={notImplementedModal.feature}
        description={notImplementedModal.description}
      />
    </div>
  );
}