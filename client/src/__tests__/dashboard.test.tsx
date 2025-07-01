import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Dashboard from "../pages/dashboard";
import { AuthProvider } from "../contexts/AuthContext";

const renderWithAuth = (role: "owner" | "staff" = "owner") => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>
      {children}
    </AuthProvider>
  );

  return render(
    <TestWrapper>
      <Dashboard />
    </TestWrapper>
  );
};

describe("Dashboard", () => {
  it("renders owner dashboard", () => {
    renderWithAuth("owner");
    
    expect(screen.getByText("Management Dashboard")).toBeInTheDocument();
    expect(screen.getByText("This Week")).toBeInTheDocument();
    expect(screen.getByText("Assigned")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Conflicts")).toBeInTheDocument();
  });

  it("renders staff dashboard", () => {
    renderWithAuth("staff");
    
    expect(screen.getByText("My Dashboard")).toBeInTheDocument();
    expect(screen.getByText("My Shifts")).toBeInTheDocument();
    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(screen.getByText("Requests")).toBeInTheDocument();
  });

  it("shows recent activity", () => {
    renderWithAuth();
    
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    expect(screen.getByText("Upcoming")).toBeInTheDocument();
  });
});
