
/**
 * Centralized role detection hook to ensure consistent role determination
 * across all navigation components and pages
 */
export function useRole() {
  
  // Always extract role from user object with 'staff' fallback
  const role = user?.role || 'staff';
  const tenantId = user?.tenantId;
  // Debug logging for role detection troubleshooting
  console.log('🔑 ROLE_DETECTION:', { 
    userId: user?.id,
    username: user?.username,
    role: role, 
    userRole: user?.role,
    tenantId: tenantId,
    isAuthenticated: isAuthenticated,
    isLoading: isLoading
  });
  return {
    role,
    tenantId,
    user,
    isLoading,
    isAuthenticated,
    isOwner: role === 'owner',
    isStaff: role === 'staff'
  };
}
