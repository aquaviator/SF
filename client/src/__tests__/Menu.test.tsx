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

const renderWithAuth = (role: "owner" | "staff" = "owner") => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>
      {children}
    </AuthProvider>
  );

  return render(
    <TestWrapper>
      <Menu />
    </TestWrapper>
  );
};

describe("Menu", () => {
  it("renders desktop navigation", () => {
    renderWithAuth();
    
    expect(screen.getByText("Agent Shifts")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  it("shows owner navigation items", () => {
    renderWithAuth("owner");
    
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Shifts")).toBeInTheDocument();
    expect(screen.getByText("Staff")).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
  });

  it("shows role switcher", () => {
    renderWithAuth();
    
    expect(screen.getByText("DEV")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });
});
