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
import { PhotoUpload } from "@/components/PhotoUpload";
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
import type { JobRole, Location, Department } from "@shared/schema";

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

// Job Role Schema with Legend Support
const jobRoleSchema = z.object({
  tenantId: z.string(),
  title: z.string().min(1, "Role title is required"),
  description: z.string().min(1, "Role description is required"),
  hourlyRate: z.string().min(1, "Hourly rate is required"),
  responsibilities: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  // Legend settings for calendar display
  legendLabel: z.string().optional(),
  legendColor: z.enum(["green", "blue", "yellow", "purple", "indigo", "orange", "gray", "slate"]).default("slate"),
  legendIcon: z.string().optional(),
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
  const [isHoursModalOpen, setIsHoursModalOpen] = React.useState(false);
  const [editingHours, setEditingHours] = React.useState<OperatingHours | null>(null);

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
      legendLabel: "",
      legendColor: "slate",
      legendIcon: "",
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

  // Operating Hours Form
  const hoursForm = useForm<OperatingHoursFormData>({
    resolver: zodResolver(operatingHoursSchema),
    defaultValues: {
      tenantId: tenantId || "",
      dayOfWeek: "monday",
      openTime: "",
      closeTime: "",
      isOpen: true,
      breakStartTime: "",
      breakEndTime: "",
      notes: "",
    },
  });

  // Fetch Business Profile
  const { data: businessProfile, isLoading: profileLoading } = useQuery<BusinessProfile>({
    queryKey: ["/api/business-profile", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/business-profile?tenantId=${tenantId}&_=${Date.now()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch business profile');
      }
      return response.json();
    },
    enabled: !!tenantId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
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

  // Day ordering helper
  const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  // Fetch Operating Hours
  const { data: operatingHoursRaw = [], isLoading: hoursLoading } = useQuery<OperatingHours[]>({
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

  // Sort operating hours by day order (MON-SUN)
  const operatingHours = operatingHoursRaw.sort((a, b) => {
    return dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
  });

  // Business Profile Mutation
  const profileMutation = useMutation({
    mutationFn: async (data: BusinessProfileFormData) => {
      // Update business profile
      const profileResult = await apiRequest("PUT", `/api/business-profile`, data);
      
      // If owner name changed, also update the user profile to keep them in sync
      if (data.ownerName && user?.id) {
        const [firstName, ...lastNameParts] = data.ownerName.split(' ');
        const lastName = lastNameParts.join(' ');
        
        // Get current user data to preserve other fields
        const response = await apiRequest("GET", `/api/users/${user.id}`);
        const currentUser = await response.json();
        
        const updateData = {
          username: (currentUser as any).username,
          password: (currentUser as any).password, // Preserve existing password
          email: (currentUser as any).email,
          role: (currentUser as any).role,
          tenantId: (currentUser as any).tenantId,
          isActive: (currentUser as any).isActive,
          firstName: firstName || (currentUser as any).firstName || "",
          lastName: lastName || (currentUser as any).lastName || "",
        };
        
        // Update user with new name while preserving all existing fields
        await apiRequest("PUT", `/api/users/${user.id}`, updateData);
      }
      
      return profileResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-profile", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id] });
      toast({ title: "Success", description: "Business profile and user data updated successfully" });
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

  // Operating Hours Mutation
  const hoursMutation = useMutation({
    mutationFn: async (data: OperatingHoursFormData & { id?: number }) => {
      if (data.id) {
        return await apiRequest("PUT", `/api/operating-hours/${data.id}`, data);
      } else {
        return await apiRequest("POST", `/api/operating-hours`, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operating-hours", tenantId] });
      setIsHoursModalOpen(false);
      setEditingHours(null);
      hoursForm.reset();
      toast({ title: "Success", description: "Operating hours saved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save operating hours", variant: "destructive" });
    },
  });

  const deleteHoursMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/operating-hours/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operating-hours", tenantId] });
      toast({ title: "Success", description: "Operating hours deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete operating hours", variant: "destructive" });
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
    console.log("🔧 JOB_ROLE_FORM_SUBMIT", { data, editingRole });
    const submitData = editingRole ? { ...data, id: editingRole.id } : data;
    console.log("🔧 JOB_ROLE_SUBMIT_DATA", submitData);
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

  const handleHoursSubmit = (data: OperatingHoursFormData) => {
    const submitData = editingHours ? { ...data, id: editingHours.id } : data;
    hoursMutation.mutate(submitData);
  };

  const openRoleModal = (role?: JobRole) => {
    if (role) {
      setEditingRole(role);
      roleForm.reset({
        tenantId: role.tenantId,
        title: role.title,
        description: role.description,
        hourlyRate: role.hourlyRate,
        responsibilities: role.responsibilities || [],
        requirements: role.requirements || [],
        isActive: role.isActive,
        legendLabel: (role as any).legendLabel || "",
        legendColor: (role as any).legendColor || "slate", 
        legendIcon: (role as any).legendIcon || "",
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
        legendLabel: "",
        legendColor: "slate",
        legendIcon: "",
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

  const openHoursModal = (hours?: OperatingHours) => {
    if (hours) {
      setEditingHours(hours);
      hoursForm.reset({
        tenantId: hours.tenantId,
        dayOfWeek: hours.dayOfWeek as "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
        openTime: hours.openTime || "",
        closeTime: hours.closeTime || "",
        isOpen: hours.isOpen,
        breakStartTime: hours.breakStartTime || "",
        breakEndTime: hours.breakEndTime || "",
        notes: hours.notes || "",
      });
    } else {
      setEditingHours(null);
      hoursForm.reset({
        tenantId: tenantId || "",
        dayOfWeek: "monday",
        openTime: "",
        closeTime: "",
        isOpen: true,
        breakStartTime: "",
        breakEndTime: "",
        notes: "",
      });
    }
    setIsHoursModalOpen(true);
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
      header: "Legend Color",
      key: "legendColor",
      cell: (role) => (
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full border ${role.legendColor ? `bg-${role.legendColor}-500` : 'bg-slate-400'}`} />
          <span className="text-sm capitalize">{role.legendColor || 'Default'}</span>
        </div>
      ),
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

  // Operating Hours Table Columns
  const hoursColumns: Column<OperatingHours>[] = [
    {
      header: "Day",
      key: "dayOfWeek",
      cell: (hours) => <span className="capitalize">{hours.dayOfWeek}</span>,
    },
    {
      header: "Status",
      key: "isOpen",
      cell: (hours) => (
        <Badge variant={hours.isOpen ? "default" : "secondary"}>
          {hours.isOpen ? "Open" : "Closed"}
        </Badge>
      ),
    },
    {
      header: "Hours",
      key: "hours",
      cell: (hours) => (
        <span>
          {hours.isOpen ? `${hours.openTime} - ${hours.closeTime}` : "Closed"}
        </span>
      ),
    },
    {
      header: "Break",
      key: "break",
      cell: (hours) => (
        <span>
          {hours.breakStartTime && hours.breakEndTime
            ? `${hours.breakStartTime} - ${hours.breakEndTime}`
            : "None"}
        </span>
      ),
    },
    {
      header: "Notes",
      key: "notes",
      cell: (hours) => <span>{hours.notes || "—"}</span>,
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
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-1 h-auto">
          <TabsTrigger value="profile" className="text-xs md:text-sm p-2 min-h-[44px]">
            <span className="truncate">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="text-xs md:text-sm p-2 min-h-[44px]">
            <span className="truncate">Roles</span>
          </TabsTrigger>
          <TabsTrigger value="locations" className="text-xs md:text-sm p-2 min-h-[44px]">
            <span className="truncate">Locations</span>
          </TabsTrigger>
          <TabsTrigger value="departments" className="text-xs md:text-sm p-2 min-h-[44px]">
            <span className="truncate">Departments</span>
          </TabsTrigger>
          <TabsTrigger value="hours" className="text-xs md:text-sm p-2 min-h-[44px] col-span-2 md:col-span-1">
            <span className="truncate">Operating Hours</span>
          </TabsTrigger>
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
                  {/* Photo Upload Section */}
                  <div className="space-y-6 border-t pt-6">
                    <h3 className="text-lg font-medium">Business Branding</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <PhotoUpload
                        type="logo"
                        currentImage={profileForm.watch("logoUrl")}
                        onImageChange={(imageUrl) => profileForm.setValue("logoUrl", imageUrl)}
                        size="lg"
                      />
                      <PhotoUpload
                        type="avatar"
                        currentImage={profileForm.watch("ownerProfilePicture")}
                        onImageChange={(imageUrl) => profileForm.setValue("ownerProfilePicture", imageUrl)}
                        size="lg"
                      />
                    </div>
                  </div>
                  
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
              <DataTable
                data={operatingHours}
                columns={hoursColumns}
                title="Operating Hours"
                isLoading={hoursLoading}
                onAdd={() => openHoursModal()}
                onEdit={(hours) => openHoursModal(hours)}
                onDelete={(hours) => deleteHoursMutation.mutate(hours.id)}
                addLabel="Add Operating Hours"
              />
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
          {/* Legend Management Section */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
              <h4 className="font-medium">Calendar Legend Settings</h4>
            </div>
            
            <FormField
              control={roleForm.control}
              name="legendLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Label (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Custom label for calendar (leave empty to use role title)" />
                  </FormControl>
                  <div className="text-xs text-muted-foreground">
                    Override the display name shown in calendar legend and shift badges
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={roleForm.control}
              name="legendColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calendar Color</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a color scheme">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              field.value === "green" ? "bg-green-400" :
                              field.value === "blue" ? "bg-blue-400" :
                              field.value === "yellow" ? "bg-yellow-400" :
                              field.value === "purple" ? "bg-purple-400" :
                              field.value === "indigo" ? "bg-indigo-400" :
                              field.value === "orange" ? "bg-orange-400" :
                              field.value === "gray" ? "bg-gray-400" :
                              "bg-slate-400"
                            }`} />
                            <span className="capitalize">{field.value}</span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="green">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-400" />
                            Green
                          </div>
                        </SelectItem>
                        <SelectItem value="blue">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-400" />
                            Blue
                          </div>
                        </SelectItem>
                        <SelectItem value="yellow">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-400" />
                            Yellow
                          </div>
                        </SelectItem>
                        <SelectItem value="purple">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-purple-400" />
                            Purple
                          </div>
                        </SelectItem>
                        <SelectItem value="indigo">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-400" />
                            Indigo
                          </div>
                        </SelectItem>
                        <SelectItem value="orange">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-400" />
                            Orange
                          </div>
                        </SelectItem>
                        <SelectItem value="gray">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-400" />
                            Gray
                          </div>
                        </SelectItem>
                        <SelectItem value="slate">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-slate-400" />
                            Slate
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <div className="text-xs text-muted-foreground">
                    Color used in calendar legend, shift badges, and mobile dots
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Legend Preview */}
            <div className="bg-slate-50 rounded-lg p-3 border">
              <div className="text-xs font-medium text-slate-600 mb-2">Preview:</div>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    roleForm.watch("legendColor") === "green" ? "bg-green-400" :
                    roleForm.watch("legendColor") === "blue" ? "bg-blue-400" :
                    roleForm.watch("legendColor") === "yellow" ? "bg-yellow-400" :
                    roleForm.watch("legendColor") === "purple" ? "bg-purple-400" :
                    roleForm.watch("legendColor") === "indigo" ? "bg-indigo-400" :
                    roleForm.watch("legendColor") === "orange" ? "bg-orange-400" :
                    roleForm.watch("legendColor") === "gray" ? "bg-gray-400" :
                    "bg-slate-400"
                  }`} />
                  <span className="text-xs">Legend</span>
                </div>
                <div className={`inline-flex items-center px-2 py-1 rounded border text-xs font-medium ${
                  roleForm.watch("legendColor") === "green" ? "bg-green-100 border-green-300 text-green-800" :
                  roleForm.watch("legendColor") === "blue" ? "bg-blue-100 border-blue-300 text-blue-800" :
                  roleForm.watch("legendColor") === "yellow" ? "bg-yellow-100 border-yellow-300 text-yellow-800" :
                  roleForm.watch("legendColor") === "purple" ? "bg-purple-100 border-purple-300 text-purple-800" :
                  roleForm.watch("legendColor") === "indigo" ? "bg-indigo-100 border-indigo-300 text-indigo-800" :
                  roleForm.watch("legendColor") === "orange" ? "bg-orange-100 border-orange-300 text-orange-800" :
                  roleForm.watch("legendColor") === "gray" ? "bg-gray-100 border-gray-300 text-gray-800" :
                  "bg-slate-100 border-slate-300 text-slate-800"
                }`}>
                  {roleForm.watch("legendLabel") || roleForm.watch("title") || "Role Badge"}
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  roleForm.watch("legendColor") === "green" ? "bg-green-500" :
                  roleForm.watch("legendColor") === "blue" ? "bg-blue-500" :
                  roleForm.watch("legendColor") === "yellow" ? "bg-yellow-500" :
                  roleForm.watch("legendColor") === "purple" ? "bg-purple-500" :
                  roleForm.watch("legendColor") === "indigo" ? "bg-indigo-500" :
                  roleForm.watch("legendColor") === "orange" ? "bg-orange-500" :
                  roleForm.watch("legendColor") === "gray" ? "bg-gray-500" :
                  "bg-slate-500"
                }`} />
                <span className="text-xs">Mobile</span>
              </div>
            </div>
          </div>

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

      {/* Operating Hours Modal */}
      <ModalForm
        isOpen={isHoursModalOpen}
        onClose={() => {
          setIsHoursModalOpen(false);
          setEditingHours(null);
          hoursForm.reset();
        }}
        title={editingHours ? "Edit Operating Hours" : "Add Operating Hours"}
        form={hoursForm}
        onSubmit={handleHoursSubmit}
        isLoading={hoursMutation.isPending}
      >
        <div className="space-y-4">
          <FormField
            control={hoursForm.control}
            name="dayOfWeek"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Day of Week</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a day" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="tuesday">Tuesday</SelectItem>
                    <SelectItem value="wednesday">Wednesday</SelectItem>
                    <SelectItem value="thursday">Thursday</SelectItem>
                    <SelectItem value="friday">Friday</SelectItem>
                    <SelectItem value="saturday">Saturday</SelectItem>
                    <SelectItem value="sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={hoursForm.control}
            name="isOpen"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Open</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Is the business open on this day?
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
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={hoursForm.control}
              name="openTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Open Time</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="time"
                      placeholder="09:00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={hoursForm.control}
              name="closeTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Close Time</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="time"
                      placeholder="18:00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={hoursForm.control}
              name="breakStartTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Break Start</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="time"
                      placeholder="12:00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={hoursForm.control}
              name="breakEndTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Break End</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="time"
                      placeholder="13:00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={hoursForm.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Additional notes about these hours" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </ModalForm>
    </div>
  );
}