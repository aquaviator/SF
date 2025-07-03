import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleLegendColor } from "@/utils/roleColors";

interface JobRole {
  id: number;
  title: string;
  tenantId: string;
}

interface CalendarLegendProps {
  className?: string;
}

export function CalendarLegend({ className = "" }: CalendarLegendProps) {
  const { tenantId } = useAuth();
  
  // Fetch job roles from the database
  const { data: jobRoles = [], isLoading } = useQuery<JobRole[]>({
    queryKey: ["/api/job-roles", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/job-roles?tenantId=${tenantId}`);
      if (!response.ok) throw new Error("Failed to fetch job roles");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className={`p-4 bg-slate-50 rounded-lg shadow-sm border border-slate-200 ${className}`}>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-700">Loading roles...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-slate-50 rounded-lg shadow-sm border border-slate-200 ${className}`}>
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-slate-700 mr-2">Roles:</span>
        {jobRoles.map((role) => {
          return (
            <div key={role.id} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getRoleLegendColor(role.title)}`} />
              <span className="text-xs text-slate-600 whitespace-nowrap">
                {role.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarLegend;