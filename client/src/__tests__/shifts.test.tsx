import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Shifts from "../pages/shifts";
import { AuthProvider } from "../contexts/AuthContext";

// Mock the toast hook
jest.mock("../hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

const renderWithProviders = (component: React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {component}
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe("Shifts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
  });

  it("renders shift management page", () => {
    renderWithProviders(<Shifts />);
    
    expect(screen.getByText("Shift Management")).toBeInTheDocument();
    expect(screen.getByText("Manage and assign shifts for your team")).toBeInTheDocument();
    expect(screen.getByText("Upcoming Shifts")).toBeInTheDocument();
  });

  it("shows add shift button", () => {
    renderWithProviders(<Shifts />);
    
    expect(screen.getByText("Add Shift")).toBeInTheDocument();
  });

  it("shows empty state when no shifts", () => {
    renderWithProviders(<Shifts />);
    
    expect(screen.getByText("No shifts scheduled")).toBeInTheDocument();
  });
});
