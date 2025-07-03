import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable, Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Clock, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Shift } from "@shared/schema";

export default function Opportunities() {
  const { tenantId, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: opportunities, isLoading } = useQuery<Shift[]>({
    queryKey: ["/api/opportunities", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/opportunities?tenantId=${tenantId}`);
      if (!response.ok) throw new Error("Failed to fetch opportunities");
      return response.json();
    },
  });

  const [claimingIds, setClaimingIds] = useState<Set<number>>(new Set());

  const claimMutation = useMutation({
    mutationFn: async (opportunityId: number) => {
      setClaimingIds(prev => new Set(prev).add(opportunityId));
      return apiRequest("POST", `/api/opportunities/${opportunityId}/claim`, {
        tenantId,
        userId: parseInt(user?.id || "1"),
      });
    },
    onSuccess: (_, opportunityId) => {
      setClaimingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(opportunityId);
        return newSet;
      });
      toast({
        title: "Success",
        description: "Opportunity claimed successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["/api/shifts", tenantId] });
    },
    onError: (error: Error, opportunityId) => {
      setClaimingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(opportunityId);
        return newSet;
      });
      toast({
        title: "Error",
        description: error.message || "Failed to claim opportunity",
        variant: "destructive",
      });
    },
  });

  const handleClaim = (opportunity: Shift) => {
    claimMutation.mutate(opportunity.id);
  };

  const columns: Column<Shift>[] = [
    {
      key: "date",
      header: "Date",
      cell: (opportunity) => new Date(opportunity.date).toLocaleDateString(),
    },
    {
      key: "role",
      header: "Position",
      cell: (opportunity) => opportunity.role,
    },
    {
      key: "location",
      header: "Location",
      cell: (opportunity) => opportunity.location,
    },
    {
      key: "timeSlot",
      header: "Time",
      cell: (opportunity) => `${opportunity.startTime} - ${opportunity.endTime}`,
    },
    {
      key: "description",
      header: "Description",
      cell: (opportunity) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {opportunity.description}
          </div>
          {opportunity.notes && (
            <div className="text-sm text-gray-500 mt-1">
              {opportunity.notes}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (opportunity) => (
        <Badge variant={opportunity.status === "open" ? "default" : "secondary"}>
          {opportunity.status === "open" ? "Available" : "Closed"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (opportunity) => (
        <Button
          size="sm"
          onClick={() => handleClaim(opportunity)}
          disabled={opportunity.status !== "open" || claimingIds.has(opportunity.id)}
        >
          {claimingIds.has(opportunity.id) ? "Claiming..." : "Claim"}
        </Button>
      ),
    },
  ];

  const activeOpportunities = opportunities?.filter(opp => opp.status === "open") || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Shift Opportunities</h2>
        <p className="text-gray-600">Find and claim available shift opportunities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-lg font-semibold text-gray-900">{activeOpportunities.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-lg font-semibold text-gray-900">
                  {activeOpportunities.filter(opp => {
                    // This would need actual shift data to filter by date
                    return true;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Applications</p>
                <p className="text-lg font-semibold text-gray-900">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <DataTable
          data={opportunities || []}
          columns={columns}
          title="Available Opportunities"
          isLoading={isLoading}
          emptyState={
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No opportunities available</p>
              <p className="text-sm text-gray-400">Check back later for new openings</p>
            </div>
          }
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activeOpportunities.length === 0 ? (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No opportunities available</p>
            <p className="text-sm text-gray-400">Check back later for new openings</p>
          </div>
        ) : (
          activeOpportunities.map((opportunity) => (
            <Card key={opportunity.id} className="border border-gray-200">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{opportunity.role}</h3>
                    <p className="text-sm text-gray-600">{opportunity.location}</p>
                  </div>
                  <Badge 
                    variant={opportunity.status === "open" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {opportunity.status === "open" ? "Available" : "Closed"}
                  </Badge>
                </div>
                
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-4 mb-2">
                    <span>📅 {new Date(opportunity.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>🕐 {opportunity.startTime} - {opportunity.endTime}</span>
                  </div>
                </div>
                
                {opportunity.description && (
                  <p className="text-sm text-gray-600">{opportunity.description}</p>
                )}
                
                <div className="pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleClaim(opportunity)}
                    disabled={opportunity.status !== "open" || claimingIds.has(opportunity.id)}
                    className="w-full min-h-[44px]" // Ensure minimum touch target size
                  >
                    {claimingIds.has(opportunity.id) ? "Claiming..." : "Claim"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
