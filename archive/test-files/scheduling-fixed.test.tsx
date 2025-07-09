import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import Scheduling from "@/pages/scheduling";

// Mock the API request function
vi.mock("@/lib/queryClient", () => ({
  apiRequest: vi.fn(),
}));

// Mock components
vi.mock("@/components/ModalForm", () => ({
  ModalForm: ({ isOpen, children, title }: any) => 
    isOpen ? <div data-testid="modal-form" aria-label={title}>{children}</div> : null,
}));

vi.mock("@/components/DataTable", () => ({
  DataTable: ({ data, title, onAdd }: any) => (
    <div data-testid="data-table">
      <h3>{title}</h3>
      {onAdd && <button onClick={onAdd} data-testid={`add-button`}>Add</button>}
      <div>Table with {data.length} items</div>
    </div>
  ),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock useCrud hook to return the values we need
vi.mock("@/hooks/useCrud", () => ({
  useCrud: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
    isModalOpen: false,
    editingItem: null,
    isSubmitting: false,
    openCreateModal: vi.fn(),
    openEditModal: vi.fn(),
    closeModal: vi.fn(),
    handleSubmit: vi.fn(),
    handleDelete: vi.fn(),
    createMutation: { isPending: false },
    updateMutation: { isPending: false },
    deleteMutation: { isPending: false },
  })),
}));

// Mock useAuth hook to return owner or staff
let currentUserRole: "owner" | "staff" = "owner";
vi.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: {
      id: "1",
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      role: currentUserRole,
    },
    tenantId: "test-tenant",
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: true,
  }),
}));

function createWrapper(role: "owner" | "staff" = "owner") {
  currentUserRole = role;
  
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Mock fetch for API calls
global.fetch = vi.fn();

describe("Scheduling Module - Fixed Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup proper mock responses for different API endpoints
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/time-entries')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]), // Always return array for time entries
        });
      }
      if (url.includes('/api/staff')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, firstName: "John", lastName: "Doe", role: "staff" },
            { id: 2, firstName: "Jane", lastName: "Smith", role: "staff" }
          ]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });
  });

  describe("Basic Rendering", () => {
    it("renders scheduling page with all tabs", () => {
      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      expect(screen.getByText("Scheduling")).toBeInTheDocument();
      expect(screen.getByText("Shift Planner")).toBeInTheDocument();
      expect(screen.getByText("Templates")).toBeInTheDocument();
      expect(screen.getByText("Live Operations")).toBeInTheDocument();
    });

    it("allows tab navigation", async () => {
      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      // Click Templates tab
      fireEvent.click(screen.getByText("Templates"));
      expect(screen.getByText("Shift Templates")).toBeInTheDocument();

      // Click Live Operations tab
      fireEvent.click(screen.getByText("Live Operations"));
      expect(screen.getByText("Clocked In")).toBeInTheDocument();
      expect(screen.getByText("On Break")).toBeInTheDocument();
      expect(screen.getByText("Absent")).toBeInTheDocument();
      expect(screen.getByText("Total Staff")).toBeInTheDocument();
    });
  });

  describe("Live Operations - Fixed Tests", () => {
    it("shows clock-in controls for staff users", async () => {
      const Wrapper = createWrapper("staff");
      
      render(<Wrapper><Scheduling /></Wrapper>);

      // Switch to live operations tab
      fireEvent.click(screen.getByText("Live Operations"));
      
      await waitFor(() => {
        expect(screen.getByText("Clock In/Out")).toBeInTheDocument();
        expect(screen.getByText("Clock In")).toBeInTheDocument();
      });
    });

    it("hides clock-in controls for owner users", async () => {
      const Wrapper = createWrapper("owner");
      
      render(<Wrapper><Scheduling /></Wrapper>);

      // Switch to live operations tab
      fireEvent.click(screen.getByText("Live Operations"));
      
      await waitFor(() => {
        expect(screen.queryByText("Clock In/Out")).not.toBeInTheDocument();
      });
    });

    it("displays live operations statistics correctly", async () => {
      const Wrapper = createWrapper("owner");
      
      render(<Wrapper><Scheduling /></Wrapper>);

      // Switch to live operations tab
      fireEvent.click(screen.getByText("Live Operations"));
      
      await waitFor(() => {
        expect(screen.getByText("Clocked In")).toBeInTheDocument();
        expect(screen.getByText("On Break")).toBeInTheDocument();
        expect(screen.getByText("Absent")).toBeInTheDocument();
        expect(screen.getByText("Total Staff")).toBeInTheDocument();
      });
    });
  });

  describe("Shift Management", () => {
    it("shows create shift button", () => {
      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      expect(screen.getByText("Create Shift")).toBeInTheDocument();
    });

    it("displays scheduled shifts table", () => {
      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      expect(screen.getByText("Scheduled Shifts")).toBeInTheDocument();
    });
  });

  describe("Clock-in Flow for Staff", () => {
    it("handles clock-in process", async () => {
      const { apiRequest } = await import("@/lib/queryClient");
      vi.mocked(apiRequest).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 1 }) });

      const Wrapper = createWrapper("staff");
      render(<Wrapper><Scheduling /></Wrapper>);

      // Switch to live operations tab
      fireEvent.click(screen.getByText("Live Operations"));
      
      await waitFor(() => {
        const clockInButton = screen.getByText("Clock In");
        fireEvent.click(clockInButton);
      });

      // Verify API call
      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith("POST", "/api/time-entries", expect.any(Object));
      });
    });

    it("shows clock-out button when clocked in", async () => {
      // Mock active time entry
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 1, status: "clocked-in" }),
      });

      const Wrapper = createWrapper("staff");
      render(<Wrapper><Scheduling /></Wrapper>);

      fireEvent.click(screen.getByText("Live Operations"));

      await waitFor(() => {
        expect(screen.getByText("Clock Out")).toBeInTheDocument();
      });
    });

    it("shows break controls when clocked in", async () => {
      // Mock active time entry
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 1, status: "clocked-in" }),
      });

      const Wrapper = createWrapper("staff");
      render(<Wrapper><Scheduling /></Wrapper>);

      fireEvent.click(screen.getByText("Live Operations"));

      await waitFor(() => {
        expect(screen.getByText("Start Break")).toBeInTheDocument();
      });
    });

    it("shows end break button when on break", async () => {
      // Mock active time entry on break
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 1, status: "on-break" }),
      });

      const Wrapper = createWrapper("staff");
      render(<Wrapper><Scheduling /></Wrapper>);

      fireEvent.click(screen.getByText("Live Operations"));

      await waitFor(() => {
        expect(screen.getByText("End Break")).toBeInTheDocument();
      });
    });
  });

  describe("Template Management", () => {
    it("switches to templates tab and shows content", async () => {
      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      fireEvent.click(screen.getByText("Templates"));
      
      await waitFor(() => {
        expect(screen.getByText("Shift Templates")).toBeInTheDocument();
      });
    });
  });

  describe("API Integration", () => {
    it("fetches shifts data on component mount", async () => {
      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/shifts")
        );
      });
    });

    it("fetches time entries for live operations", async () => {
      const Wrapper = createWrapper("staff");
      render(<Wrapper><Scheduling /></Wrapper>);

      fireEvent.click(screen.getByText("Live Operations"));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/time-entries")
        );
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper tab navigation structure", () => {
      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      const tabList = screen.getByRole("tablist");
      expect(tabList).toBeInTheDocument();
      
      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(3);
    });

    it("has accessible headings", () => {
      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      expect(screen.getByRole("heading", { level: 2, name: "Scheduling" })).toBeInTheDocument();
    });
  });
});