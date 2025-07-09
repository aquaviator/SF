import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../contexts/AuthContext";
import BusinessSettings from "../pages/business-settings";

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

describe("BusinessSettings", () => {
  it("renders business settings page", () => {
    render(
      <TestWrapper>
        <BusinessSettings />
      </TestWrapper>
    );

    expect(screen.getByText("Business Settings")).toBeInTheDocument();
  });
});