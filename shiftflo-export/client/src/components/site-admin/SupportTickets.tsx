import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle, 
  Search, 
  Filter,
  MessageSquare,
  CheckCircle,
  Clock,
  XCircle,
  Loader2
} from "lucide-react";

interface SupportTicket {
  id: number;
  tenantId: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  createdBy: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  resolutionNotes: string | null;
}

export function SupportTickets() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch support tickets
  const { data: tickets, isLoading } = useQuery<SupportTicket[]>({
    queryKey: ['/api/admin/support-tickets'],
    retry: false,
  });

  // Update ticket status mutation
  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, status, resolutionNotes }: { id: number; status: string; resolutionNotes?: string }) => {
      const response = await fetch(`/api/admin/support-tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, resolutionNotes }),
      });
      if (!response.ok) throw new Error('Failed to update ticket');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ticket Updated",
        description: "Support ticket status has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support-tickets'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed': return <XCircle className="h-4 w-4 text-gray-500" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in_progress': return 'default';
      case 'resolved': return 'secondary';
      case 'closed': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const filteredTickets = tickets?.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  }) || [];

  const handleUpdateStatus = (ticketId: number, newStatus: string) => {
    updateTicketMutation.mutate({ id: ticketId, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Support Ticket Management
        </CardTitle>
        <CardDescription>
          Manage customer support requests and resolution workflow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {filteredTickets.length > 0 ? (
            filteredTickets.map((ticket) => (
              <Card key={ticket.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(ticket.status)}
                      <span className="font-medium text-sm text-muted-foreground">#{ticket.id}</span>
                      <h3 className="font-medium">{ticket.subject}</h3>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {ticket.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline">{ticket.tenantId}</Badge>
                      <Badge variant={getStatusBadge(ticket.status)}>{ticket.status}</Badge>
                      <Badge variant={getPriorityBadge(ticket.priority)}>{ticket.priority}</Badge>
                      <span className="text-muted-foreground">
                        Created: {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {ticket.status === 'open' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUpdateStatus(ticket.id, 'in_progress')}
                        disabled={updateTicketMutation.isPending}
                      >
                        Start Progress
                      </Button>
                    )}
                    {ticket.status === 'in_progress' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                        disabled={updateTicketMutation.isPending}
                      >
                        Resolve
                      </Button>
                    )}
                    {ticket.status === 'resolved' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUpdateStatus(ticket.id, 'closed')}
                        disabled={updateTicketMutation.isPending}
                      >
                        Close
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {tickets?.length === 0 
                ? "No support tickets found" 
                : "No tickets match your current filters"
              }
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {tickets && tickets.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {tickets.filter(t => t.status === 'open').length}
              </p>
              <p className="text-sm text-muted-foreground">Open</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {tickets.filter(t => t.status === 'in_progress').length}
              </p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {tickets.filter(t => t.status === 'resolved').length}
              </p>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">
                {tickets.filter(t => t.status === 'closed').length}
              </p>
              <p className="text-sm text-muted-foreground">Closed</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}