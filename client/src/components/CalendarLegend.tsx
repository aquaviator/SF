import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

// Role color mapping - matches CalendarView colors
const roleColorMap: Record<string, { dot: string; display: string }> = {
  "Chef": { dot: "bg-green-400", display: "bg-green-100 border-green-300 text-green-800" },
  "Bar Staff": { dot: "bg-blue-400", display: "bg-blue-100 border-blue-300 text-blue-800" },
  "Bartender": { dot: "bg-blue-400", display: "bg-blue-100 border-blue-300 text-blue-800" },
  "Security": { dot: "bg-yellow-400", display: "bg-yellow-100 border-yellow-300 text-yellow-800" },
  "Supervisor": { dot: "bg-purple-400", display: "bg-purple-100 border-purple-300 text-purple-800" },
  "Manager": { dot: "bg-purple-400", display: "bg-purple-100 border-purple-300 text-purple-800" },
  "Server": { dot: "bg-indigo-400", display: "bg-indigo-100 border-indigo-300 text-indigo-800" },
  "Driver": { dot: "bg-orange-400", display: "bg-orange-100 border-orange-300 text-orange-800" },
  "Warehouse Clerk": { dot: "bg-gray-400", display: "bg-gray-100 border-gray-300 text-gray-800" },
  "default": { dot: "bg-slate-400", display: "bg-slate-100 border-slate-300 text-slate-800" }
};

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
          const colorConfig = roleColorMap[role.title] || roleColorMap["default"];
          return (
            <div key={role.id} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colorConfig.dot}`} />
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