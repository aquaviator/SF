import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../contexts/AuthContext";
import SwapRequests from "../pages/swap-requests";

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

describe("SwapRequests", () => {
  it("renders swap requests page", () => {
    render(
      <TestWrapper>
        <SwapRequests />
      </TestWrapper>
    );

    expect(screen.getByText("Swap Requests")).toBeInTheDocument();
  });
});