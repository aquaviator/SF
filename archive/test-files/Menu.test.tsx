import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from 'vitest';
import { Menu } from "../components/Menu";
import { AuthProvider } from "../contexts/AuthContext";

// Mock wouter
vi.mock("wouter", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  useLocation: () => ["/"],
}));

const renderWithAuth = (_role: "owner" | "staff" = "owner") => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>
      {children}
    </AuthProvider>
  );

  return render(<Menu />, { wrapper: TestWrapper });
};

describe("Menu", () => {
  it("renders navigation items", () => {
    renderWithAuth();
    
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Shifts")).toBeInTheDocument();
  });

  it("shows owner navigation items", () => {
    renderWithAuth("owner");
    
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });
});