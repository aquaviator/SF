import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Edit, Trash2, Globe, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface DomainConfig {
  id: number;
  name: string;
  baseUrl: string;
  isActive: boolean;
  createdAt: string;
}

const domainSchema = z.object({
  name: z.string().min(1, "Environment name is required"),
  baseUrl: z.string().url("Please enter a valid URL"),
  isActive: z.boolean().default(false),
});

type DomainForm = z.infer<typeof domainSchema>;

interface DomainManagementProps {
  onUpdate: () => void;
}

export function DomainManagement({ onUpdate }: DomainManagementProps) {
  const [domains, setDomains] = useState<DomainConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<DomainConfig | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<DomainForm>({
    resolver: zodResolver(domainSchema),
    defaultValues: {
      name: "",
      baseUrl: "",
      isActive: false,
    },
  });

  const watchIsActive = watch("isActive");

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      console.log("🌐 LOADING_DOMAINS", { timestamp: new Date() });
      
      const response = await fetch("/api/admin/domains");
      if (!response.ok) {
        throw new Error("Failed to load domains");
      }
      
      const domainsData = await response.json();
      setDomains(domainsData);
      
      console.log("✅ DOMAINS_LOADED", { count: domainsData.length, timestamp: new Date() });
    } catch (error) {
      console.error("❌ DOMAINS_LOAD_ERROR", { error, timestamp: new Date() });
      toast({
        title: "Error Loading Domains",
        description: "Failed to load domain configurations.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDomain = () => {
    setEditingDomain(null);
    reset({
      name: "",
      baseUrl: "",
      isActive: false,
    });
    setIsModalOpen(true);
  };

  const handleEditDomain = (domain: DomainConfig) => {
    setEditingDomain(domain);
    reset({
      name: domain.name,
      baseUrl: domain.baseUrl,
      isActive: domain.isActive,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: DomainForm) => {
    try {
      const isEditing = !!editingDomain;
      const url = isEditing 
        ? `/api/admin/domains/${editingDomain.id}` 
        : "/api/admin/domains";
      const method = isEditing ? "PUT" : "POST";

      console.log(`🌐 ${isEditing ? 'UPDATING' : 'CREATING'}_DOMAIN`, { 
        domain: data, 
        method, 
        timestamp: new Date() 
      });

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to ${isEditing ? 'update' : 'create'} domain`);
      }

      const result = await response.json();
      
      console.log(`✅ DOMAIN_${isEditing ? 'UPDATED' : 'CREATED'}`, { 
        domainId: result.id, 
        name: result.name, 
        timestamp: new Date() 
      });

      toast({
        title: `Domain ${isEditing ? 'Updated' : 'Created'}`,
        description: `Domain configuration "${data.name}" has been ${isEditing ? 'updated' : 'created'} successfully.`,
      });

      setIsModalOpen(false);
      reset();
      loadDomains();
      onUpdate();
      
    } catch (error: any) {
      console.error(`❌ DOMAIN_${editingDomain ? 'UPDATE' : 'CREATE'}_ERROR`, { 
        error: error.message, 
        timestamp: new Date() 
      });
      
      toast({
        title: `Error ${editingDomain ? 'Updating' : 'Creating'} Domain`,
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteDomain = async (domain: DomainConfig) => {
    if (!confirm(`Are you sure you want to delete the "${domain.name}" domain configuration?`)) {
      return;
    }

    try {
      console.log("🗑️ DELETING_DOMAIN", { domainId: domain.id, name: domain.name, timestamp: new Date() });
      
      const response = await fetch(`/api/admin/domains/${domain.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete domain");
      }

      console.log("✅ DOMAIN_DELETED", { domainId: domain.id, timestamp: new Date() });
      
      toast({
        title: "Domain Deleted",
        description: `Domain configuration "${domain.name}" has been deleted.`,
      });

      loadDomains();
      onUpdate();
      
    } catch (error: any) {
      console.error("❌ DOMAIN_DELETE_ERROR", { error: error.message, timestamp: new Date() });
      
      toast({
        title: "Error Deleting Domain",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (domain: DomainConfig) => {
    try {
      console.log("🔄 TOGGLING_DOMAIN_STATUS", { 
        domainId: domain.id, 
        currentStatus: domain.isActive, 
        timestamp: new Date() 
      });
      
      const response = await fetch(`/api/admin/domains/${domain.id}/toggle`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to toggle domain status");
      }

      const result = await response.json();
      
      console.log("✅ DOMAIN_STATUS_TOGGLED", { 
        domainId: domain.id, 
        newStatus: result.isActive, 
        timestamp: new Date() 
      });
      
      toast({
        title: "Domain Status Updated",
        description: `Domain "${domain.name}" is now ${result.isActive ? 'active' : 'inactive'}.`,
      });

      loadDomains();
      onUpdate();
      
    } catch (error: any) {
      console.error("❌ DOMAIN_TOGGLE_ERROR", { error: error.message, timestamp: new Date() });
      
      toast({
        title: "Error Updating Domain",
        description: error.message,
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
      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Domain Configurations</h3>
          <p className="text-sm text-muted-foreground">
            Manage environment-specific domain settings for email links and system URLs
          </p>
        </div>
        <Button onClick={handleCreateDomain}>
          <Plus className="h-4 w-4 mr-2" />
          Add Domain
        </Button>
      </div>

      {/* Domains Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Environment</TableHead>
              <TableHead>Base URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {domains.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No domain configurations found. Add your first domain to get started.
                </TableCell>
              </TableRow>
            ) : (
              domains.map((domain) => (
                <TableRow key={domain.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{domain.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {domain.baseUrl}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={domain.isActive ? "default" : "secondary"}>
                        {domain.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {domain.isActive && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(domain.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(domain)}
                      >
                        {domain.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditDomain(domain)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDomain(domain)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDomain ? "Edit Domain Configuration" : "Add Domain Configuration"}
            </DialogTitle>
            <DialogDescription>
              Configure environment-specific domain settings for email links and system redirects.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Environment Name</Label>
              <Input
                id="name"
                placeholder="e.g. production, development, staging"
                {...register("name")}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                placeholder="https://yourdomain.replit.app"
                {...register("baseUrl")}
                className={errors.baseUrl ? "border-red-500" : ""}
              />
              {errors.baseUrl && (
                <p className="text-sm text-red-500">{errors.baseUrl.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={watchIsActive}
                onCheckedChange={(checked) => setValue("isActive", checked)}
              />
              <Label htmlFor="isActive">Set as active environment</Label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? (editingDomain ? "Updating..." : "Creating...") 
                  : (editingDomain ? "Update Domain" : "Create Domain")
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}