import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable, Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin } from "lucide-react";
import type { Shift } from "@shared/schema";

export default function MyShifts() {
  const { tenantId, user } = useAuth();
  
  const { data: shifts, isLoading } = useQuery<Shift[]>({
    queryKey: ["/api/my-shifts", tenantId, user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/my-shifts?tenantId=${tenantId}&userId=${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch shifts");
      return response.json();
    },
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      assigned: "bg-blue-100 text-blue-800",
      confirmed: "bg-green-100 text-green-800",
      conflict: "bg-red-100 text-red-800",
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const columns: Column<Shift>[] = [
    {
      key: "date",
      header: "Date & Time",
      cell: (shift) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {new Date(shift.date).toLocaleDateString()}
          </div>
          <div className="text-sm text-gray-500">
            {shift.startTime} - {shift.endTime}
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
    },
    {
      key: "status",
      header: "Status",
      cell: (shift) => getStatusBadge(shift.status),
    },
    {
      key: "notes",
      header: "Notes",
      cell: (shift) => (
        <div className="text-sm text-gray-600 max-w-xs truncate">
          {shift.notes || "No notes"}
        </div>
      ),
    },
  ];

  const upcomingShifts = shifts?.filter(shift => new Date(shift.date) >= new Date()) || [];
  const nextShift = upcomingShifts[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Shifts</h2>
        <p className="text-gray-600">View and manage your scheduled shifts</p>
      </div>

      {nextShift && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Next Shift
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">
                    {new Date(nextShift.date).toLocaleDateString()} at {nextShift.startTime}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{nextShift.role}</span>
                </div>
                {nextShift.notes && (
                  <p className="text-sm text-gray-600">{nextShift.notes}</p>
                )}
              </div>
              <div className="text-right">
                {getStatusBadge(nextShift.status)}
                {nextShift.status === "assigned" && (
                  <Button size="sm" className="ml-2">
                    Confirm
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable
        data={shifts || []}
        columns={columns}
        title="All My Shifts"
        isLoading={isLoading}
        emptyState={
          <div className="text-center py-8">
            <p className="text-gray-500">No shifts assigned</p>
            <p className="text-sm text-gray-400">Check back later for new assignments</p>
          </div>
        }
      />
    </div>
  );
}
