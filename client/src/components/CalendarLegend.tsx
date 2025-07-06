import React from "react";

interface CalendarLegendProps {
  className?: string;
}
export function CalendarLegend({ className = "" }: CalendarLegendProps) {
  const { jobRoles, isLoading, getRoleLegendColorByTitle, getRoleLabelByTitle } = useRoleColors();
  if (isLoading) {
    return (
      <div className={`p-4 bg-slate-50 rounded-lg shadow-sm border border-slate-200 ${className}`}>
        <div className="text-sm text-slate-500">Loading roles...</div>
      </div>
    );
  }
  if (jobRoles.length === 0) {
        <div className="text-sm text-slate-500">No roles configured</div>
  return (
    <div className={`p-4 bg-slate-50 rounded-lg shadow-sm border border-slate-200 ${className}`}>
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-slate-700 mr-2">Roles:</span>
        {jobRoles.map((role) => {
          return (
            <div key={role.id} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getRoleLegendColorByTitle(role.title)}`} />
              <span className="text-xs text-slate-600 whitespace-nowrap">
                {getRoleLabelByTitle(role.title)}
              </span>
            </div>
          );
        })}
    </div>
  );
