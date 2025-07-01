import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "owner" | "staff";

interface AuthContextType {
  role: UserRole;
  tenantId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
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
  const [user] = useState({
    id: "1",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@acme-corp.com",
  });

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem("dev-role", newRole);
  };

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
