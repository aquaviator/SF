import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Globe, 
  Plus, 
  Edit, 
  Trash2,
  RefreshCw,
  TestTube,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface DomainConfig {
  id: number;
  environment: string;
  domain: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DomainTestResult {
  domain: string;
  accessible: boolean;
  responseTime: number;
  sslValid: boolean;
  testedAt: string;
}

const domainSchema = z.object({
  environment: z.enum(['development', 'staging', 'production']),
  domain: z.string().min(1, "Domain is required").url("Must be a valid URL"),
});

const updateDomainSchema = z.object({
  domain: z.string().min(1, "Domain is required").url("Must be a valid URL"),
  isActive: z.boolean(),
});

export function DomainManagement() {
  const [domains, setDomains] = useState<DomainConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<DomainConfig | null>(null);
  const [testResults, setTestResults] = useState<Record<number, DomainTestResult>>({});
  const [testingDomain, setTestingDomain] = useState<number | null>(null);
  const { toast } = useToast();

  const createForm = useForm({
    resolver: zodResolver(domainSchema),
    defaultValues: {
      environment: 'development' as const,
      domain: '',
    },
  });

  const updateForm = useForm({
    resolver: zodResolver(updateDomainSchema),
    defaultValues: {
      domain: '',
      isActive: true,
    },
  });

  const fetchDomains = async () => {
    setIsLoading(true);
    try {
      console.log('🌐 FETCHING_DOMAIN_CONFIGS', { timestamp: new Date() });
      
      const response = await fetch('/api/admin/domains', {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch domain configurations');
      
      const domainData = await response.json();
      setDomains(domainData);
      
      console.log('✅ DOMAIN_CONFIGS_FETCHED', { count: domainData.length, timestamp: new Date() });
    } catch (error) {
      console.error('❌ DOMAIN_CONFIGS_ERROR', { error });
      toast({
        title: "Error",
        description: "Failed to fetch domain configurations.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createDomain = async (data: z.infer<typeof domainSchema>) => {
    try {
      console.log('➕ CREATING_DOMAIN_CONFIG', { data, timestamp: new Date() });
      
      const response = await fetch('/api/admin/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create domain configuration');
      }
      
      const newDomain = await response.json();
      
      console.log('✅ DOMAIN_CONFIG_CREATED', { domainId: newDomain.id, timestamp: new Date() });
      
      toast({
        title: "Domain Created",
        description: `Domain configuration for ${data.environment} created successfully.`,
      });
      
      setIsCreateOpen(false);
      createForm.reset();
      fetchDomains();
    } catch (error: any) {
      console.error('❌ CREATE_DOMAIN_CONFIG_ERROR', { error: error.message });
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateDomain = async (data: z.infer<typeof updateDomainSchema>) => {
    if (!selectedDomain) return;
    
    try {
      console.log('🔄 UPDATING_DOMAIN_CONFIG', { 
        domainId: selectedDomain.id, 
        data, 
        timestamp: new Date() 
      });
      
      const response = await fetch(`/api/admin/domains/${selectedDomain.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to update domain configuration');
      
      const updatedDomain = await response.json();
      
      console.log('✅ DOMAIN_CONFIG_UPDATED', { 
        domainId: updatedDomain.id, 
        timestamp: new Date() 
      });
      
      toast({
        title: "Domain Updated",
        description: "Domain configuration updated successfully.",
      });
      
      setIsUpdateOpen(false);
      setSelectedDomain(null);
      updateForm.reset();
      fetchDomains();
    } catch (error: any) {
      console.error('❌ UPDATE_DOMAIN_CONFIG_ERROR', { error: error.message });
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteDomain = async (domainId: number, environment: string) => {
    if (!confirm(`Are you sure you want to delete the ${environment} domain configuration?`)) {
      return;
    }

    try {
      console.log('🗑️ DELETING_DOMAIN_CONFIG', { domainId, timestamp: new Date() });
      
      const response = await fetch(`/api/admin/domains/${domainId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to delete domain configuration');
      
      console.log('✅ DOMAIN_CONFIG_DELETED', { domainId, timestamp: new Date() });
      
      toast({
        title: "Domain Deleted",
        description: `${environment} domain configuration has been deleted.`,
      });
      
      fetchDomains();
    } catch (error: any) {
      console.error('❌ DELETE_DOMAIN_CONFIG_ERROR', { error: error.message });
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const testDomain = async (domainId: number) => {
    setTestingDomain(domainId);
    try {
      console.log('🧪 TESTING_DOMAIN_CONFIG', { domainId, timestamp: new Date() });
      
      const response = await fetch(`/api/admin/domains/${domainId}/test`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to test domain configuration');
      
      const testResult = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        [domainId]: testResult
      }));
      
      console.log('✅ DOMAIN_TEST_COMPLETED', { 
        domainId,
        result: testResult,
        timestamp: new Date() 
      });
      
      toast({
        title: "Domain Test Completed",
        description: `Domain test completed. Response time: ${testResult.responseTime}ms`,
      });
    } catch (error: any) {
      console.error('❌ DOMAIN_TEST_ERROR', { error: error.message });
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTestingDomain(null);
    }
  };

  const editDomain = (domain: DomainConfig) => {
    setSelectedDomain(domain);
    updateForm.reset({
      domain: domain.domain,
      isActive: domain.isActive,
    });
    setIsUpdateOpen(true);
  };

  const getEnvironmentColor = (environment: string) => {
    switch (environment) {
      case 'production': return 'destructive';
      case 'staging': return 'default';
      case 'development': return 'secondary';
      default: return 'secondary';
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  useEffect(() => {
    if (selectedDomain) {
      updateForm.reset({
        domain: selectedDomain.domain,
        isActive: selectedDomain.isActive,
      });
    }
  }, [selectedDomain, updateForm]);

  return (
    <div className="space-y-6">
      {/* Domain Configuration Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Domains</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{domains.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Domains</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {domains.filter(d => d.isActive).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production Ready</CardTitle>
            <Globe className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {domains.filter(d => d.environment === 'production' && d.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Domain Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Domain Configurations</CardTitle>
              <CardDescription>Manage domain configurations for different environments</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchDomains} variant="outline" disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Domain
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Domain Configuration</DialogTitle>
                    <DialogDescription>
                      Add a new domain configuration for an environment
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...createForm}>
                    <form onSubmit={createForm.handleSubmit(createDomain)} className="space-y-4">
                      <FormField
                        control={createForm.control}
                        name="environment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Environment</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select environment" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="development">Development</SelectItem>
                                <SelectItem value="staging">Staging</SelectItem>
                                <SelectItem value="production">Production</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createForm.control}
                        name="domain"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Domain URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Create Domain</Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Environment</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Test Results</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((domain) => {
                  const testResult = testResults[domain.id];
                  return (
                    <TableRow key={domain.id}>
                      <TableCell>
                        <Badge variant={getEnvironmentColor(domain.environment)}>
                          {domain.environment}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{domain.domain}</TableCell>
                      <TableCell>
                        <Badge variant={domain.isActive ? "default" : "secondary"}>
                          {domain.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {testResult ? (
                          <div className="flex items-center gap-2">
                            {testResult.accessible ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm text-muted-foreground">
                              {testResult.responseTime}ms
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not tested</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(domain.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testDomain(domain.id)}
                            disabled={testingDomain === domain.id}
                          >
                            {testingDomain === domain.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <TestTube className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => editDomain(domain)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteDomain(domain.id, domain.environment)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Update Domain Dialog */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Domain Configuration</DialogTitle>
            <DialogDescription>
              Update the domain configuration for {selectedDomain?.environment}
            </DialogDescription>
          </DialogHeader>
          {selectedDomain && (
            <Form {...updateForm}>
              <form onSubmit={updateForm.handleSubmit(updateDomain)} className="space-y-4">
                <FormField
                  control={updateForm.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domain URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={updateForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Status</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Enable this domain configuration
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
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsUpdateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Domain</Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}