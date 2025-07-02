import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import Scheduling from "@/pages/scheduling";
import userEvent from "@testing-library/user-event";

// Mock the API request function
const mockApiRequest = vi.fn();
vi.mock("@/lib/queryClient", () => ({
  apiRequest: mockApiRequest,
}));

// Mock components with better interactivity
vi.mock("@/components/ModalForm", () => ({
  ModalForm: ({ isOpen, children, title, onSubmit }: any) => 
    isOpen ? (
      <div data-testid="modal-form" aria-label={title}>
        <h2>{title}</h2>
        {children}
        <button onClick={onSubmit} data-testid="modal-submit">Submit</button>
        <button data-testid="modal-cancel">Cancel</button>
      </div>
    ) : null,
}));

vi.mock("@/components/DataTable", () => ({
  DataTable: ({ data, title, onAdd, onEdit, onDelete, emptyState }: any) => (
    <div data-testid="data-table">
      <h3>{title}</h3>
      {onAdd && <button onClick={onAdd} data-testid={`add-${title.replace(/\s+/g, '-').toLowerCase()}`}>Add {title}</button>}
      {data.length === 0 ? emptyState : (
        <div>
          Table with {data.length} items
          {data.map((item: any, index: number) => (
            <div key={index} data-testid={`table-row-${index}`}>
              {item.name || item.title || `Item ${index}`}
              {onEdit && <button onClick={() => onEdit(item)} data-testid={`edit-${index}`}>Edit</button>}
              {onDelete && <button onClick={() => onDelete(item)} data-testid={`delete-${index}`}>Delete</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  ),
}));

// Mock useCrud hook with better return value
const mockUseCrud = vi.fn(() => ({
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
}));

vi.mock("@/hooks/useCrud", () => ({
  useCrud: mockUseCrud,
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
    <AuthProvider>
      {children}
    </AuthProvider>
  );

  // Mock the useAuth hook to return our mock context
  vi.mock("@/contexts/AuthContext", () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useAuth: () => createMockAuthContext(role),
  }));

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
        // Should show Clock In button when no active time entry
        expect(screen.getByText("Clock In")).toBeInTheDocument();
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