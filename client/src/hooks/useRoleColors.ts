import { useQuery } from "@tanstack/react-query";
import { getRoleColorFromLegend, getRoleDotColorFromLegend, getRoleLegendColorFromLegend } from "@/utils/roleColors";

interface DatabaseRole {
  id: number;
  title: string;
  tenantId: string;
  legendLabel?: string | null;
  legendColor?: string | null;
  legendIcon?: string | null;
}
export function useRoleColors() {
  
  // Fetch job roles with legend data
  const { data: jobRoles = [], isLoading } = useQuery<DatabaseRole[]>({
    queryKey: ["/api/job-roles", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/job-roles?tenantId=${tenantId}`);
      if (!response.ok) throw new Error("Failed to fetch job roles");
      return response.json();
    },
    enabled: !!tenantId,
  });
  // Create role-to-color mapping
  const roleColorMap = jobRoles.reduce((map, role) => {
    const legendColor = role.legendColor || 'slate';
    map[role.title] = {
      badge: getRoleColorFromLegend(legendColor),
      dot: getRoleDotColorFromLegend(legendColor),
      legend: getRoleLegendColorFromLegend(legendColor),
      label: role.legendLabel || role.title,
      initial: (role.legendLabel || role.title).charAt(0).toUpperCase()
    };
    return map;
  }, {} as Record<string, { badge: string; dot: string; legend: string; label: string; initial: string }>);
  // Helper functions that use the database mapping
  const getRoleColorByTitle = (roleTitle: string): string => {
    return roleColorMap[roleTitle]?.badge || getRoleColorFromLegend('slate');
  };
  const getRoleDotColorByTitle = (roleTitle: string): string => {
    return roleColorMap[roleTitle]?.dot || getRoleDotColorFromLegend('slate');
  const getRoleLegendColorByTitle = (roleTitle: string): string => {
    return roleColorMap[roleTitle]?.legend || getRoleLegendColorFromLegend('slate');
  const getRoleLabelByTitle = (roleTitle: string): string => {
    return roleColorMap[roleTitle]?.label || roleTitle;
  const getRoleInitialByTitle = (roleTitle: string): string => {
    return roleColorMap[roleTitle]?.initial || roleTitle.charAt(0).toUpperCase();
  return {
    jobRoles,
    roleColorMap,
    isLoading,
    getRoleColorByTitle,
    getRoleDotColorByTitle,
    getRoleLegendColorByTitle,
    getRoleLabelByTitle,
    getRoleInitialByTitle
