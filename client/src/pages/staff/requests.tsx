import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Clock, Check, X, MapPin, FileText, Briefcase, Bell } from "lucide-react";
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
    if (tab && ['holiday', 'work'].includes(tab)) {
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

  const pendingWorkCount = workAssignments.length;
  const pendingHolidayCount = holidayRequests.filter((req: any) => req.status === 'pending').length;

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
          <TabsList className="grid w-full grid-cols-2">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}