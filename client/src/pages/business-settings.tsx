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
  MapPin
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Business Profile Schema
const businessProfileSchema = z.object({
  tenantId: z.string(),
  name: z.string().min(1, "Business name is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  address: z.string().min(1, "Business address is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Valid email is required"),
  website: z.string().url("Valid website URL is required").optional().or(z.literal("")),
  logoUrl: z.string().optional(),
  ownerProfilePicture: z.string().optional(),
  description: z.string().optional(),
  businessType: z.string().optional(),
});

// Job Role Schema
const jobRoleSchema = z.object({
  tenantId: z.string(),
  title: z.string().min(1, "Role title is required"),
  description: z.string().min(1, "Role description is required"),
  hourlyRate: z.string().min(1, "Hourly rate is required"),
  responsibilities: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

// Location Schema
const locationSchema = z.object({
  tenantId: z.string(),
  name: z.string().min(1, "Location name is required"),
  description: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  isActive: z.boolean().default(true),
});

// Department Schema
const departmentSchema = z.object({
  tenantId: z.string(),
  name: z.string().min(1, "Department name is required"),
  description: z.string().optional(),
  managerId: z.number().optional(),
  budget: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Operating Hours Schema
const operatingHoursSchema = z.object({
  tenantId: z.string(),
  dayOfWeek: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  isOpen: z.boolean(),
  breakStartTime: z.string().optional(),
  breakEndTime: z.string().optional(),
  notes: z.string().optional(),
});

type BusinessProfileFormData = z.infer<typeof businessProfileSchema>;
type JobRoleFormData = z.infer<typeof jobRoleSchema>;
type LocationFormData = z.infer<typeof locationSchema>;
type DepartmentFormData = z.infer<typeof departmentSchema>;
type OperatingHoursFormData = z.infer<typeof operatingHoursSchema>;

interface BusinessProfile {
  id: number;
  tenantId: string;
  name: string;
  ownerName: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logoUrl?: string;
  ownerProfilePicture?: string;
  description?: string;
  businessType?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface JobRole {
  id: number;
  tenantId: string;
  title: string;
  description: string;
  hourlyRate: string;
  responsibilities: string[];
  requirements: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Location {
  id: number;
  tenantId: string;
  name: string;
  description?: string;
  address: string;
  capacity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Department {
  id: number;
  tenantId: string;
  name: string;
  description?: string;
  managerId?: number;
  budget?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface OperatingHours {
  id: number;
  tenantId: string;
  dayOfWeek: string;
  openTime?: string;
  closeTime?: string;
  isOpen: boolean;
  breakStartTime?: string;
  breakEndTime?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function BusinessSettingsPage() {
  const { user, tenantId } = useAuth();
  const { toast } = useToast();
  const [isRoleModalOpen, setIsRoleModalOpen] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState<JobRole | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = React.useState(false);
  const [editingLocation, setEditingLocation] = React.useState<Location | null>(null);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = React.useState(false);
  const [editingDepartment, setEditingDepartment] = React.useState<Department | null>(null);

  // Business Profile Form
  const profileForm = useForm<BusinessProfileFormData>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      tenantId: tenantId || "",
      name: "",
      ownerName: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      logoUrl: "",
      ownerProfilePicture: "",
      description: "",
      businessType: "",
    },
  });

  // Job Role Form
  const roleForm = useForm<JobRoleFormData>({
    resolver: zodResolver(jobRoleSchema),
    defaultValues: {
      tenantId: tenantId || "",
      title: "",
      description: "",
      hourlyRate: "",
      responsibilities: [],
      requirements: [],
      isActive: true,
    },
  });

  // Location Form
  const locationForm = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      tenantId: tenantId || "",
      name: "",
      description: "",
      address: "",
      capacity: 1,
      isActive: true,
    },
  });

  // Department Form
  const departmentForm = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      tenantId: tenantId || "",
      name: "",
      description: "",
      managerId: undefined,
      budget: "",
      isActive: true,
    },
  });

  // Fetch Business Profile
  const { data: businessProfile, isLoading: profileLoading } = useQuery<BusinessProfile>({
    queryKey: ["/api/business-profile", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/business-profile?tenantId=${tenantId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch business profile');
      }
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Fetch Job Roles
  const { data: jobRoles = [], isLoading: rolesLoading } = useQuery<JobRole[]>({
    queryKey: ["/api/job-roles", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/job-roles?tenantId=${tenantId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch job roles');
      }
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Fetch Locations
  const { data: locations = [], isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/locations?tenantId=${tenantId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Fetch Departments
  const { data: departments = [], isLoading: departmentsLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/departments?tenantId=${tenantId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Fetch Operating Hours
  const { data: operatingHours = [], isLoading: hoursLoading } = useQuery<OperatingHours[]>({
    queryKey: ["/api/operating-hours", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/operating-hours?tenantId=${tenantId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch operating hours');
      }
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Business Profile Mutation
  const profileMutation = useMutation({
    mutationFn: async (data: BusinessProfileFormData) => {
      return await apiRequest("PUT", `/api/business-profile`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-profile", tenantId] });
      toast({ title: "Success", description: "Business profile updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update business profile", variant: "destructive" });
    },
  });

  // Job Role Mutation
  const roleMutation = useMutation({
    mutationFn: async (data: JobRoleFormData & { id?: number }) => {
      if (data.id) {
        return await apiRequest("PUT", `/api/job-roles/${data.id}`, data);
      } else {
        return await apiRequest("POST", `/api/job-roles`, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-roles", tenantId] });
      setIsRoleModalOpen(false);
      setEditingRole(null);
      roleForm.reset();
      toast({ title: "Success", description: "Job role saved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save job role", variant: "destructive" });
    },
  });

  // Location Mutation
  const locationMutation = useMutation({
    mutationFn: async (data: LocationFormData & { id?: number }) => {
      if (data.id) {
        return await apiRequest("PUT", `/api/locations/${data.id}`, data);
      } else {
        return await apiRequest("POST", `/api/locations`, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", tenantId] });
      setIsLocationModalOpen(false);
      setEditingLocation(null);
      locationForm.reset();
      toast({ title: "Success", description: "Location saved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save location", variant: "destructive" });
    },
  });

  // Department Mutation
  const departmentMutation = useMutation({
    mutationFn: async (data: DepartmentFormData & { id?: number }) => {
      if (data.id) {
        return await apiRequest("PUT", `/api/departments/${data.id}`, data);
      } else {
        return await apiRequest("POST", `/api/departments`, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments", tenantId] });
      setIsDepartmentModalOpen(false);
      setEditingDepartment(null);
      departmentForm.reset();
      toast({ title: "Success", description: "Department saved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save department", variant: "destructive" });
    },
  });

  // Delete Mutations
  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/job-roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-roles", tenantId] });
      toast({ title: "Success", description: "Job role deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete job role", variant: "destructive" });
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", tenantId] });
      toast({ title: "Success", description: "Location deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete location", variant: "destructive" });
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments", tenantId] });
      toast({ title: "Success", description: "Department deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete department", variant: "destructive" });
    },
  });

  // Update form when business profile loads
  React.useEffect(() => {
    if (businessProfile) {
      profileForm.reset({
        tenantId: businessProfile.tenantId,
        name: businessProfile.name,
        ownerName: businessProfile.ownerName,
        address: businessProfile.address,
        phone: businessProfile.phone,
        email: businessProfile.email,
        website: businessProfile.website || "",
        logoUrl: businessProfile.logoUrl || "",
        ownerProfilePicture: businessProfile.ownerProfilePicture || "",
        description: businessProfile.description || "",
        businessType: businessProfile.businessType || "",
      });
    }
  }, [businessProfile, profileForm]);

  const handleRoleSubmit = (data: JobRoleFormData) => {
    const submitData = editingRole ? { ...data, id: editingRole.id } : data;
    roleMutation.mutate(submitData);
  };

  const handleLocationSubmit = (data: LocationFormData) => {
    const submitData = editingLocation ? { ...data, id: editingLocation.id } : data;
    locationMutation.mutate(submitData);
  };

  const handleDepartmentSubmit = (data: DepartmentFormData) => {
    const submitData = editingDepartment ? { ...data, id: editingDepartment.id } : data;
    departmentMutation.mutate(submitData);
  };

  const openRoleModal = (role?: JobRole) => {
    if (role) {
      setEditingRole(role);
      roleForm.reset({
        tenantId: role.tenantId,
        title: role.title,
        description: role.description,
        hourlyRate: role.hourlyRate,
        responsibilities: role.responsibilities,
        requirements: role.requirements,
        isActive: role.isActive,
      });
    } else {
      setEditingRole(null);
      roleForm.reset({
        tenantId: tenantId || "",
        title: "",
        description: "",
        hourlyRate: "",
        responsibilities: [],
        requirements: [],
        isActive: true,
      });
    }
    setIsRoleModalOpen(true);
  };

  const openLocationModal = (location?: Location) => {
    if (location) {
      setEditingLocation(location);
      locationForm.reset({
        tenantId: location.tenantId,
        name: location.name,
        description: location.description || "",
        address: location.address,
        capacity: location.capacity,
        isActive: location.isActive,
      });
    } else {
      setEditingLocation(null);
      locationForm.reset({
        tenantId: tenantId || "",
        name: "",
        description: "",
        address: "",
        capacity: 1,
        isActive: true,
      });
    }
    setIsLocationModalOpen(true);
  };

  const openDepartmentModal = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      departmentForm.reset({
        tenantId: department.tenantId,
        name: department.name,
        description: department.description || "",
        managerId: department.managerId,
        budget: department.budget || "",
        isActive: department.isActive,
      });
    } else {
      setEditingDepartment(null);
      departmentForm.reset({
        tenantId: tenantId || "",
        name: "",
        description: "",
        managerId: undefined,
        budget: "",
        isActive: true,
      });
    }
    setIsDepartmentModalOpen(true);
  };

  // Job Roles Table Columns
  const roleColumns: Column<JobRole>[] = [
    {
      header: "Title",
      key: "title",
    },
    {
      header: "Description",
      key: "description",
    },
    {
      header: "Hourly Rate",
      key: "hourlyRate",
    },
    {
      header: "Status",
      key: "isActive",
      cell: (role) => (
        <Badge variant={role.isActive ? "default" : "secondary"}>
          {role.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  // Locations Table Columns
  const locationColumns: Column<Location>[] = [
    {
      header: "Name",
      key: "name",
    },
    {
      header: "Address",
      key: "address",
    },
    {
      header: "Capacity",
      key: "capacity",
    },
    {
      header: "Status",
      key: "isActive",
      cell: (location) => (
        <Badge variant={location.isActive ? "default" : "secondary"}>
          {location.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  // Departments Table Columns
  const departmentColumns: Column<Department>[] = [
    {
      header: "Name",
      key: "name",
    },
    {
      header: "Description",
      key: "description",
    },
    {
      header: "Budget",
      key: "budget",
    },
    {
      header: "Status",
      key: "isActive",
      cell: (department) => (
        <Badge variant={department.isActive ? "default" : "secondary"}>
          {department.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  const { role, switchRole } = useAuth();
  
  if (role !== "owner") {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <p className="text-muted-foreground text-center">
              Business Settings is only available to business owners.<br />
              You are currently viewing as: <Badge variant="secondary">{role}</Badge>
            </p>
            <Button onClick={() => switchRole("owner")} variant="outline">
              Switch to Owner View
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Settings</h1>
          <p className="text-muted-foreground">
            Manage your business profile, job roles, locations, and operating hours
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Business Profile</TabsTrigger>
          <TabsTrigger value="roles">Job Roles</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="hours">Operating Hours</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profileLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading business profile...</div>
                </div>
              ) : (
                <form onSubmit={profileForm.handleSubmit((data) => profileMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter business name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="ownerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Owner Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter owner name" />
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
                            <Input {...field} type="email" placeholder="Enter email address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter phone number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter website URL" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="businessType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Type</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter business type" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={profileForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Enter business address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Enter business description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={profileMutation.isPending}>
                    {profileMutation.isPending ? "Saving..." : "Save Profile"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Job Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={jobRoles}
                columns={roleColumns}
                title="Job Roles"
                isLoading={rolesLoading}
                onAdd={() => openRoleModal()}
                onEdit={(role) => openRoleModal(role)}
                onDelete={(role) => deleteRoleMutation.mutate(role.id)}
                addLabel="Add Job Role"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={locations}
                columns={locationColumns}
                title="Locations"
                isLoading={locationsLoading}
                onAdd={() => openLocationModal()}
                onEdit={(location) => openLocationModal(location)}
                onDelete={(location) => deleteLocationMutation.mutate(location.id)}
                addLabel="Add Location"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Departments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={departments}
                columns={departmentColumns}
                title="Departments"
                isLoading={departmentsLoading}
                onAdd={() => openDepartmentModal()}
                onEdit={(department) => openDepartmentModal(department)}
                onDelete={(department) => deleteDepartmentMutation.mutate(department.id)}
                addLabel="Add Department"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Operating Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hoursLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading operating hours...</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {operatingHours.map((hours) => (
                    <div key={hours.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="font-medium capitalize">{hours.dayOfWeek}</div>
                        {hours.isOpen ? (
                          <div className="text-sm text-muted-foreground">
                            {hours.openTime} - {hours.closeTime}
                            {hours.breakStartTime && hours.breakEndTime && (
                              <span> (Break: {hours.breakStartTime} - {hours.breakEndTime})</span>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">Closed</div>
                        )}
                        {hours.notes && (
                          <div className="text-sm text-muted-foreground">({hours.notes})</div>
                        )}
                      </div>
                      <Badge variant={hours.isOpen ? "default" : "secondary"}>
                        {hours.isOpen ? "Open" : "Closed"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Job Role Modal */}
      <ModalForm
        isOpen={isRoleModalOpen}
        onClose={() => {
          setIsRoleModalOpen(false);
          setEditingRole(null);
          roleForm.reset();
        }}
        title={editingRole ? "Edit Job Role" : "Add Job Role"}
        form={roleForm}
        onSubmit={handleRoleSubmit}
        isLoading={roleMutation.isPending}
      >
        <div className="space-y-4">
          <FormField
            control={roleForm.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter job title" />
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
                  <Textarea {...field} placeholder="Enter job description" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={roleForm.control}
            name="hourlyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hourly Rate</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter hourly rate (e.g., $15.00)" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={roleForm.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Make this job role available for assignment
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

      {/* Location Modal */}
      <ModalForm
        isOpen={isLocationModalOpen}
        onClose={() => {
          setIsLocationModalOpen(false);
          setEditingLocation(null);
          locationForm.reset();
        }}
        title={editingLocation ? "Edit Location" : "Add Location"}
        form={locationForm}
        onSubmit={handleLocationSubmit}
        isLoading={locationMutation.isPending}
      >
        <div className="space-y-4">
          <FormField
            control={locationForm.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter location name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={locationForm.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Enter location address" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={locationForm.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacity</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="Enter maximum capacity"
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={locationForm.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Enter location description" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={locationForm.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Make this location available for scheduling
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

      {/* Department Modal */}
      <ModalForm
        isOpen={isDepartmentModalOpen}
        onClose={() => {
          setIsDepartmentModalOpen(false);
          setEditingDepartment(null);
          departmentForm.reset();
        }}
        title={editingDepartment ? "Edit Department" : "Add Department"}
        form={departmentForm}
        onSubmit={handleDepartmentSubmit}
        isLoading={departmentMutation.isPending}
      >
        <div className="space-y-4">
          <FormField
            control={departmentForm.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter department name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={departmentForm.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Enter department description" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={departmentForm.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter department budget (e.g., $50,000)" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={departmentForm.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Make this department available for use
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
    </div>
  );
}