import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Clock, Check, X, MapPin, FileText, Briefcase, Bell, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function StaffRequests() {
  const { user, tenantId } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("holiday");

  // URL param handling for deep linking
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['holiday', 'work', 'swap'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  // Holiday requests query (existing functionality)
  const { data: holidayRequests = [], isLoading: holidayLoading } = useQuery({
    queryKey: ["/api/holiday-requests", tenantId, user?.id],
    queryFn: () => 
      fetch(`/api/holiday-requests?tenantId=${tenantId}&userId=${user?.id}&userRole=staff`)
        .then(res => res.json())
  });

  // Opportunities query - shifts available for claiming
  const { data: opportunities = [], isLoading: opportunitiesLoading } = useQuery({
    queryKey: ["/api/opportunities", tenantId, user?.id],
    queryFn: () => 
      fetch(`/api/opportunities?tenantId=${tenantId}&userId=${user?.id}`)
        .then(res => res.json())
  });

  // Swap requests query
  const { data: swapRequests = [], isLoading: swapLoading } = useQuery({
    queryKey: ["/api/swap-requests", tenantId, user?.id],
    queryFn: () => 
      fetch(`/api/swap-requests?tenantId=${tenantId}&userId=${user?.id}&userRole=staff`)
        .then(res => res.json())
  });

  // Pending assignments query (work requests)
  const { data: workAssignments = [], isLoading: workLoading } = useQuery({
    queryKey: ["/api/pending-assignments", tenantId, user?.id],
    queryFn: () => 
      fetch(`/api/pending-assignments?tenantId=${tenantId}&userId=${user?.id}`)
        .then(res => res.json())
  });

  // Assignment response mutation
  const assignmentResponseMutation = useMutation({
    mutationFn: async ({ shiftId, response }: { shiftId: number; response: "accept" | "decline" }) => {
      console.log("📋 ASSIGNMENT_RESPONSE", {
        shiftId,
        response,
        userId: user?.id,
        timestamp: new Date()
      });

      const submitData = {
        response,
        userId: user?.id,
        tenantId,
      };
      return apiRequest("POST", `/api/assignments/${shiftId}/respond`, submitData);
    },
    onSuccess: (result: any, variables) => {
      const action = variables.response === "accept" ? "accepted" : "declined";
      toast({ 
        title: `Assignment ${action} successfully!`,
        description: result.message
      });
      
      // Refresh assignments and invalidate related caches
      queryClient.invalidateQueries({ queryKey: ["/api/pending-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-shifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] });
    },
    onError: () => {
      toast({ title: "Failed to respond to assignment", variant: "destructive" });
    },
  });

  // Claim opportunity mutation
  const claimOpportunityMutation = useMutation({
    mutationFn: async (opportunityId: number) => {
      console.log("🎯 CLAIM_OPPORTUNITY", {
        opportunityId,
        userId: user?.id,
        timestamp: new Date()
      });
      return apiRequest("POST", `/api/opportunities/${opportunityId}/claim`, {
        userId: user?.id,
        tenantId,
      });
    },
    onSuccess: (result: any, opportunityId) => {
      toast({ 
        title: "Opportunity claimed successfully!",
        description: "The shift has been added to your schedule"
      });
      
      // Refresh opportunities and related caches
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-shifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] });
    },
    onError: () => {
      toast({ title: "Failed to claim opportunity", variant: "destructive" });
    },
  });

  const pendingWorkCount = workAssignments.length + opportunities.length;
  const pendingHolidayCount = holidayRequests.filter((req: any) => req.status === 'pending').length;
  const pendingSwapCount = swapRequests.filter((req: any) => req.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Requests</h1>
          <p className="text-muted-foreground">
            Manage your holiday requests and work assignments
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="holiday" className="relative">
              <Calendar className="h-4 w-4 mr-2" />
              Holiday
              {pendingHolidayCount > 0 && (
                <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs">
                  {pendingHolidayCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="work" className="relative">
              <Briefcase className="h-4 w-4 mr-2" />
              Work
              {pendingWorkCount > 0 && (
                <div className="flex items-center ml-2">
                  <Bell className="h-3 w-3 text-blue-500 animate-pulse mr-1" />
                  <Badge variant="default" className="bg-blue-500 px-1 py-0 text-xs">
                    {pendingWorkCount}
                  </Badge>
                </div>
              )}
            </TabsTrigger>
            <TabsTrigger value="swap" className="relative">
              <RefreshCw className="h-4 w-4 mr-2" />
              Swaps
              {pendingSwapCount > 0 && (
                <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                  {pendingSwapCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="holiday" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Holiday Requests
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your time-off requests and their approval status
                </p>
              </CardHeader>
              <CardContent>
                {holidayLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : holidayRequests.length > 0 ? (
                  <div className="space-y-4">
                    {holidayRequests.map((request: any) => (
                      <div 
                        key={request.id} 
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4" />
                              <h3 className="font-medium">{request.type}</h3>
                              <Badge variant={
                                request.status === 'approved' ? 'default' :
                                request.status === 'rejected' ? 'destructive' : 'secondary'
                              }>
                                {request.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>Requested {new Date(request.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            {request.reason && (
                              <p className="text-sm text-muted-foreground">
                                {request.reason}
                              </p>
                            )}
                            {request.reviewNotes && (
                              <div className="bg-muted p-2 rounded text-sm">
                                <strong>Review notes:</strong> {request.reviewNotes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2" />
                    <p>No holiday requests</p>
                    <p className="text-xs mt-1">Submit requests through My Work page</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="work" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Work Assignments
                  {pendingWorkCount > 0 && (
                    <Bell className="h-4 w-4 text-blue-500 animate-pulse ml-2" />
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Incoming shift assignments requiring your confirmation
                </p>
              </CardHeader>
              <CardContent>
                {workLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : workAssignments.length > 0 ? (
                  <div className="space-y-4">
                    {workAssignments.map((shift: any) => (
                      <div 
                        key={shift.id} 
                        className="border rounded-lg p-4 space-y-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                              <h3 className="font-semibold">{shift.role}</h3>
                              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                Assignment Pending
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(shift.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{shift.startTime} - {shift.endTime}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{shift.location}</span>
                              </div>
                            </div>
                            {shift.description && (
                              <p className="text-sm text-muted-foreground">{shift.description}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-3 pt-2 border-t">
                          <Button 
                            size="sm" 
                            onClick={() => assignmentResponseMutation.mutate({ 
                              shiftId: shift.id, 
                              response: "accept" 
                            })}
                            disabled={assignmentResponseMutation.isPending}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            {assignmentResponseMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Check className="h-3 w-3 mr-1" />
                            )}
                            Accept Assignment
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => assignmentResponseMutation.mutate({ 
                              shiftId: shift.id, 
                              response: "decline" 
                            })}
                            disabled={assignmentResponseMutation.isPending}
                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                          >
                            {assignmentResponseMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <X className="h-3 w-3 mr-1" />
                            )}
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Briefcase className="h-8 w-8 mx-auto mb-2" />
                    <p>No pending work assignments</p>
                    <p className="text-xs mt-1">New assignments will appear here for confirmation</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Opportunities Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Available Opportunities
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Extra shifts you can claim for additional work
                </p>
              </CardHeader>
              <CardContent>
                {opportunitiesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : opportunities.length > 0 ? (
                  <div className="space-y-4">
                    {opportunities.map((opportunity: any) => (
                      <div 
                        key={opportunity.id} 
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <h3 className="font-medium">{opportunity.role}</h3>
                              <Badge variant="outline">
                                opportunity
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(opportunity.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-3 w-3" />
                                <span>{opportunity.startTime} - {opportunity.endTime}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-3 w-3" />
                                <span>{opportunity.location}</span>
                              </div>
                            </div>
                            {opportunity.description && (
                              <p className="text-sm text-muted-foreground">
                                {opportunity.description}
                              </p>
                            )}
                          </div>
                          <Button
                            onClick={() => claimOpportunityMutation.mutate(opportunity.id)}
                            disabled={claimOpportunityMutation.isPending}
                            className="min-h-[44px]"
                          >
                            {claimOpportunityMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Check className="h-4 w-4 mr-2" />
                            )}
                            Claim Shift
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2" />
                    <p>No opportunities available</p>
                    <p className="text-xs mt-1">Extra shifts will appear here when available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="swap" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Shift Swap Requests
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage requests to swap shifts with other staff
                </p>
              </CardHeader>
              <CardContent>
                {swapLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : swapRequests.length > 0 ? (
                  <div className="space-y-4">
                    {swapRequests.map((swap: any) => (
                      <div 
                        key={swap.id} 
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <RefreshCw className="h-4 w-4" />
                              <h3 className="font-medium">Swap Request #{swap.id}</h3>
                              <Badge variant={swap.status === 'pending' ? 'secondary' : 
                                           swap.status === 'approved' ? 'default' : 'destructive'}>
                                {swap.status}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p><strong>Reason:</strong> {swap.reason || 'No reason provided'}</p>
                              <p><strong>Requested:</strong> {new Date(swap.createdAt || Date.now()).toLocaleDateString()}</p>
                            </div>
                            {swap.notes && (
                              <p className="text-sm text-muted-foreground">
                                <strong>Notes:</strong> {swap.notes}
                              </p>
                            )}
                          </div>
                          {swap.status === 'pending' && (
                            <Badge variant="secondary" className="animate-pulse">
                              Pending Review
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <RefreshCw className="h-8 w-8 mx-auto mb-2" />
                    <p>No swap requests</p>
                    <p className="text-xs mt-1">Shift swap requests will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}