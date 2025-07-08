import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../contexts/AuthContext";
import Dashboard from "../pages/dashboard";
import Profile from "../pages/profile";
import Shifts from "../pages/shifts";

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe("SmokeTests", () => {
  it("renders dashboard without crashing", () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders profile without crashing", () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("renders shifts without crashing", () => {
    render(
      <TestWrapper>
        <Shifts />
      </TestWrapper>
    );

    expect(screen.getByText("Shifts")).toBeInTheDocument();
  });
});