import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Ticket, 
  Plus, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw
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

interface SupportTicket {
  id: number;
  tenantId: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: number | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

interface SupportStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  highPriorityOpen: number;
  avgResolutionTimeHours: number;
}

const createTicketSchema = z.object({
  tenantId: z.string().min(1, "Tenant ID is required"),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().min(1, "Description is required"),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});

const updateTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assignedTo: z.string().optional(),
  resolution: z.string().optional(),
});

export function SupportManagement() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const { toast } = useToast();

  const createForm = useForm({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      tenantId: '',
      subject: '',
      description: '',
      priority: 'medium' as const,
    },
  });

  const updateForm = useForm({
    resolver: zodResolver(updateTicketSchema),
    defaultValues: {
      status: 'open' as const,
      priority: 'medium' as const,
      assignedTo: '',
      resolution: '',
    },
  });

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      console.log('🎫 FETCHING_SUPPORT_TICKETS', { 
        search: searchTerm, 
        status: statusFilter, 
        priority: priorityFilter,
        timestamp: new Date() 
      });
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      
      const response = await fetch(`/api/admin/support?${params}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch support tickets');
      
      const ticketData = await response.json();
      setTickets(ticketData);
      
      console.log('✅ SUPPORT_TICKETS_FETCHED', { count: ticketData.length, timestamp: new Date() });
    } catch (error) {
      console.error('❌ SUPPORT_TICKETS_ERROR', { error });
      toast({
        title: "Error",
        description: "Failed to fetch support tickets.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('📊 FETCHING_SUPPORT_STATS', { timestamp: new Date() });
      
      const response = await fetch('/api/admin/support/stats', {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch support stats');
      
      const statsData = await response.json();
      setStats(statsData);
      
      console.log('✅ SUPPORT_STATS_FETCHED', { stats: statsData, timestamp: new Date() });
    } catch (error) {
      console.error('❌ SUPPORT_STATS_ERROR', { error });
    }
  };

  const createTicket = async (data: z.infer<typeof createTicketSchema>) => {
    try {
      console.log('📝 CREATING_SUPPORT_TICKET', { data, timestamp: new Date() });
      
      const response = await fetch('/api/admin/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to create support ticket');
      
      const newTicket = await response.json();
      
      console.log('✅ SUPPORT_TICKET_CREATED', { ticketId: newTicket.id, timestamp: new Date() });
      
      toast({
        title: "Ticket Created",
        description: "Support ticket created successfully.",
      });
      
      setIsCreateOpen(false);
      createForm.reset();
      fetchTickets();
      fetchStats();
    } catch (error: any) {
      console.error('❌ CREATE_SUPPORT_TICKET_ERROR', { error: error.message });
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateTicket = async (data: z.infer<typeof updateTicketSchema>) => {
    if (!selectedTicket) return;
    
    try {
      console.log('🔄 UPDATING_SUPPORT_TICKET', { 
        ticketId: selectedTicket.id, 
        data, 
        timestamp: new Date() 
      });
      
      const response = await fetch(`/api/admin/support/${selectedTicket.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          assignedTo: data.assignedTo ? parseInt(data.assignedTo) : null,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to update support ticket');
      
      const updatedTicket = await response.json();
      
      console.log('✅ SUPPORT_TICKET_UPDATED', { 
        ticketId: updatedTicket.id, 
        timestamp: new Date() 
      });
      
      toast({
        title: "Ticket Updated",
        description: "Support ticket updated successfully.",
      });
      
      setIsUpdateOpen(false);
      setSelectedTicket(null);
      updateForm.reset();
      fetchTickets();
      fetchStats();
    } catch (error: any) {
      console.error('❌ UPDATE_SUPPORT_TICKET_ERROR', { error: error.message });
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in_progress': return 'default';
      case 'resolved': return 'secondary';
      default: return 'secondary';
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [searchTerm, statusFilter, priorityFilter]);

  useEffect(() => {
    if (selectedTicket) {
      updateForm.reset({
        status: selectedTicket.status,
        priority: selectedTicket.priority,
        assignedTo: selectedTicket.assignedTo?.toString() || '',
        resolution: '',
      });
    }
  }, [selectedTicket, updateForm]);

  return (
    <div className="space-y-6">
      {/* Support Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.openTickets || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inProgressTickets || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.resolvedTickets || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution (hrs)</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.avgResolutionTimeHours ? stats.avgResolutionTimeHours.toFixed(1) : '0'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Support Tickets</CardTitle>
              <CardDescription>Manage customer support tickets and track resolution progress</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchTickets} variant="outline" disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Ticket
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Support Ticket</DialogTitle>
                    <DialogDescription>
                      Create a new support ticket for a tenant
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...createForm}>
                    <form onSubmit={createForm.handleSubmit(createTicket)} className="space-y-4">
                      <FormField
                        control={createForm.control}
                        name="tenantId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tenant ID</FormLabel>
                            <FormControl>
                              <Input placeholder="tenant-subdomain" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createForm.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <FormControl>
                              <Input placeholder="Brief description of the issue" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Detailed description of the issue" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createForm.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Create Ticket</Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tickets Table */}
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">#{ticket.id}</TableCell>
                    <TableCell>{ticket.tenantId}</TableCell>
                    <TableCell className="max-w-xs truncate">{ticket.subject}</TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(ticket.status)}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setIsUpdateOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Update Ticket Dialog */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Support Ticket</DialogTitle>
            <DialogDescription>
              Update ticket #{selectedTicket?.id} - {selectedTicket?.subject}
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <Form {...updateForm}>
              <form onSubmit={updateForm.handleSubmit(updateTicket)} className="space-y-4">
                <FormField
                  control={updateForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={updateForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={updateForm.control}
                  name="resolution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resolution Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Resolution details (required for resolved status)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsUpdateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Ticket</Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}