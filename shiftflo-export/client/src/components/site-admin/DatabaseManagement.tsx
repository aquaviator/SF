import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Database, 
  Play, 
  BarChart3, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  HardDrive
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DatabaseTable {
  tableName: string;
  recordCount: number;
  tableSize: string;
  lastModified: string;
}

interface DatabaseStats {
  totalTables: number;
  totalRecords: number;
  databaseSize: string;
  lastBackup: string;
}

export function DatabaseManagement() {
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [customQuery, setCustomQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();

  const fetchDatabaseStats = async () => {
    try {
      console.log('📊 FETCHING_DATABASE_STATS', { timestamp: new Date() });
      
      const response = await fetch('/api/admin/database/stats', {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch database stats');
      
      const statsData = await response.json();
      setStats(statsData);
      
      console.log('✅ DATABASE_STATS_FETCHED', { stats: statsData, timestamp: new Date() });
    } catch (error) {
      console.error('❌ DATABASE_STATS_ERROR', { error });
      toast({
        title: "Error",
        description: "Failed to fetch database statistics.",
        variant: "destructive",
      });
    }
  };

  const fetchTableInfo = async () => {
    setIsLoading(true);
    try {
      console.log('🗃️ FETCHING_TABLE_INFO', { timestamp: new Date() });
      
      const response = await fetch('/api/admin/database/tables', {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch table information');
      
      const tableData = await response.json();
      setTables(tableData);
      
      console.log('✅ TABLE_INFO_FETCHED', { count: tableData.length, timestamp: new Date() });
    } catch (error) {
      console.error('❌ TABLE_INFO_ERROR', { error });
      toast({
        title: "Error",
        description: "Failed to fetch table information.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executeCustomQuery = async () => {
    if (!customQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a SQL query.",
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);
    try {
      console.log('🔍 EXECUTING_CUSTOM_QUERY', { query: customQuery, timestamp: new Date() });
      
      const response = await fetch('/api/admin/database/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ query: customQuery }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Query execution failed');
      }
      
      const result = await response.json();
      setQueryResult(result);
      
      console.log('✅ CUSTOM_QUERY_EXECUTED', { 
        rowsAffected: result.rowsAffected || result.length,
        timestamp: new Date() 
      });
      
      toast({
        title: "Query Executed",
        description: `Query completed successfully. ${result.rowsAffected || result.length} rows affected.`,
      });
    } catch (error: any) {
      console.error('❌ CUSTOM_QUERY_ERROR', { error: error.message });
      toast({
        title: "Query Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  useEffect(() => {
    fetchDatabaseStats();
    fetchTableInfo();
  }, []);

  return (
    <div className="space-y-6">
      {/* Database Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTables || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRecords || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Size</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.databaseSize || 'N/A'}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
          </CardContent>
        </Card>
      </div>

      {/* Table Information */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Database Tables</CardTitle>
              <CardDescription>Overview of all database tables and their statistics</CardDescription>
            </div>
            <Button onClick={fetchTableInfo} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
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
                  <TableHead>Table Name</TableHead>
                  <TableHead>Record Count</TableHead>
                  <TableHead>Table Size</TableHead>
                  <TableHead>Last Modified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.map((table) => (
                  <TableRow key={table.tableName}>
                    <TableCell className="font-medium">{table.tableName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{table.recordCount.toLocaleString()}</Badge>
                    </TableCell>
                    <TableCell>{table.tableSize}</TableCell>
                    <TableCell className="text-muted-foreground">{table.lastModified}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Custom Query Execution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            SQL Query Execution
          </CardTitle>
          <CardDescription>
            Execute custom SQL queries against the database. Use with caution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">SQL Query</label>
            <Textarea
              placeholder="SELECT * FROM users LIMIT 10;"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              rows={4}
              className="font-mono text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={executeCustomQuery} 
              disabled={isExecuting || !customQuery.trim()}
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Execute Query
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => {
                setCustomQuery('');
                setQueryResult(null);
              }}
            >
              Clear
            </Button>
          </div>

          {queryResult && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Query Result</label>
              <div className="bg-muted p-4 rounded-md">
                <pre className="text-sm overflow-auto max-h-64">
                  {JSON.stringify(queryResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}