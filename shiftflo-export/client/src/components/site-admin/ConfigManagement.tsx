import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface PlatformSetting {
  value: string;
  description: string;
  type: string;
  updatedAt: string;
}

interface HealthStatus {
  database: string;
  maintenanceMode: boolean;
  totalTenants: number;
  totalUsers: number;
  openTickets: number;
  timestamp: string;
}

const settingSchema = z.object({
  key: z.string().min(1, "Setting key is required"),
  value: z.string().min(1, "Setting value is required"),
  description: z.string().min(1, "Description is required"),
});

export function ConfigManagement() {
  const [settings, setSettings] = useState<Record<string, PlatformSetting>>({});
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(settingSchema),
    defaultValues: {
      key: '',
      value: '',
      description: '',
    },
  });

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      console.log('⚙️ FETCHING_PLATFORM_SETTINGS', { timestamp: new Date() });
      
      const response = await fetch('/api/admin/config', {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch platform settings');
      
      const settingsData = await response.json();
      setSettings(settingsData);
      
      console.log('✅ PLATFORM_SETTINGS_FETCHED', { 
        count: Object.keys(settingsData).length, 
        timestamp: new Date() 
      });
    } catch (error) {
      console.error('❌ PLATFORM_SETTINGS_ERROR', { error });
      toast({
        title: "Error",
        description: "Failed to fetch platform settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHealthStatus = async () => {
    try {
      console.log('🏥 FETCHING_HEALTH_STATUS', { timestamp: new Date() });
      
      const response = await fetch('/api/admin/config/health', {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch health status');
      
      const healthData = await response.json();
      setHealthStatus(healthData);
      
      console.log('✅ HEALTH_STATUS_FETCHED', { health: healthData, timestamp: new Date() });
    } catch (error) {
      console.error('❌ HEALTH_STATUS_ERROR', { error });
    }
  };

  const saveSetting = async (data: z.infer<typeof settingSchema>) => {
    try {
      console.log('💾 SAVING_PLATFORM_SETTING', { key: data.key, timestamp: new Date() });
      
      const response = await fetch(`/api/admin/config/${data.key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          value: data.value,
          description: data.description,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to save platform setting');
      
      const savedSetting = await response.json();
      
      console.log('✅ PLATFORM_SETTING_SAVED', { key: data.key, timestamp: new Date() });
      
      toast({
        title: "Setting Saved",
        description: `Platform setting "${data.key}" has been saved successfully.`,
      });
      
      setIsDialogOpen(false);
      setEditingKey(null);
      form.reset();
      fetchSettings();
    } catch (error: any) {
      console.error('❌ SAVE_PLATFORM_SETTING_ERROR', { error: error.message });
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteSetting = async (key: string) => {
    if (!confirm(`Are you sure you want to delete the setting "${key}"?`)) {
      return;
    }

    try {
      console.log('🗑️ DELETING_PLATFORM_SETTING', { key, timestamp: new Date() });
      
      const response = await fetch(`/api/admin/config/${key}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to delete platform setting');
      
      console.log('✅ PLATFORM_SETTING_DELETED', { key, timestamp: new Date() });
      
      toast({
        title: "Setting Deleted",
        description: `Platform setting "${key}" has been deleted.`,
      });
      
      fetchSettings();
    } catch (error: any) {
      console.error('❌ DELETE_PLATFORM_SETTING_ERROR', { error: error.message });
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const editSetting = (key: string, setting: PlatformSetting) => {
    setEditingKey(key);
    form.reset({
      key,
      value: setting.value,
      description: setting.description,
    });
    setIsDialogOpen(true);
  };

  const toggleMaintenanceMode = async () => {
    const currentValue = settings.maintenance_mode?.value === 'true';
    const newValue = !currentValue;
    
    try {
      console.log('🔧 TOGGLING_MAINTENANCE_MODE', { 
        from: currentValue, 
        to: newValue, 
        timestamp: new Date() 
      });
      
      const response = await fetch('/api/admin/config/maintenance_mode', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          value: newValue.toString(),
          description: 'System maintenance mode toggle',
        }),
      });
      
      if (!response.ok) throw new Error('Failed to toggle maintenance mode');
      
      console.log('✅ MAINTENANCE_MODE_TOGGLED', { value: newValue, timestamp: new Date() });
      
      toast({
        title: "Maintenance Mode",
        description: `Maintenance mode ${newValue ? 'enabled' : 'disabled'}.`,
      });
      
      fetchSettings();
      fetchHealthStatus();
    } catch (error: any) {
      console.error('❌ TOGGLE_MAINTENANCE_MODE_ERROR', { error: error.message });
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchHealthStatus();
  }, []);

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Status</CardTitle>
            {healthStatus?.database === 'healthy' ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              healthStatus?.database === 'healthy' ? 'text-green-600' : 'text-red-600'
            }`}>
              {healthStatus?.database || 'Unknown'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthStatus?.totalTenants || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthStatus?.totalUsers || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthStatus?.openTickets || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Mode Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>System Controls</CardTitle>
          <CardDescription>
            Critical system-wide settings and controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Maintenance Mode</h4>
              <p className="text-sm text-muted-foreground">
                Enable to prevent user access during system maintenance
              </p>
            </div>
            <Switch
              checked={settings.maintenance_mode?.value === 'true'}
              onCheckedChange={toggleMaintenanceMode}
            />
          </div>
        </CardContent>
      </Card>

      {/* Platform Settings */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>Configure system-wide platform settings</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchSettings} variant="outline" disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingKey(null);
                    form.reset({ key: '', value: '', description: '' });
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Setting
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingKey ? 'Edit Platform Setting' : 'Add Platform Setting'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingKey 
                        ? `Update the platform setting "${editingKey}"`
                        : 'Create a new platform setting'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(saveSetting)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="key"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Setting Key</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="setting_key_name" 
                                disabled={!!editingKey}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Value</FormLabel>
                            <FormControl>
                              <Input placeholder="Setting value" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="What this setting controls" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingKey ? 'Update Setting' : 'Create Setting'}
                        </Button>
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
                  <TableHead>Setting Key</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(settings).map(([key, setting]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium font-mono text-sm">{key}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        {setting.value}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{setting.description}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(setting.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editSetting(key, setting)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteSetting(key)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}