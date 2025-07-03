import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "owner" | "staff";

interface AuthContextType {
  role: UserRole;
  tenantId: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    tenantId: string;
  } | null;
  switchRole: (role: UserRole) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [role, setRole] = useState<UserRole>("owner");
  const [tenantId] = useState("acme-corp"); // Stubbed tenant ID
  const [user, setUser] = useState<{
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    tenantId: string;
  } | null>(null);

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem("dev-role", newRole);
  };

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/users/1'); // Fixed user ID for demo
        if (response.ok) {
          const userData = await response.json();
          setUser({
            id: userData.id,
            firstName: userData.firstName || "User",
            lastName: userData.lastName || "",
            email: userData.email || "user@example.com",
            tenantId: userData.tenantId || "acme-corp"
          });
        } else {
          // Fallback to default user if API fails
          setUser({
            id: 1,
            firstName: "Demo",
            lastName: "User",
            email: "demo@acme-corp.com",
            tenantId: "acme-corp"
          });
        }
      } catch (error) {
        console.log("User data fetch failed, using fallback");
        setUser({
          id: "1",
          firstName: "Demo", 
          lastName: "User",
          email: "demo@acme-corp.com"
        });
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const savedRole = localStorage.getItem("dev-role") as UserRole;
    if (savedRole && (savedRole === "owner" || savedRole === "staff")) {
      setRole(savedRole);
    }
  }, []);

  const value: AuthContextType = {
    role,
    tenantId,
    user,
    switchRole,
    isAuthenticated: true, // Always authenticated in stub mode
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
