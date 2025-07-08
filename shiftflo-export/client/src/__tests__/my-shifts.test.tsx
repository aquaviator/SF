import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../contexts/AuthContext";
import MyShifts from "../pages/my-shifts";

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

describe("MyShifts", () => {
  it("renders my shifts page", () => {
    render(
      <TestWrapper>
        <MyShifts />
      </TestWrapper>
    );

    expect(screen.getByText("My Shifts")).toBeInTheDocument();
  });
});