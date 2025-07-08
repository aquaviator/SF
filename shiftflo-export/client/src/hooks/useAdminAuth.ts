import { useState, useEffect, createContext, useContext } from 'react';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  is2faEnabled: boolean;
  lastLogin?: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; require2fa?: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

export function createAdminAuthHook() {
  return function useAdminAuthState(): AdminAuthContextType {
    const [admin, setAdmin] = useState<AdminUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/me', {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.admin && !data.require2fa) {
            setAdmin(data.admin);
            console.log('🔐 ADMIN_AUTH_SUCCESS', { username: data.admin.username, role: data.admin.role });
          } else {
            setAdmin(null);
            console.log('🔐 ADMIN_AUTH_PENDING_2FA');
          }
        } else {
          setAdmin(null);
          console.log('🔐 ADMIN_AUTH_FAILED', { status: response.status });
        }
      } catch (error) {
        console.error('🔐 ADMIN_AUTH_ERROR', { error });
        setAdmin(null);
      } finally {
        setIsLoading(false);
      }
    };

    const login = async (username: string, password: string) => {
      try {
        console.log('🔐 ADMIN_LOGIN_ATTEMPT', { username });
        
        const response = await fetch('/api/admin/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
          if (data.require2fa) {
            console.log('🔐 ADMIN_LOGIN_REQUIRES_2FA', { username });
            return { success: true, require2fa: true };
          } else {
            setAdmin(data.admin);
            console.log('✅ ADMIN_LOGIN_SUCCESS', { username: data.admin.username, role: data.admin.role });
            return { success: true };
          }
        } else {
          console.log('❌ ADMIN_LOGIN_FAILED', { username, error: data.message });
          return { success: false, error: data.message };
        }
      } catch (error) {
        console.error('❌ ADMIN_LOGIN_ERROR', { error });
        return { success: false, error: 'Login failed' };
      }
    };

    const logout = async () => {
      try {
        console.log('🚪 ADMIN_LOGOUT_ATTEMPT');
        
        await fetch('/api/admin/logout', {
          method: 'POST',
          credentials: 'include'
        });
        
        setAdmin(null);
        console.log('✅ ADMIN_LOGOUT_SUCCESS');
      } catch (error) {
        console.error('❌ ADMIN_LOGOUT_ERROR', { error });
        // Still clear local state even if logout request fails
        setAdmin(null);
      }
    };

    useEffect(() => {
      checkAuth();
    }, []);

    return {
      admin,
      isLoading,
      isAuthenticated: !!admin,
      login,
      logout,
      checkAuth
    };
  };
}

export { AdminAuthContext };