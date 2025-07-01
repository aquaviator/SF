import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable, Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MapPin, Clock, DollarSign } from "lucide-react";
import type { Opportunity } from "@shared/schema";

export default function Opportunities() {
  const { tenantId } = useAuth();
  
  const { data: opportunities, isLoading } = useQuery<Opportunity[]>({
    queryKey: ["/api/opportunities", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/opportunities?tenantId=${tenantId}`);
      if (!response.ok) throw new Error("Failed to fetch opportunities");
      return response.json();
    },
  });

  const handleApply = (opportunity: Opportunity) => {
    // TODO: Implement apply logic
    console.log("Applying for opportunity:", opportunity.id);
  };

  const columns: Column<Opportunity>[] = [
    {
      key: "description",
      header: "Description",
      cell: (opportunity) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {opportunity.description}
          </div>
          {opportunity.requirements && (
            <div className="text-sm text-gray-500 mt-1">
              {opportunity.requirements}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      cell: (opportunity) => (
        <Badge variant={opportunity.isActive ? "default" : "secondary"}>
          {opportunity.isActive ? "Available" : "Closed"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (opportunity) => (
        <Button
          size="sm"
          onClick={() => handleApply(opportunity)}
          disabled={!opportunity.isActive}
        >
          Apply
        </Button>
      ),
    },
  ];

  const activeOpportunities = opportunities?.filter(opp => opp.isActive) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Shift Opportunities</h2>
        <p className="text-gray-600">Find and apply for available shifts</p>
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
                <p className="text-lg font-semibold text-gray-900">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
  );
}
