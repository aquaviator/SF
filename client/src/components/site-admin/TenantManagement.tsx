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
  DollarSign,
  Activity
} from "lucide-react";

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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(tenant)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
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
            <div className="space-y-6">
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
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Failed to load tenant details.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}