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
  switchStaff: (staffId: number) => void;
  currentStaffId: number;
  isAuthenticated: boolean;
  refreshUserData: () => void;
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
  const [tenantId] = useState("template-business"); // Clean template tenant
  const [currentStaffId, setCurrentStaffId] = useState<number>(() => {
    return parseInt(localStorage.getItem("dev-staff-id") || "17");
  });
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

  const switchStaff = (staffId: number) => {
    setCurrentStaffId(staffId);
    localStorage.setItem("dev-staff-id", staffId.toString());
    // If currently in staff mode, fetch new staff data
    if (role === "staff") {
      fetchUserDataForRole(role);
    }
  };

  // Fetch user data based on role
  const fetchUserDataForRole = async (userRole: UserRole) => {
    try {
      // Owner: Business Owner (ID: 16), Staff: Use currentStaffId for demo staff user
      const userId = userRole === "owner" ? 16 : currentStaffId;
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        console.log("Profile data loaded:", userData);
        setUser({
          id: userData.id,
          firstName: userData.firstName || "User",
          lastName: userData.lastName || "",
          email: userData.email || "user@example.com",
          tenantId: userData.tenantId || "template-business"
        });
      } else {
        // Fallback based on role
        const staffNames = [
          { id: 2, firstName: "Mike", lastName: "Chen", email: "mike.chen@acme-corp.com" },
          { id: 3, firstName: "Emma", lastName: "Davis", email: "emma.davis@acme-corp.com" },
          { id: 4, firstName: "Alex", lastName: "Martinez", email: "alex.martinez@acme-corp.com" },
          { id: 5, firstName: "Jamie", lastName: "Wilson", email: "jamie.wilson@acme-corp.com" },
          { id: 6, firstName: "Taylor", lastName: "Brown", email: "taylor.brown@acme-corp.com" },
        ];
        
        if (userRole === "owner") {
          setUser({
            id: 16,
            firstName: "Business",
            lastName: "Owner",
            email: "owner@template-business.com",
            tenantId: "template-business"
          });
        } else {
          const staffData = staffNames.find(s => s.id === currentStaffId) || staffNames[0];
          setUser({
            id: staffData.id,
            firstName: staffData.firstName,
            lastName: staffData.lastName,
            email: staffData.email,
            tenantId: "template-business"
          });
        }
      }
    } catch (error) {
      console.log("User data fetch failed, using fallback for role:", userRole);
      setUser({
        id: userRole === "owner" ? 16 : 17,
        firstName: userRole === "owner" ? "Business" : "Alice",
        lastName: userRole === "owner" ? "Owner" : "Johnson",
        email: userRole === "owner" ? "owner@template-business.com" : "alice@template-business.com",
        tenantId: "template-business"
      });
    }
  };

  // Initialize role and user data
  useEffect(() => {
    const savedRole = localStorage.getItem("dev-role") as UserRole;
    const initialRole = (savedRole && (savedRole === "owner" || savedRole === "staff")) ? savedRole : "owner";
    setRole(initialRole);
    fetchUserDataForRole(initialRole);
  }, [currentStaffId]);

  // Function to refresh current user data
  const refreshUserData = () => {
    fetchUserDataForRole(role);
  };

  const value: AuthContextType = {
    role,
    tenantId,
    user,
    switchRole,
    switchStaff,
    currentStaffId,
    isAuthenticated: true, // Always authenticated in stub mode
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
