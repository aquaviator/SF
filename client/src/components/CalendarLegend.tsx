import React from "react";

interface LegendItem {
  role: string;
  color: string;
  bgClass: string;
}

const ROLE_LEGEND: LegendItem[] = [
  { role: "Chef", color: "green", bgClass: "bg-green-400" },
  { role: "Bar Staff", color: "blue", bgClass: "bg-blue-400" },
  { role: "Security", color: "yellow", bgClass: "bg-yellow-400" },
  { role: "Supervisor", color: "purple", bgClass: "bg-purple-400" },
];

interface CalendarLegendProps {
  className?: string;
}

export function CalendarLegend({ className = "" }: CalendarLegendProps) {
  return (
    <div className={`p-4 bg-slate-50 rounded-lg shadow-sm border border-slate-200 ${className}`}>
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-slate-700 mr-2">Roles:</span>
        {ROLE_LEGEND.map((item) => (
          <div key={item.role} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${item.bgClass}`} />
            <span className="text-xs text-slate-600 whitespace-nowrap">
              {item.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CalendarLegend;