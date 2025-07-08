import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import MyWork from "@/pages/my-work";
import type { ReactNode } from "react";

// Mock the toast hook
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the queryClient
vi.mock("@/lib/queryClient", () => ({
  apiRequest: vi.fn(),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    );
  };
}

describe("MyWork Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default successful responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/api/my-shifts")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              id: 1,
              tenantId: "acme-corp",
              date: "2024-12-15",
              startTime: "09:00",
              endTime: "17:00",
              role: "Server",
              location: "Main Floor",
              status: "confirmed",
              description: "Test shift",
              assignedTo: 1,
              notes: null,
              createdBy: 1
            }
          ])
        });
      }
      
      if (url.includes("/api/assignments")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              id: 1,
              tenantId: "acme-corp",
              title: "Weekend Coverage",
              description: "Cover weekend shifts",
              location: "Main Store",
              contactInfo: "Manager: John Doe",
              date: "2024-12-15",
              startTime: "09:00",
              endTime: "17:00",
              createdAt: "2024-12-10T00:00:00Z"
            }
          ])
        });
      }
      
      if (url.includes("/api/time-entries/active")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(null)
        });
      }
      
      if (url.includes("/api/time-entries")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              id: 1,
              clockInTime: "2024-12-15T09:00:00Z",
              clockOutTime: "2024-12-15T17:00:00Z",
              status: "clocked-out"
            }
          ])
        });
      }
      
      if (url.includes("/api/swap-requests")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              id: 1,
              type: "swap",
              status: "pending",
              createdAt: "2024-12-10T00:00:00Z",
              originalShift: { title: "Morning Shift" },
              requestedShift: { title: "Evening Shift" }
            }
          ])
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });
  });

  it("renders My Work page with all tabs", async () => {
    const Wrapper = createWrapper();
    
    render(<MyWork />, { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(screen.getByText("My Work")).toBeInTheDocument();
    });
    
    // Check that all 4 tabs are present
    expect(screen.getByRole("tab", { name: /schedule/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /assignments/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /time tracking/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /requests/i })).toBeInTheDocument();
  });

  it("displays quick stats cards correctly", async () => {
    const Wrapper = createWrapper();
    
    render(<MyWork />, { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(screen.getByText("Next Shift")).toBeInTheDocument();
      expect(screen.getByText("This Week")).toBeInTheDocument();
      expect(screen.getByText("Time Status")).toBeInTheDocument();
      expect(screen.getByText("Requests")).toBeInTheDocument();
    });
    
    // Check stats values
    expect(screen.getByText("1")).toBeInTheDocument(); // Number of shifts
    expect(screen.getByText("Clocked Out")).toBeInTheDocument(); // Time status
    expect(screen.getByText("1")).toBeInTheDocument(); // Pending requests
  });

  it("allows navigation between tabs", async () => {
    const Wrapper = createWrapper();
    
    render(<MyWork />, { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(screen.getByText("My Work")).toBeInTheDocument();
    });
    
    // Should start on Schedule tab
    expect(screen.getByText("My Schedule")).toBeInTheDocument();
    
    // Click Assignments tab
    fireEvent.click(screen.getByRole("tab", { name: /assignments/i }));
    await waitFor(() => {
      expect(screen.getByText("Work Assignments")).toBeInTheDocument();
    });
    
    // Click Time Tracking tab
    fireEvent.click(screen.getByRole("tab", { name: /time tracking/i }));
    await waitFor(() => {
      expect(screen.getByText("Time Tracking")).toBeInTheDocument();
      expect(screen.getByText("Clock In")).toBeInTheDocument();
    });
    
    // Click Requests tab
    fireEvent.click(screen.getByRole("tab", { name: /requests/i }));
    await waitFor(() => {
      expect(screen.getByText("My Requests")).toBeInTheDocument();
    });
  });

  it("displays schedule data correctly", async () => {
    const Wrapper = createWrapper();
    
    render(<MyWork />, { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(screen.getByText("My Schedule")).toBeInTheDocument();
    });
    
    // Check schedule data
    expect(screen.getByText("Server")).toBeInTheDocument();
    expect(screen.getByText("Main Floor")).toBeInTheDocument();
    expect(screen.getByText("09:00 - 17:00")).toBeInTheDocument();
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
  });

  it("displays assignments data correctly", async () => {
    const Wrapper = createWrapper();
    
    render(<MyWork />, { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(screen.getByText("My Work")).toBeInTheDocument();
    });
    
    // Navigate to assignments tab
    fireEvent.click(screen.getByRole("tab", { name: /assignments/i }));
    
    await waitFor(() => {
      expect(screen.getByText("Work Assignments")).toBeInTheDocument();
    });
    
    // Check assignments data
    expect(screen.getByText("Weekend Coverage")).toBeInTheDocument();
    expect(screen.getByText("Cover weekend shifts")).toBeInTheDocument();
    expect(screen.getByText("Main Store")).toBeInTheDocument();
    expect(screen.getByText("Manager: John Doe")).toBeInTheDocument();
  });

  it("displays time tracking functionality", async () => {
    const Wrapper = createWrapper();
    
    render(<MyWork />, { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(screen.getByText("My Work")).toBeInTheDocument();
    });
    
    // Navigate to time tracking tab
    fireEvent.click(screen.getByRole("tab", { name: /time tracking/i }));
    
    await waitFor(() => {
      expect(screen.getByText("Time Tracking")).toBeInTheDocument();
    });
    
    // Check clock-in button is present when not clocked in
    expect(screen.getByText("Clock In")).toBeInTheDocument();
    
    // Check time history
    expect(screen.getByText("Time History")).toBeInTheDocument();
    expect(screen.getByText("8h 0m")).toBeInTheDocument(); // Duration
  });

  it("displays requests data correctly", async () => {
    const Wrapper = createWrapper();
    
    render(<MyWork />, { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(screen.getByText("My Work")).toBeInTheDocument();
    });
    
    // Navigate to requests tab
    fireEvent.click(screen.getByRole("tab", { name: /requests/i }));
    
    await waitFor(() => {
      expect(screen.getByText("My Requests")).toBeInTheDocument();
    });
    
    // Check requests data
    expect(screen.getByText("Shift Swap")).toBeInTheDocument();
    expect(screen.getByText("Morning Shift → Evening Shift")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("shows loading state when data is being fetched", () => {
    // Mock slow loading
    mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    
    const Wrapper = createWrapper();
    
    render(<MyWork />, { wrapper: Wrapper });
    
    // Should show loading spinner
    expect(screen.getByTestId("loader") || screen.getByRole("status")).toBeInTheDocument();
  });

  it("handles API errors gracefully", async () => {
    mockFetch.mockRejectedValue(new Error("API Error"));
    
    const Wrapper = createWrapper();
    
    render(<MyWork />, { wrapper: Wrapper });
    
    // Should still render the page structure
    await waitFor(() => {
      expect(screen.getByText("My Work")).toBeInTheDocument();
    });
    
    // Should show empty states
    expect(screen.getByText("No shifts scheduled")).toBeInTheDocument();
  });

  it("shows empty states when no data available", async () => {
    // Mock empty responses
    mockFetch.mockImplementation(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve([])
    }));
    
    const Wrapper = createWrapper();
    
    render(<MyWork />, { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(screen.getByText("My Work")).toBeInTheDocument();
    });
    
    // Check empty states
    expect(screen.getByText("No shifts scheduled")).toBeInTheDocument();
    
    // Check assignments empty state
    fireEvent.click(screen.getByRole("tab", { name: /assignments/i }));
    await waitFor(() => {
      expect(screen.getByText("No assignments")).toBeInTheDocument();
    });
    
    // Check time tracking empty state
    fireEvent.click(screen.getByRole("tab", { name: /time tracking/i }));
    await waitFor(() => {
      expect(screen.getByText("No time entries")).toBeInTheDocument();
    });
    
    // Check requests empty state
    fireEvent.click(screen.getByRole("tab", { name: /requests/i }));
    await waitFor(() => {
      expect(screen.getByText("No requests")).toBeInTheDocument();
    });
  });

  it("has proper ARIA labels and accessibility", async () => {
    const Wrapper = createWrapper();
    
    render(<MyWork />, { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(screen.getByText("My Work")).toBeInTheDocument();
    });
    
    // Check tab accessibility
    const scheduleTab = screen.getByRole("tab", { name: /schedule/i });
    expect(scheduleTab).toHaveAttribute("aria-selected");
    
    // Check tablist
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    
    // Check that all tabs are keyboard accessible
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(4);
    
    tabs.forEach(tab => {
      expect(tab).toHaveAttribute("tabindex");
    });
  });

  it("displays clock-out button when actively clocked in", async () => {
    // Mock active time entry
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/api/time-entries/active")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 1,
            clockInTime: "2024-12-15T09:00:00Z",
            status: "clocked-in"
          })
        });
      }
      
      // Default empty responses for other endpoints
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });
    
    const Wrapper = createWrapper();
    
    render(<MyWork />, { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(screen.getByText("My Work")).toBeInTheDocument();
    });
    
    // Navigate to time tracking tab
    fireEvent.click(screen.getByRole("tab", { name: /time tracking/i }));
    
    await waitFor(() => {
      expect(screen.getByText("Clock Out")).toBeInTheDocument();
    });
    
    // Check status card shows clocked in
    expect(screen.getByText("Clocked In")).toBeInTheDocument();
  });
});