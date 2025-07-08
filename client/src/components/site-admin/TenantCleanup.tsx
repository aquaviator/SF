import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Trash2, 
  AlertTriangle, 
  Calendar, 
  Users, 
  Database,
  Filter,
  Download,
  Eye
} from "lucide-react";

interface TenantData {
  id: number;
  name: string;
  subdomain: string;
  createdAt: string;
  userCount: number;
  shiftCount: number;
  lastActivity: string | null;
  subscriptionStatus: "active" | "trial" | "expired" | "cancelled";
  totalData: number; // Total records across all tables
  daysSinceActivity: number;
}

interface CleanupPreview {
  tenant: TenantData;
  affectedTables: Array<{
    tableName: string;
    recordCount: number;
  }>;
  totalRecords: number;
}

interface TenantCleanupProps {
  onUpdate: () => void;
}

export function TenantCleanup({ onUpdate }: TenantCleanupProps) {
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [selectedTenants, setSelectedTenants] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [cleanupPreview, setCleanupPreview] = useState<CleanupPreview[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterDays, setFilterDays] = useState(90); // Default: 90 days inactive
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      console.log("🏢 LOADING_TENANTS_FOR_CLEANUP", { timestamp: new Date() });
      
      const response = await fetch("/api/admin/tenants/cleanup-candidates");
      if (!response.ok) {
        throw new Error("Failed to load tenant data");
      }
      
      const tenantsData = await response.json();
      setTenants(tenantsData);
      
      console.log("✅ TENANTS_LOADED_FOR_CLEANUP", { 
        count: tenantsData.length, 
        timestamp: new Date() 
      });
    } catch (error) {
      console.error("❌ TENANTS_LOAD_ERROR", { error, timestamp: new Date() });
      toast({
        title: "Error Loading Tenants",
        description: "Failed to load tenant data for cleanup.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTenants = tenants.filter(tenant => {
    const daysCriteria = tenant.daysSinceActivity >= filterDays;
    const statusCriteria = filterStatus === "all" || tenant.subscriptionStatus === filterStatus;
    return daysCriteria && statusCriteria;
  });

  const handleTenantSelection = (tenantId: number, selected: boolean) => {
    if (selected) {
      setSelectedTenants([...selectedTenants, tenantId]);
    } else {
      setSelectedTenants(selectedTenants.filter(id => id !== tenantId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedTenants(filteredTenants.map(t => t.id));
    } else {
      setSelectedTenants([]);
    }
  };

  const generateCleanupPreview = async () => {
    if (selectedTenants.length === 0) {
      toast({
        title: "No Tenants Selected",
        description: "Please select tenants to preview cleanup.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("📋 GENERATING_CLEANUP_PREVIEW", { 
        tenantIds: selectedTenants, 
        timestamp: new Date() 
      });
      
      const response = await fetch("/api/admin/tenants/cleanup-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tenantIds: selectedTenants }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate cleanup preview");
      }

      const previewData = await response.json();
      setCleanupPreview(previewData);
      setShowPreview(true);
      
      console.log("✅ CLEANUP_PREVIEW_GENERATED", { 
        tenantsCount: previewData.length,
        totalRecords: previewData.reduce((sum: number, p: CleanupPreview) => sum + p.totalRecords, 0),
        timestamp: new Date() 
      });
      
    } catch (error) {
      console.error("❌ CLEANUP_PREVIEW_ERROR", { error, timestamp: new Date() });
      toast({
        title: "Error Generating Preview",
        description: "Failed to generate cleanup preview.",
        variant: "destructive",
      });
    }
  };

  const executeCleanup = async () => {
    setIsDeleting(true);
    
    try {
      console.log("🗑️ EXECUTING_TENANT_CLEANUP", { 
        tenantIds: selectedTenants, 
        timestamp: new Date() 
      });
      
      const response = await fetch("/api/admin/tenants/cleanup", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tenantIds: selectedTenants }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to cleanup tenants");
      }

      const result = await response.json();
      
      console.log("✅ TENANT_CLEANUP_COMPLETED", { 
        deletedTenants: result.deletedTenants,
        totalRecordsDeleted: result.totalRecordsDeleted,
        timestamp: new Date() 
      });

      toast({
        title: "Cleanup Completed",
        description: `Successfully deleted ${result.deletedTenants} tenants and ${result.totalRecordsDeleted} database records.`,
      });

      setShowPreview(false);
      setSelectedTenants([]);
      loadTenants();
      onUpdate();
      
    } catch (error: any) {
      console.error("❌ TENANT_CLEANUP_ERROR", { error: error.message, timestamp: new Date() });
      
      toast({
        title: "Cleanup Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const exportCleanupReport = async () => {
    try {
      const response = await fetch("/api/admin/tenants/cleanup-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          tenantIds: selectedTenants,
          filterDays,
          filterStatus 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate cleanup report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tenant-cleanup-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Report Exported",
        description: "Cleanup report has been downloaded.",
      });
      
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export cleanup report.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Label htmlFor="filterDays">Inactive for:</Label>
            <Input
              id="filterDays"
              type="number"
              value={filterDays}
              onChange={(e) => setFilterDays(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">days</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="filterStatus">Status:</Label>
            <select
              id="filterStatus"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1 border rounded-md"
            >
              <option value="all">All</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
              <option value="trial">Trial</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCleanupReport} disabled={selectedTenants.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button 
            variant="destructive" 
            onClick={generateCleanupPreview}
            disabled={selectedTenants.length === 0}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview Cleanup ({selectedTenants.length})
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>Found {filteredTenants.length} tenants matching criteria</span>
        <span>•</span>
        <span>{selectedTenants.length} selected for cleanup</span>
        {filteredTenants.length > 0 && (
          <>
            <span>•</span>
            <span>
              Total records: {filteredTenants
                .filter(t => selectedTenants.includes(t.id))
                .reduce((sum, t) => sum + t.totalData, 0)}
            </span>
          </>
        )}
      </div>

      {/* Tenants Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={filteredTenants.length > 0 && selectedTenants.length === filteredTenants.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Data Records</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Days Inactive</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No tenants match the current filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredTenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedTenants.includes(tenant.id)}
                      onCheckedChange={(checked) => handleTenantSelection(tenant.id, checked as boolean)}
                    />
                  </TableCell>
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
                      {tenant.userCount}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      {tenant.totalData.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {tenant.lastActivity 
                      ? new Date(tenant.lastActivity).toLocaleDateString()
                      : "Never"
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      tenant.subscriptionStatus === "active" ? "default" :
                      tenant.subscriptionStatus === "trial" ? "secondary" :
                      "destructive"
                    }>
                      {tenant.subscriptionStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={
                      tenant.daysSinceActivity > 180 ? "text-red-600 font-medium" :
                      tenant.daysSinceActivity > 90 ? "text-orange-600" :
                      "text-muted-foreground"
                    }>
                      {tenant.daysSinceActivity} days
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Cleanup Preview Dialog */}
      <AlertDialog open={showPreview} onOpenChange={setShowPreview}>
        <AlertDialogContent className="max-w-4xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Confirm Tenant Cleanup
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the selected tenants and ALL their associated data. 
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="max-h-96 overflow-y-auto">
            {cleanupPreview.map((preview) => (
              <div key={preview.tenant.id} className="border rounded-lg p-4 mb-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium">{preview.tenant.name}</h4>
                    <p className="text-sm text-muted-foreground">{preview.tenant.subdomain}</p>
                  </div>
                  <Badge variant="destructive">
                    {preview.totalRecords.toLocaleString()} records
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {preview.affectedTables.map((table) => (
                    <div key={table.tableName} className="flex justify-between">
                      <span className="text-muted-foreground">{table.tableName}:</span>
                      <span className="font-medium">{table.recordCount}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeCleanup}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete All Data"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}