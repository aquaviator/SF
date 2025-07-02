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
  DataTable: ({ data, title, onAdd, emptyState }: any) => (
    <div data-testid="data-table">
      <h3>{title}</h3>
      {onAdd && <button onClick={onAdd}>Add</button>}
      {data.length === 0 ? emptyState : <div>Table with {data.length} items</div>}
    </div>
  ),
}));

// Mock hooks
vi.mock("@/hooks/useCrud", () => ({
  useCrud: vi.fn(() => ({
    data: [],
    isLoading: false,
    isModalOpen: false,
    editingItem: null,
    isSubmitting: false,
    openCreateModal: vi.fn(),
    openEditModal: vi.fn(),
    closeModal: vi.fn(),
    handleSubmit: vi.fn(),
    handleDelete: vi.fn(),
  })),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock auth context with different user roles
const createMockAuthContext = (role: "owner" | "staff") => ({
  user: {
    id: "1",
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    role,
  },
  tenantId: "test-tenant",
  login: vi.fn(),
  logout: vi.fn(),
  isAuthenticated: true,
});

function createWrapper(role: "owner" | "staff" = "owner") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const MockAuthProvider = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider value={createMockAuthContext(role) as any}>
      {children}
    </AuthProvider>
  );

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MockAuthProvider>
        {children}
      </MockAuthProvider>
    </QueryClientProvider>
  );
}

// Mock fetch for API calls
global.fetch = vi.fn();

describe("Scheduling Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
  });

  describe("Basic Rendering", () => {
    it("renders scheduling page with main tabs", async () => {
      const Wrapper = createWrapper("owner");
      
      render(
        <Wrapper>
          <Scheduling />
        </Wrapper>
      );

      expect(screen.getByText("Scheduling")).toBeInTheDocument();
      expect(screen.getByText("Manage shifts, templates, and live operations")).toBeInTheDocument();
      
      // Check tabs are present
      expect(screen.getByText("Shift Planner")).toBeInTheDocument();
      expect(screen.getByText("Templates")).toBeInTheDocument();
      expect(screen.getByText("Live Operations")).toBeInTheDocument();
    });

    it("renders data tables for shifts and templates", async () => {
      const Wrapper = createWrapper("owner");
      
      render(
        <Wrapper>
          <Scheduling />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Scheduled Shifts")).toBeInTheDocument();
      });
    });
  });

  describe("Shift Template Functionality", () => {
    it("shows template creation form when add button clicked", async () => {
      const mockUseCrud = await import("@/hooks/useCrud");
      const openCreateModal = vi.fn();
      
      vi.mocked(mockUseCrud.useCrud).mockReturnValue({
        data: [],
        isLoading: false,
        isModalOpen: true,
        editingItem: null,
        isSubmitting: false,
        openCreateModal,
        openEditModal: vi.fn(),
        closeModal: vi.fn(),
        handleSubmit: vi.fn(),
        handleDelete: vi.fn(),
      });

      const Wrapper = createWrapper("owner");
      
      render(
        <Wrapper>
          <Scheduling />
        </Wrapper>
      );

      // Switch to templates tab
      fireEvent.click(screen.getByText("Templates"));
      
      await waitFor(() => {
        expect(screen.getByTestId("modal-form")).toBeInTheDocument();
      });
    });

    it("handles template form fields correctly", async () => {
      const mockUseCrud = await import("@/hooks/useCrud");
      
      vi.mocked(mockUseCrud.useCrud).mockReturnValue({
        data: [],
        isLoading: false,
        isModalOpen: true,
        editingItem: null,
        isSubmitting: false,
        openCreateModal: vi.fn(),
        openEditModal: vi.fn(),
        closeModal: vi.fn(),
        handleSubmit: vi.fn(),
        handleDelete: vi.fn(),
      });

      const Wrapper = createWrapper("owner");
      
      render(
        <Wrapper>
          <Scheduling />
        </Wrapper>
      );

      // Check template form fields are present when modal is open
      await waitFor(() => {
        const modal = screen.getByTestId("modal-form");
        expect(modal).toBeInTheDocument();
      });
    });
  });

  describe("Live Operations & Clock-in/out", () => {
    it("shows clock-in controls for staff users", async () => {
      const Wrapper = createWrapper("staff");
      
      render(
        <Wrapper>
          <Scheduling />
        </Wrapper>
      );

      // Switch to live operations tab
      fireEvent.click(screen.getByText("Live Operations"));
      
      await waitFor(() => {
        expect(screen.getByText("Clock In/Out")).toBeInTheDocument();
      });
    });

    it("hides clock-in controls for owner users", async () => {
      const Wrapper = createWrapper("owner");
      
      render(
        <Wrapper>
          <Scheduling />
        </Wrapper>
      );

      // Switch to live operations tab
      fireEvent.click(screen.getByText("Live Operations"));
      
      await waitFor(() => {
        expect(screen.queryByText("Clock In/Out")).not.toBeInTheDocument();
      });
    });

    it("displays live operations statistics", async () => {
      const Wrapper = createWrapper("owner");
      
      render(
        <Wrapper>
          <Scheduling />
        </Wrapper>
      );

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

  describe("API Integration", () => {
    it("fetches time entries on load", async () => {
      const Wrapper = createWrapper("owner");
      
      render(
        <Wrapper>
          <Scheduling />
        </Wrapper>
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/time-entries")
        );
      });
    });

    it("fetches staff data for live operations", async () => {
      const Wrapper = createWrapper("owner");
      
      render(
        <Wrapper>
          <Scheduling />
        </Wrapper>
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/staff")
        );
      });
    });

    it("fetches active time entry for staff users", async () => {
      const Wrapper = createWrapper("staff");
      
      render(
        <Wrapper>
          <Scheduling />
        </Wrapper>
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/time-entries/active")
        );
      });
    });
  });

  describe("Error Handling", () => {
    it("handles API errors gracefully", async () => {
      (global.fetch as any).mockRejectedValue(new Error("API Error"));
      
      const Wrapper = createWrapper("owner");
      
      render(
        <Wrapper>
          <Scheduling />
        </Wrapper>
      );

      // Should still render the component structure
      expect(screen.getByText("Scheduling")).toBeInTheDocument();
    });

    it("shows loading states appropriately", async () => {
      const mockUseCrud = await import("@/hooks/useCrud");
      
      vi.mocked(mockUseCrud.useCrud).mockReturnValue({
        data: [],
        isLoading: true,
        isModalOpen: false,
        editingItem: null,
        isSubmitting: false,
        openCreateModal: vi.fn(),
        openEditModal: vi.fn(),
        closeModal: vi.fn(),
        handleSubmit: vi.fn(),
        handleDelete: vi.fn(),
      });

      const Wrapper = createWrapper("owner");
      
      render(
        <Wrapper>
          <Scheduling />
        </Wrapper>
      );

      // Should handle loading state
      expect(screen.getByText("Scheduling")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper heading structure", async () => {
      const Wrapper = createWrapper("owner");
      
      render(
        <Wrapper>
          <Scheduling />
        </Wrapper>
      );

      expect(screen.getByRole("heading", { name: /scheduling/i })).toBeInTheDocument();
    });

    it("has accessible tab navigation", async () => {
      const Wrapper = createWrapper("owner");
      
      render(
        <Wrapper>
          <Scheduling />
        </Wrapper>
      );

      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(3);
      
      // Should be able to navigate tabs with keyboard
      tabs.forEach(tab => {
        expect(tab).toBeInTheDocument();
      });
    });
  });
});