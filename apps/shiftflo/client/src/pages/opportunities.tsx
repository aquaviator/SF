import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRole } from "@/hooks/useRole";
import { DataTable, Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Clock, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Shift } from "@shared/schema";

export default function Opportunities() {
  const { tenantId, user } = useRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: opportunities = [], isLoading } = useQuery<Shift[]>({
    queryKey: ["/api/opportunities", tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/opportunities?tenantId=${tenantId}`);
      if (!res.ok) throw new Error("Failed to fetch opportunities");
      return res.json();
    },
  });

  // only keep “open” shifts on or after today
  const upcomingOpportunities = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return opportunities.filter(opp => {
      if (opp.status !== "open") return false;
      // parse YYYY-MM-DD into a Date at midnight
      const [y, m, d] = opp.date.split("-").map(Number);
      const shiftDate = new Date(y, m - 1, d);
      return shiftDate >= today;
    });
  }, [opportunities]);

  const [claimingIds, setClaimingIds] = useState<Set<number>>(new Set());

  const claimMutation = useMutation({
    mutationFn: async (id: number) => {
      setClaimingIds(s => new Set(s).add(id));
      return apiRequest("POST", `/api/opportunities/${id}/claim`, {
        tenantId,
        userId: user?.id!,
      });
    },
    onSuccess: (_, id) => {
      setClaimingIds(s => {
        const n = new Set(s); n.delete(id); return n;
      });
      toast({ title: "Success", description: "Opportunity claimed!" });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["/api/shifts", tenantId] });
    },
    onError: (err: Error, id) => {
      setClaimingIds(s => {
        const n = new Set(s); n.delete(id); return n;
      });
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const handleClaim = (opp: Shift) => claimMutation.mutate(opp.id);

  const columns: Column<Shift>[] = [
    {
      key: "datetime", header: "Date & Time", cell: o => (
        <div className="text-xs space-y-1">
          <div className="font-medium">{new Date(o.date).toLocaleDateString()}</div>
          <div className="text-gray-500">{o.startTime}–{o.endTime}</div>
        </div>
      )
    },
    {
      key: "role", header: "Position", cell: o => (
        <div className="text-sm font-medium truncate max-w-[120px]">{o.role}</div>
      )
    },
    {
      key: "location", header: "Location", cell: o => (
        <div className="text-xs text-gray-600 truncate max-w-[100px]">{o.location}</div>
      )
    },
    {
      key: "status", header: "Status", cell: o => (
        <Badge variant="default" className="text-xs px-2 py-1">
          Available
        </Badge>
      )
    },
    {
      key: "actions", header: "Actions", cell: o => (
        <Button
          size="sm"
          disabled={claimingIds.has(o.id)}
          onClick={() => handleClaim(o)}
          className="text-xs px-3 py-1 h-8"
        >
          {claimingIds.has(o.id) ? "Claiming…" : "Claim"}
        </Button>
      )
    },
  ];

  return (
    <div className="space-y-6">
      {/* header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Shift Opportunities</h2>
        <p className="text-gray-600">Find and claim upcoming shifts</p>
      </div>

      {/* stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center">
          <Search className="w-5 h-5 text-blue-600 bg-blue-100 p-2 rounded-lg"/>
          <div className="ml-3">
            <p className="text-sm text-gray-600">Available</p>
            <p className="text-lg font-semibold text-gray-900">{upcomingOpportunities.length}</p>
            <p className="text-xs text-gray-500 mt-1">Open shifts you can claim</p>
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-4 flex items-center">
          <Clock className="w-5 h-5 text-green-600 bg-green-100 p-2 rounded-lg"/>
          <div className="ml-3">
            <p className="text-sm text-gray-600">This Week</p>
            <p className="text-lg font-semibold text-gray-900">
              {upcomingOpportunities.filter(o => {
                const d = new Date(o.date);
                const now = new Date();
                const weekAhead = new Date();
                weekAhead.setDate(now.getDate() + 7);
                return d >= now && d <= weekAhead;
              }).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Within next 7 days</p>
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-4 flex items-center">
          <DollarSign className="w-5 h-5 text-yellow-600 bg-yellow-100 p-2 rounded-lg"/>
          <div className="ml-3">
            <p className="text-sm text-gray-600">Applications</p>
            <p className="text-lg font-semibold text-gray-900">0</p>
            <p className="text-xs text-gray-500 mt-1">Your pending applications</p>
          </div>
        </CardContent></Card>
      </div>

      {/* desktop table */}
      <div className="hidden md:block">
        <DataTable
          data={upcomingOpportunities}
          columns={columns}
          title="Available Opportunities"
          isLoading={isLoading}
          emptyState={
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No upcoming opportunities</p>
            </div>
          }
        />
      </div>

      {/* mobile cards */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-gray-200 animate-pulse">
              <CardContent className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-8 bg-gray-200 rounded w-full" />
              </CardContent>
            </Card>
          ))
        ) : upcomingOpportunities.length === 0 ? (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No upcoming opportunities</p>
          </div>
        ) : (
          upcomingOpportunities.map(o => (
            <Card key={o.id} className="border-gray-200">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{o.role}</h3>
                    <p className="text-sm text-gray-600">{o.location}</p>
                  </div>
                  <Badge className="text-xs">Available</Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <div>📅 {new Date(o.date).toLocaleDateString()}</div>
                  <div>🕐 {o.startTime} – {o.endTime}</div>
                </div>
                {o.description && <p className="text-sm text-gray-600">{o.description}</p>}
                <Button
                  size="sm"
                  onClick={() => handleClaim(o)}
                  disabled={claimingIds.has(o.id)}
                  className="w-full min-h-[44px]"
                >
                  {claimingIds.has(o.id) ? "Claiming…" : "Claim"}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
