import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Search, Calendar, Users, CheckCircle, XCircle, Clock, AlertCircle, Bell } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface HolidayRequest {
  id: number;
  requesterId: number;
  tenantId: string;
  type: "vacation" | "sick" | "personal";
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  // User details (may not be present)
  firstName?: string;
  lastName?: string;
  name?: string;
}

interface SwapRequest {
  id: number;
  requestingUserId: number;
  tenantId: string;
  originalShiftId: number;
  targetShiftId: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
  // User details
  requestingUserName: string;
  originalShiftDate: string;
  targetShiftDate: string;
}

export default function OwnerRequestsPage() {
  const [filterText, setFilterText] = useState("");
  const [selectedTab, setSelectedTab] = useState("holiday");
  const queryClient = useQueryClient();
  const { tenantId } = useAuth();

  console.log("OWNER REQUESTS: Loading requests dashboard...");

  // Fetch holiday requests
  const { data: holidayRequests = [], isLoading: holidayLoading } = useQuery({
    queryKey: ["/api/holiday-requests", tenantId],
    queryFn: () => fetch(`/api/holiday-requests?tenantId=${tenantId}`).then(res => res.json()),
    select: (data: any[]) => {
      console.log("OWNER REQUESTS: holiday requests data →", data);
      return data.map((req: any) => ({
        ...req,
        name: req.firstName && req.lastName 
          ? `${req.firstName} ${req.lastName}` 
          : `User ${req.requesterId}`,
      }));
    },
    enabled: !!tenantId,
  });

  // Fetch swap requests
  const { data: swapRequests = [], isLoading: swapLoading } = useQuery({
    queryKey: ["/api/swap-requests", tenantId],
    queryFn: () => fetch(`/api/swap-requests?tenantId=${tenantId}`).then(res => res.json()),
    select: (data: any[]) => {
      console.log("OWNER REQUESTS: swap requests data →", data);
      return data;
    },
    enabled: !!tenantId,
  });

  // Filter requests based on search
  const filteredHolidayRequests = holidayRequests.filter((req: HolidayRequest) =>
    (req.name || "").toLowerCase().includes(filterText.toLowerCase()) ||
    req.type.toLowerCase().includes(filterText.toLowerCase()) ||
    req.reason.toLowerCase().includes(filterText.toLowerCase())
  );

  const filteredSwapRequests = swapRequests.filter((req: SwapRequest) =>
    req.requestingUserName.toLowerCase().includes(filterText.toLowerCase()) ||
    req.reason.toLowerCase().includes(filterText.toLowerCase())
  );

  // Mutations for holiday request actions
  const holidayActionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: "approve" | "reject" }) => {
      console.log(`OWNER REQUESTS: ${action}ing holiday request ${id}`);
      const status = action === "approve" ? "approved" : "rejected";
      return apiRequest("PUT", `/api/holiday-requests/${id}`, { status });
    },
    onSuccess: (data, variables) => {
      console.log(`OWNER REQUESTS: holiday request ${variables.action}d successfully`);
      queryClient.invalidateQueries({ queryKey: ["/api/holiday-requests"] });
      toast({
        title: `Request ${variables.action}d`,
        description: `Holiday request has been ${variables.action}d successfully.`,
      });
    },
    onError: (error) => {
      console.error("OWNER REQUESTS: Error updating holiday request:", error);
      toast({
        title: "Error",
        description: "Failed to update holiday request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutations for swap request actions
  const swapActionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: "approve" | "reject" }) => {
      console.log(`OWNER REQUESTS: ${action}ing swap request ${id}`);
      const status = action === "approve" ? "approved" : "rejected";
      return apiRequest("PUT", `/api/swap-requests/${id}`, { status });
    },
    onSuccess: (data, variables) => {
      console.log(`OWNER REQUESTS: swap request ${variables.action}d successfully`);
      queryClient.invalidateQueries({ queryKey: ["/api/swap-requests"] });
      toast({
        title: `Request ${variables.action}d`,
        description: `Swap request has been ${variables.action}d successfully.`,
      });
    },
    onError: (error) => {
      console.error("OWNER REQUESTS: Error updating swap request:", error);
      toast({
        title: "Error",
        description: "Failed to update swap request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleHolidayAction = (id: number, action: "approve" | "reject") => {
    holidayActionMutation.mutate({ id, action });
  };

  const handleSwapAction = (id: number, action: "approve" | "reject") => {
    swapActionMutation.mutate({ id, action });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case "vacation":
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case "sick":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "personal":
        return <Users className="w-4 h-4 text-purple-500" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-500" />;
    }
  };

  const pendingHolidayCount = holidayRequests.filter(req => req.status === "pending").length;
  const pendingSwapCount = swapRequests.filter(req => req.status === "pending").length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none p-4 border-b">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-bold">Staff Requests</h1>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {pendingHolidayCount + pendingSwapCount} pending
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search requests..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
            <TabsTrigger value="holiday" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Holiday Requests
              {pendingHolidayCount > 0 && (
                <Badge variant="destructive" className="ml-1 px-1 py-0 text-xs">
                  {pendingHolidayCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="swap" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Swap Requests
              {pendingSwapCount > 0 && (
                <Badge variant="destructive" className="ml-1 px-1 py-0 text-xs">
                  {pendingSwapCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="holiday" className="flex-1 overflow-y-auto p-4 space-y-4">
            {holidayLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-sm text-gray-500">Loading holiday requests...</div>
              </div>
            ) : filteredHolidayRequests.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {filterText ? "No holiday requests match your search." : "No holiday requests found."}
                </p>
              </div>
            ) : (
              filteredHolidayRequests.map((request: HolidayRequest) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getRequestTypeIcon(request.type)}
                        <div>
                          <CardTitle className="text-lg">{request.name || `User ${request.requesterId}`}</CardTitle>
                          <p className="text-sm text-gray-500 capitalize">{request.type} Request</p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Dates</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(request.startDate), "MMM d, yyyy")} - {format(new Date(request.endDate), "MMM d, yyyy")}
                        </p>
                        <p className="text-sm text-gray-500">
                          {Math.ceil((new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Requested</p>
                        <p className="text-sm text-gray-600">{format(new Date(request.createdAt), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                    
                    {request.reason && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-1">Reason</p>
                        <p className="text-sm text-gray-600">{request.reason}</p>
                      </div>
                    )}

                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleHolidayAction(request.id, "approve")}
                          disabled={holidayActionMutation.isPending}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleHolidayAction(request.id, "reject")}
                          disabled={holidayActionMutation.isPending}
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="swap" className="flex-1 overflow-y-auto p-4 space-y-4">
            {swapLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-sm text-gray-500">Loading swap requests...</div>
              </div>
            ) : filteredSwapRequests.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {filterText ? "No swap requests match your search." : "No swap requests found."}
                </p>
              </div>
            ) : (
              filteredSwapRequests.map((request: SwapRequest) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-purple-500" />
                        <div>
                          <CardTitle className="text-lg">{request.requestingUserName}</CardTitle>
                          <p className="text-sm text-gray-500">Shift Swap Request</p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Original Shift</p>
                        <p className="text-sm text-gray-600">{request.originalShiftDate}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Target Shift</p>
                        <p className="text-sm text-gray-600">{request.targetShiftDate}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Requested</p>
                      <p className="text-sm text-gray-600">{format(new Date(request.createdAt), "MMM d, yyyy")}</p>
                    </div>

                    {request.reason && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-1">Reason</p>
                        <p className="text-sm text-gray-600">{request.reason}</p>
                      </div>
                    )}

                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSwapAction(request.id, "approve")}
                          disabled={swapActionMutation.isPending}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleSwapAction(request.id, "reject")}
                          disabled={swapActionMutation.isPending}
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}