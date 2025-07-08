import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Database, 
  Server, 
  Activity, 
  Download, 
  Upload, 
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Play,
  Loader2,
  Table,
  BarChart3
} from "lucide-react";

interface DatabaseStats {
  totalTables: number;
  totalRecords: number;
  databaseSize: string;
  lastBackup: string;
  activeConnections: number;
}

interface TableInfo {
  tableName: string;
  recordCount: number;
  tableSize: string;
  lastModified: string;
}

interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
}

export function DatabaseManagement() {
  const [activeTab, setActiveTab] = useState("overview");
  const [customQuery, setCustomQuery] = useState("");
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch database statistics
  const { data: dbStats, isLoading: statsLoading } = useQuery<DatabaseStats>({
    queryKey: ['/api/admin/database/stats'],
    retry: false,
  });

  // Fetch table information
  const { data: tableInfo, isLoading: tablesLoading } = useQuery<TableInfo[]>({
    queryKey: ['/api/admin/database/tables'],
    retry: false,
  });

  // Execute custom query mutation
  const executeQueryMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch('/api/admin/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (!response.ok) throw new Error('Query execution failed');
      return response.json();
    },
    onSuccess: (data) => {
      setQueryResult(data);
      toast({
        title: "Query Executed",
        description: `Returned ${data.rowCount} rows in ${data.executionTime}s`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Query Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Database backup mutation
  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/database/backup', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Backup creation failed');
      return response.blob();
    },
    onSuccess: (blob) => {
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database_backup_${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Backup Created",
        description: "Database backup downloaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Backup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Database optimization mutation
  const optimizeDatabaseMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/database/optimize', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Database optimization failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Database Optimized",
        description: "Database performance optimization completed",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/database/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Optimization Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRunQuery = () => {
    if (!customQuery.trim()) return;
    executeQueryMutation.mutate(customQuery);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" />
          Database Management
        </CardTitle>
        <CardDescription>
          Monitor and manage PostgreSQL database operations for all tenants
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tables">Tables</TabsTrigger>
            <TabsTrigger value="query">Query</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            {statsLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : dbStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Tables</p>
                        <p className="text-2xl font-bold">{dbStats.totalTables}</p>
                      </div>
                      <Table className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                        <p className="text-2xl font-bold">{dbStats.totalRecords.toLocaleString()}</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Database Size</p>
                        <p className="text-2xl font-bold">{dbStats.databaseSize}</p>
                      </div>
                      <Server className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Connections</p>
                        <p className="text-2xl font-bold">{dbStats.activeConnections}</p>
                      </div>
                      <Activity className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Last Backup</p>
                        <p className="text-sm font-bold">{dbStats.lastBackup}</p>
                      </div>
                      <Download className="h-8 w-8 text-indigo-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Database statistics will load automatically when connection is established
              </div>
            )}
          </TabsContent>

          <TabsContent value="tables" className="mt-6">
            {tablesLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : tableInfo ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">Table Name</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Record Count</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Table Size</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Last Modified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableInfo.map((table, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="border border-gray-300 px-4 py-2 font-medium">{table.tableName}</td>
                        <td className="border border-gray-300 px-4 py-2">{table.recordCount.toLocaleString()}</td>
                        <td className="border border-gray-300 px-4 py-2">{table.tableSize}</td>
                        <td className="border border-gray-300 px-4 py-2">{table.lastModified}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Table information will load automatically when connection is established
              </div>
            )}
          </TabsContent>

          <TabsContent value="query" className="mt-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Custom SQL Query</label>
                <textarea
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="SELECT * FROM users LIMIT 10;"
                  className="w-full h-32 p-3 border border-gray-300 rounded-md font-mono text-sm"
                />
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  Use caution with DELETE, UPDATE, and DROP statements. Always backup before making changes.
                </p>
              </div>
              
              <Button 
                onClick={handleRunQuery} 
                disabled={executeQueryMutation.isPending || !customQuery.trim()}
                className="flex items-center gap-2"
              >
                {executeQueryMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running Query...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Query
                  </>
                )}
              </Button>
              
              {queryResult && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">
                      Query executed successfully ({queryResult.rowCount} rows, {queryResult.executionTime}s)
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          {queryResult.columns.map((column, index) => (
                            <th key={index} className="border border-gray-300 px-4 py-2 text-left font-medium">{column}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResult.rows.map((row, index) => (
                          <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="border border-gray-300 px-4 py-2 text-sm">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="maintenance" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Database Backup
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a full database backup for disaster recovery
                  </p>
                  <Button 
                    className="w-full"
                    onClick={() => createBackupMutation.mutate()}
                    disabled={createBackupMutation.isPending}
                  >
                    {createBackupMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Backup...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Create Backup
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Database Restore
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Restore database from a backup file
                  </p>
                  <Button variant="outline" className="w-full" disabled>
                    <Upload className="h-4 w-4 mr-2" />
                    Restore from Backup
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Contact system administrator for restore operations
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RotateCcw className="h-5 w-5" />
                    Optimize Database
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Optimize database performance and rebuild indexes
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => optimizeDatabaseMutation.mutate()}
                    disabled={optimizeDatabaseMutation.isPending}
                  >
                    {optimizeDatabaseMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Optimizing...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Optimize Now
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Irreversible actions that affect all tenant data
                  </p>
                  <Button variant="destructive" className="w-full" disabled>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Reset Database
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    This action is disabled for safety
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}