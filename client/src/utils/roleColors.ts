// Database-driven role color mapping for consistent colors across all components

export interface RoleColorConfig {
  legend: string;  // Color for legend dots
  badge: string;   // Color for desktop badges  
  dot: string;     // Color for mobile dots
}
// Color scheme mapping based on database legend_color values
export const colorSchemes: Record<string, RoleColorConfig> = {
  "green": {
    legend: "bg-green-400",
    badge: "bg-green-100 border-green-300 text-green-800",
    dot: "bg-green-500"
  },
  "blue": {
    legend: "bg-blue-400", 
    badge: "bg-blue-100 border-blue-300 text-blue-800",
    dot: "bg-blue-500"
  "yellow": {
    legend: "bg-yellow-400",
    badge: "bg-yellow-100 border-yellow-300 text-yellow-800",
    dot: "bg-yellow-500"
  "purple": {
    legend: "bg-purple-400",
    badge: "bg-purple-100 border-purple-300 text-purple-800",
    dot: "bg-purple-500"
  "indigo": {
    legend: "bg-indigo-400",
    badge: "bg-indigo-100 border-indigo-300 text-indigo-800",
    dot: "bg-indigo-500"
  "orange": {
    legend: "bg-orange-400",
    badge: "bg-orange-100 border-orange-300 text-orange-800",
    dot: "bg-orange-500"
  "gray": {
    legend: "bg-gray-400",
    badge: "bg-gray-100 border-gray-300 text-gray-800",
    dot: "bg-gray-500"
  "slate": {
    legend: "bg-slate-400",
    badge: "bg-slate-100 border-slate-300 text-slate-800",
    dot: "bg-slate-500"
  }
};
// Helper functions that use role data with legend_color
export const getRoleColorFromLegend = (legendColor: string): string => {
  const config = colorSchemes[legendColor] || colorSchemes["slate"];
  return config.badge;
export const getRoleDotColorFromLegend = (legendColor: string): string => {
  return config.dot;
export const getRoleLegendColorFromLegend = (legendColor: string): string => {
  return config.legend;
// Legacy compatibility functions (use role title for lookup)
export const getRoleColor = (role: string): string => {
  // Fallback to default mapping if no database lookup available
  const fallbackMap: Record<string, string> = {
    "Chef": "green",
    "Bar Staff": "blue",
    "Bartender": "blue",
    "Security": "yellow",
    "Supervisor": "purple",
    "Manager": "purple",
    "Server": "indigo",
    "Driver": "orange",
    "Warehouse Clerk": "gray"
  };
  
  const legendColor = fallbackMap[role] || "slate";
  return getRoleColorFromLegend(legendColor);
export const getRoleDotColor = (role: string): string => {
    "Bar Staff": "blue", 
  return getRoleDotColorFromLegend(legendColor);
export const getRoleLegendColor = (role: string): string => {
    "Bartender": "blue", 
  return getRoleLegendColorFromLegend(legendColor);
