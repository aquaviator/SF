import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useCrud } from "@/hooks/useCrud";
import { DataTable, Column } from "@/components/DataTable";
import { ModalForm } from "@/components/ModalForm";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  UserPlus, 
  Award, 
  Calendar,
  TrendingUp,
  Star,
  Clock,
  Target
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@shared/schema";

const staffFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  username: z.string().min(1, "Username is required"),
  role: z.literal("staff"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type StaffFormData = z.infer<typeof staffFormSchema>;

interface PerformanceMetric {
  id: number;
  staffId: number;
  name: string;
  attendance: number;
  punctuality: number;
  efficiency: number;
  customerRating: number;
  totalHours: number;
  shiftsCompleted: number;
}

interface HolidayEntitlement {
  id: number;
  staffId: number;
  name: string;
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
}

export default function Workforce() {
  const { tenantId } = useAuth();
  const { toast } = useToast();
  
  const {
    data: staff = [],
    isLoading,
    isModalOpen,
    editingItem,
    isSubmitting,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSubmit,
    handleDelete,
  } = useCrud<User>({
    queryKey: ["/api/staff", tenantId],
    endpoint: `/api/staff?tenantId=${tenantId}`,
  });

  const form = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      role: "staff",
      password: "",
    },
  });

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isModalOpen) {
      if (editingItem) {
        form.reset({
          firstName: editingItem.firstName,
          lastName: editingItem.lastName,
          email: editingItem.email,
          username: editingItem.username,
          role: "staff",
          password: "",
        });
      } else {
        form.reset({
          firstName: "",
          lastName: "",
          email: "",
          username: "",
          role: "staff",
          password: "",
        });
      }
    }
  }, [isModalOpen, editingItem, form]);

  const onSubmit = (data: StaffFormData) => {
    const submitData = {
      ...data,
      tenantId,
      isActive: true,
    };

    if (editingItem) {
      handleSubmit({ ...submitData, id: editingItem.id } as User);
    } else {
      handleSubmit(submitData);
    }
  };

  // Mock performance data
  const performanceData: PerformanceMetric[] = [
    {
      id: 1,
      staffId: 2,
      name: "Sarah Anderson",
      attendance: 98,
      punctuality: 95,
      efficiency: 92,
      customerRating: 4.8,
      totalHours: 160,
      shiftsCompleted: 20,
    },
    {
      id: 2,
      staffId: 3,
      name: "Mike Johnson",
      attendance: 94,
      punctuality: 88,
      efficiency: 89,
      customerRating: 4.5,
      totalHours: 155,
      shiftsCompleted: 18,
    },
    {
      id: 3,
      staffId: 4,
      name: "Emily Davis",
      attendance: 96,
      punctuality: 92,
      efficiency: 94,
      customerRating: 4.9,
      totalHours: 162,
      shiftsCompleted: 21,
    },
  ];

  // Holiday entitlements data fetching
  const [holidayFilter, setHolidayFilter] = React.useState("");
  const [selectedEntitlement, setSelectedEntitlement] = React.useState<any>(null);
  const [isEntitlementModalOpen, setIsEntitlementModalOpen] = React.useState(false);

  const {
    data: holidayEntitlements = [],
    isLoading: isLoadingEntitlements,
    refetch: refetchEntitlements,
  } = useQuery({
    queryKey: ["/api/holiday-entitlements", tenantId],
    queryFn: async () => {
      console.log('OWNER: fetching holiday entitlements…');
      const response = await fetch(`/api/holiday-entitlements?tenantId=${tenantId}`);
      if (!response.ok) throw new Error('Failed to fetch holiday entitlements');
      const data = await response.json();
      console.log('OWNER: entitlement data →', data);
      return data;
    },
    enabled: !!tenantId,
  });

  // Filter holiday entitlements
  const filteredEntitlements = React.useMemo(() => {
    if (!holidayFilter) return holidayEntitlements;
    const filtered = holidayEntitlements.filter((entitlement: any) =>
      entitlement.name.toLowerCase().includes(holidayFilter.toLowerCase())
    );
    console.log(`OWNER: filtering entitlements by "${holidayFilter}" → ${filtered.length} results`);
    return filtered;
  }, [holidayEntitlements, holidayFilter]);

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHolidayFilter(event.target.value);
  };

  const openEntitlementModal = (entitlement: any) => {
    console.log(`OWNER: opening entitlement modal for ${entitlement.name}`);
    setSelectedEntitlement(entitlement);
    setIsEntitlementModalOpen(true);
  };

  const closeEntitlementModal = () => {
    setSelectedEntitlement(null);
    setIsEntitlementModalOpen(false);
  };

  const handleEntitlementSave = async (newEntitlementDays: number) => {
    if (!selectedEntitlement) return;

    try {
      console.log(`OWNER: saving entitlement for ${selectedEntitlement.userId} → ${newEntitlementDays}`);
      
      const response = await fetch(`/api/holiday-entitlements/${selectedEntitlement.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          entitlementDays: newEntitlementDays,
          year: 2025,
        }),
      });

      if (!response.ok) throw new Error('Failed to update entitlement');
      
      refetchEntitlements();
      closeEntitlementModal();
      
      // Show success toast
      toast({
        title: "Entitlement updated",
        description: `Updated entitlement for ${selectedEntitlement.name}`,
      });
    } catch (error) {
      console.error('OWNER: entitlement save failed', error);
      toast({
        title: "Error",
        description: "Failed to update holiday entitlement",
        variant: "destructive",
      });
    }
  };

  const staffColumns: Column<User>[] = [
    {
      key: "name",
      header: "Staff Member",
      cell: (staff) => (
        <div>
          <p className="font-medium text-sm">{staff.firstName} {staff.lastName}</p>
          <p className="text-xs text-gray-500">{staff.email}</p>
        </div>
      ),
    },
    {
      key: "username",
      header: "Username",
      cell: (staff) => <span className="text-sm">{staff.username}</span>,
    },
    {
      key: "role",
      header: "Role",
      cell: (staff) => (
        <Badge variant="outline">
          {staff.role === "staff" ? "Staff Member" : "Owner"}
        </Badge>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      cell: (staff) => (
        <Badge variant={staff.isActive ? "default" : "secondary"}>
          {staff.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  const performanceColumns: Column<PerformanceMetric>[] = [
    {
      key: "name",
      header: "Staff Member",
      cell: (metric) => <span className="font-medium text-sm">{metric.name}</span>,
    },
    {
      key: "attendance",
      header: "Attendance",
      cell: (metric) => (
        <div className="flex items-center gap-2">
          <Progress value={metric.attendance} className="w-16" />
          <span className="text-sm">{metric.attendance}%</span>
        </div>
      ),
    },
    {
      key: "punctuality",
      header: "Punctuality",
      cell: (metric) => (
        <div className="flex items-center gap-2">
          <Progress value={metric.punctuality} className="w-16" />
          <span className="text-sm">{metric.punctuality}%</span>
        </div>
      ),
    },
    {
      key: "customerRating",
      header: "Rating",
      cell: (metric) => (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="text-sm">{metric.customerRating}</span>
        </div>
      ),
    },
    {
      key: "totalHours",
      header: "Hours",
      cell: (metric) => (
        <div className="text-sm">
          <p>{metric.totalHours}h</p>
          <p className="text-xs text-gray-500">{metric.shiftsCompleted} shifts</p>
        </div>
      ),
    },
  ];

  const holidayColumns: Column<any>[] = [
    {
      key: "name",
      header: "Staff Member",
      cell: (entitlement) => <span className="font-medium text-sm">{entitlement.name}</span>,
    },
    {
      key: "entitlementDays",
      header: "Entitlement",
      cell: (entitlement) => (
        <button
          onClick={() => openEntitlementModal(entitlement)}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
        >
          {entitlement.entitlementDays} days
        </button>
      ),
    },
    {
      key: "usedDays",
      header: "Used",
      cell: (entitlement) => <span className="text-sm">{entitlement.usedDays} days</span>,
    },
    {
      key: "pendingDays",
      header: "Pending",
      cell: (entitlement) => (
        <Badge variant={entitlement.pendingDays > 0 ? "secondary" : "outline"}>
          {entitlement.pendingDays} days
        </Badge>
      ),
    },
    {
      key: "remainingDays",
      header: "Remaining",
      cell: (entitlement) => (
        <span className="text-sm font-medium text-green-600">
          {entitlement.remainingDays} days
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Workforce Management</h2>
          <p className="text-gray-600">Manage staff, roles, and performance metrics</p>
        </div>
        <Button onClick={openCreateModal}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      <Tabs defaultValue="staff" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 gap-1">
          <TabsTrigger value="staff" className="flex items-center gap-1 p-2 text-xs md:text-sm min-h-[44px]">
            <Users className="w-4 h-4 shrink-0" />
            <span className="truncate">Staff</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-1 p-2 text-xs md:text-sm min-h-[44px]">
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span className="truncate">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="holidays" className="flex items-center gap-1 p-2 text-xs md:text-sm min-h-[44px]">
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="truncate">Holidays</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Staff</p>
                    <p className="text-2xl font-bold">{staff.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Staff</p>
                    <p className="text-2xl font-bold text-green-600">
                      {staff.filter(s => s.isActive).length}
                    </p>
                  </div>
                  <Award className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">New This Month</p>
                    <p className="text-2xl font-bold text-purple-600">2</p>
                  </div>
                  <UserPlus className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <DataTable
            data={staff}
            columns={staffColumns}
            title="Staff Members"
            onAdd={openCreateModal}
            onEdit={openEditModal}
            onDelete={handleDelete}
            addLabel="Add Staff Member"
            isLoading={isLoading}
            emptyState={
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No staff members</p>
                <p className="text-sm text-gray-400">Add your first staff member to get started</p>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <DataTable
            data={performanceData}
            columns={performanceColumns}
            title="Performance Metrics"
            isLoading={false}
            emptyState={
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No performance data available</p>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="holidays" className="space-y-6">
          {/* Filter input for holiday entitlements */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Input
              data-cy="holiday-entitlement-filter"
              placeholder="Filter by staff name..."
              value={holidayFilter}
              onChange={handleFilterChange}
              className="max-w-sm"
            />
          </div>
          
          <div className="min-w-full overflow-x-auto">
            <DataTable
              data={filteredEntitlements}
              columns={holidayColumns}
              title="Holiday Entitlements"
              isLoading={isLoadingEntitlements}
              emptyState={
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No holiday entitlements available</p>
                </div>
              }
            />
          </div>
        </TabsContent>
      </Tabs>

      <ModalForm
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit Staff Member" : "Add Staff Member"}
        form={form}
        onSubmit={onSubmit}
        submitLabel={editingItem ? "Update Staff Member" : "Add Staff Member"}
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter first name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter last name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
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

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="Enter username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!editingItem && (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      </ModalForm>

      {/* Holiday Entitlement Modal - Pre-rendered and hidden */}
      <HolidayEntitlementModal
        isOpen={isEntitlementModalOpen}
        onClose={closeEntitlementModal}
        entitlement={selectedEntitlement}
        onSave={handleEntitlementSave}
      />
    </div>
  );
}

// Holiday Entitlement Modal Component
function HolidayEntitlementModal({
  isOpen,
  onClose,
  entitlement,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  entitlement: any;
  onSave: (newEntitlementDays: number) => void;
}) {
  const [entitlementDays, setEntitlementDays] = React.useState(entitlement?.entitlementDays || 25);

  React.useEffect(() => {
    if (entitlement) {
      setEntitlementDays(entitlement.entitlementDays);
    }
  }, [entitlement]);

  if (!isOpen || !entitlement) return null;

  const handleSave = () => {
    onSave(entitlementDays);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">Edit Holiday Entitlement</h3>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Staff Member: {entitlement.name}</p>
            <p className="text-sm text-gray-600 mb-4">Current year: 2025</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Annual Entitlement (days)
            </label>
            <Input
              type="number"
              min="0"
              max="50"
              value={entitlementDays}
              onChange={(e) => setEntitlementDays(parseInt(e.target.value) || 0)}
              className="w-full"
            />
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Used: {entitlement.usedDays} days</p>
            <p>Pending: {entitlement.pendingDays} days</p>
            <p>Remaining: {entitlementDays - (entitlement.usedDays + entitlement.pendingDays)} days</p>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <Button onClick={handleSave} className="flex-1">
            Save
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}