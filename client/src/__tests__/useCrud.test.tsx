import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCrud } from "../hooks/useCrud";

interface TestItem {
  id: number;
  name: string;
}

const TestComponent = () => {
  const _crud = useCrud<TestItem>({
    queryKey: ["test-items"],
    endpoint: "/api/test-items",
  });

  return (
    <div>
      <span>CRUD Test Component</span>
    </div>
  );
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe("useCrud", () => {
  it("renders component with useCrud hook", () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByText("CRUD Test Component")).toBeInTheDocument();
  });
});