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
    // Fetch user data for the new role
    fetchUserDataForRole(newRole);
  };

  // Fetch user data based on role
  const fetchUserDataForRole = async (userRole: UserRole) => {
    try {
      // Owner: Sarah Johnson (ID: 1), Staff: Mike Chen (ID: 2) as demo staff user
      const userId = userRole === "owner" ? 1 : 2;
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        console.log("Profile data loaded:", userData);
        setUser({
          id: userData.id,
          firstName: userData.firstName || "User",
          lastName: userData.lastName || "",
          email: userData.email || "user@example.com",
          tenantId: userData.tenantId || "acme-corp"
        });
      } else {
        // Fallback based on role
        setUser({
          id: userRole === "owner" ? 1 : 2,
          firstName: userRole === "owner" ? "Sarah" : "Mike",
          lastName: userRole === "owner" ? "Johnson" : "Chen",
          email: userRole === "owner" ? "sarah@acme-corp.com" : "mike@acme-corp.com",
          tenantId: "acme-corp"
        });
      }
    } catch (error) {
      console.log("User data fetch failed, using fallback for role:", userRole);
      setUser({
        id: userRole === "owner" ? 1 : 2,
        firstName: userRole === "owner" ? "Sarah" : "Mike",
        lastName: userRole === "owner" ? "Johnson" : "Chen",
        email: userRole === "owner" ? "sarah@acme-corp.com" : "mike@acme-corp.com",
        tenantId: "acme-corp"
      });
    }
  };

  // Initialize role and user data
  useEffect(() => {
    const savedRole = localStorage.getItem("dev-role") as UserRole;
    const initialRole = (savedRole && (savedRole === "owner" || savedRole === "staff")) ? savedRole : "owner";
    setRole(initialRole);
    fetchUserDataForRole(initialRole);
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
