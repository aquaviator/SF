import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  role: 'owner' | 'staff';
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  photoUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already authenticated on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await apiRequest('GET', '/api/auth/me');
      const userData = await response.json();
      console.log('✅ AUTH_CHECK_SUCCESS', userData);
      setUser(userData);
    } catch (error) {
      // For development, fall back to hardcoded user based on replit.md
      console.log('❌ AUTH_CHECK_FAILED', error);
      
      // Development fallback - Andy Clarke from dialabeer tenant
      if (process.env.NODE_ENV === 'development') {
        const developmentUser: User = {
          id: 83,
          username: 'leatfield+x@gmail.com',
          email: 'leatfield+x@gmail.com',
          firstName: 'Andy',
          lastName: 'Clarke',
          role: 'owner',
          tenantId: 'dialabeer',
          isActive: true
        };
        console.log('🔧 DEVELOPMENT_FALLBACK_USER', developmentUser);
        setUser(developmentUser);
      } else {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const response = await apiRequest('POST', '/api/auth/login', {
        email,
        password
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}