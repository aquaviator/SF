import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Search, 
  Users, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Activity,
  UserCog
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TenantUserManagement from "./TenantUserManagement";

// Validation schema for tenant editing
const tenantEditSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  subdomain: z.string().min(1, "Subdomain is required").regex(/^[a-z0-9-]+$/, "Subdomain must contain only lowercase letters, numbers, and hyphens"),
  status: z.enum(["active", "trial", "expired", "cancelled", "inactive"]),
  seatsIncluded: z.number().min(1, "Must have at least 1 seat").max(1000, "Maximum 1000 seats allowed")
});

type TenantEditForm = z.infer<typeof tenantEditSchema>;

interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  createdAt: string;
  userCount?: number;
  subscriptionStatus?: "active" | "trial" | "expired" | "cancelled" | "inactive";
  seatsUsed?: number;
  seatsIncluded?: number;
}

interface TenantDetails {
  tenant: Tenant;
  revenue: number;
  lastActivity: string;
  totalShifts: number;
  activeUsers: number;
  subscriptionInfo: {
    plan: string;
    billingCycle: string;
    nextBilling: string;
    totalPaid: number;
  };
}

interface TenantManagementProps {
  onUpdate?: () => void;
}

export function TenantManagement({ onUpdate }: TenantManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tenants with pagination
  const { data: tenantsData, isLoading } = useQuery({
    queryKey: ['/api/admin/tenants', searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`/api/admin/tenants?${params}`);
      if (!response.ok) throw new Error('Failed to fetch tenants');
      return response.json();
    },
  });

  // Fetch tenant details
  const { data: tenantDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['/api/admin/tenants/details', selectedTenant?.id],
    queryFn: async () => {
      if (!selectedTenant) return null;
      
      const response = await fetch(`/api/admin/tenants/${selectedTenant.id}/details`);
      if (!response.ok) throw new Error('Failed to fetch tenant details');
      return response.json();
    },
    enabled: !!selectedTenant,
  });

  const tenants = Array.isArray(tenantsData) ? tenantsData : [];
  const pagination = { page: 1, limit: 50, total: tenants.length, pages: 1 };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'trial': return 'secondary';
      case 'expired': return 'destructive';
      case 'cancelled': return 'outline';
      default: return 'secondary';
    }
  };

  const getUtilizationColor = (utilized: number) => {
    if (utilized > 1) return 'text-red-600';
    if (utilized > 0.8) return 'text-orange-600';
    if (utilized > 0.5) return 'text-green-600';
    return 'text-blue-600';
  };

  const handleViewDetails = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setShowDetails(true);
  };

  const handleEditTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setShowEditModal(true);
  };

  const handleDeleteTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setShowDeleteDialog(true);
  };

  // Form for tenant editing
  const form = useForm<TenantEditForm>({
    resolver: zodResolver(tenantEditSchema),
    defaultValues: {
      name: "",
      subdomain: "",
      status: "active",
      seatsIncluded: 5
    }
  });

  // Update tenant mutation
  const updateTenantMutation = useMutation({
    mutationFn: async (data: TenantEditForm & { id: number }) => {
      const response = await fetch(`/api/admin/tenants/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update tenant');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenants'] });
      setShowEditModal(false);
      toast({
        title: "Success",
        description: "Tenant updated successfully"
      });
      onUpdate?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete tenant mutation
  const deleteTenantMutation = useMutation({
    mutationFn: async (tenantId: number) => {
      const response = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete tenant');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenants'] });
      setShowDeleteDialog(false);
      setSelectedTenant(null);
      toast({
        title: "Success",
        description: "Tenant deleted successfully"
      });
      onUpdate?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmitEdit = (data: TenantEditForm) => {
    if (selectedTenant) {
      updateTenantMutation.mutate({ ...data, id: selectedTenant.id });
    }
  };

  const confirmDelete = () => {
    if (selectedTenant) {
      deleteTenantMutation.mutate(selectedTenant.id);
    }
  };

  // Set form values when editing a tenant
  useEffect(() => {
    if (selectedTenant && showEditModal) {
      form.reset({
        name: selectedTenant.name,
        subdomain: selectedTenant.subdomain,
        status: selectedTenant.subscriptionStatus || "inactive",
        seatsIncluded: selectedTenant.seatsIncluded || 5
      });
    }
  }, [selectedTenant, showEditModal, form]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tenants by name or subdomain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter">Status:</Label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{pagination.total}</p>
                <p className="text-sm text-muted-foreground">Total Tenants</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {tenants.filter(t => (t.subscriptionStatus || 'inactive') === 'active').length}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">
                  {tenants.filter(t => (t.subscriptionStatus || 'inactive') === 'trial').length}
                </p>
                <p className="text-sm text-muted-foreground">On Trial</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-2xl font-bold">
                  {tenants.filter(t => (t.seatsUsed || 0) > (t.seatsIncluded || 5)).length}
                </p>
                <p className="text-sm text-muted-foreground">Over Limit</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tenants</CardTitle>
          <CardDescription>
            Manage customer organizations and their subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Seat Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No tenants found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  tenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{tenant.name}</div>
                          <div className="text-sm text-muted-foreground">{tenant.subdomain}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {tenant.userCount || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className={`font-medium ${getUtilizationColor((tenant.seatsUsed || 0) / (tenant.seatsIncluded || 5))}`}>
                            {tenant.seatsUsed || 0} / {tenant.seatsIncluded || 5} seats
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round(((tenant.seatsUsed || 0) / (tenant.seatsIncluded || 5)) * 100)}% utilized
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(tenant.subscriptionStatus || 'inactive')}>
                          {tenant.subscriptionStatus || 'inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(tenant)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTenant(tenant)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteTenant(tenant)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Info */}
          {pagination.total > 0 && (
            <div className="mt-4 text-sm text-muted-foreground text-center">
              Showing {tenants.length} of {pagination.total} tenants
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tenant Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTenant?.name} - Tenant Details
            </DialogTitle>
            <DialogDescription>
              Complete overview of tenant activity and subscription information
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : tenantDetails ? (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  Manage Users
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-lg font-bold">£{tenantDetails.revenue}</p>
                        <p className="text-xs text-muted-foreground">Total Revenue</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-lg font-bold">{tenantDetails.activeUsers}</p>
                        <p className="text-xs text-muted-foreground">Active Users</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="text-lg font-bold">{tenantDetails.totalShifts}</p>
                        <p className="text-xs text-muted-foreground">Total Shifts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-lg font-bold">
                          {tenantDetails.lastActivity ? 
                            new Date(tenantDetails.lastActivity).toLocaleDateString() : 
                            'Never'
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">Last Activity</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Subscription Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Plan</Label>
                      <p className="text-lg">{tenantDetails.subscriptionInfo.plan}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Billing Cycle</Label>
                      <p className="text-lg">{tenantDetails.subscriptionInfo.billingCycle}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Next Billing</Label>
                      <p className="text-lg">{tenantDetails.subscriptionInfo.nextBilling}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Total Paid</Label>
                      <p className="text-lg">£{tenantDetails.subscriptionInfo.totalPaid}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tenant Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Organization Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Organization Name</Label>
                      <p className="text-lg">{selectedTenant?.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Subdomain</Label>
                      <p className="text-lg">{selectedTenant?.subdomain}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Created Date</Label>
                      <p className="text-lg">
                        {selectedTenant ? new Date(selectedTenant.createdAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Current Status</Label>
                      <Badge variant={getStatusColor(selectedTenant?.subscriptionStatus || '')}>
                        {selectedTenant?.subscriptionStatus}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </TabsContent>

              <TabsContent value="users">
                {selectedTenant && (
                  <TenantUserManagement 
                    tenantId={selectedTenant.id} 
                    tenantName={selectedTenant.name} 
                  />
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Failed to load tenant details.
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Tenant Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
            <DialogDescription>
              Update tenant information and subscription settings
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subdomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subdomain</FormLabel>
                    <FormControl>
                      <Input placeholder="company-subdomain" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subscription Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seatsIncluded"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seats Included</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="1000" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateTenantMutation.isPending}
                >
                  {updateTenantMutation.isPending ? "Updating..." : "Update Tenant"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedTenant?.name}"? This will permanently remove all tenant data including users, shifts, and subscription information. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteTenantMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTenantMutation.isPending ? "Deleting..." : "Delete Tenant"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}