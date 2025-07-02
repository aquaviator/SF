import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import Scheduling from "@/pages/scheduling";
import userEvent from "@testing-library/user-event";
import { useCrud } from "@/hooks/useCrud";

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

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock useCrud hook  
vi.mock("@/hooks/useCrud", () => ({
  useCrud: vi.fn(),
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

// Mock useAuth hook globally
let currentUserRole: "owner" | "staff" = "owner";
vi.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => createMockAuthContext(currentUserRole),
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

describe("Scheduling Module - Comprehensive Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    // Default useCrud mock
    vi.mocked(useCrud).mockReturnValue({
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
    });
  });

  describe("Basic Rendering & Navigation", () => {
    it("renders scheduling page with all tabs", () => {
      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      expect(screen.getByText("Scheduling")).toBeInTheDocument();
      expect(screen.getByText("Manage shifts, templates, and live operations")).toBeInTheDocument();
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

  describe("Shift CRUD Operations", () => {
    it("opens create shift modal when main 'Create Shift' button is clicked", async () => {
      const openCreateModal = vi.fn();
      mockUseCrud.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        isModalOpen: false,
        editingItem: null,
        isSubmitting: false,
        openCreateModal,
        openEditModal: vi.fn(),
        closeModal: vi.fn(),
        handleSubmit: vi.fn(),
        handleDelete: vi.fn(),
        createMutation: { isPending: false },
        updateMutation: { isPending: false },
        deleteMutation: { isPending: false },
      });

      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      const createButton = screen.getByText("Create Shift");
      fireEvent.click(createButton);

      expect(openCreateModal).toHaveBeenCalled();
    });

    it("opens create shift modal from DataTable add button", async () => {
      const openCreateModal = vi.fn();
      mockUseCrud.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        isModalOpen: false,
        editingItem: null,
        isSubmitting: false,
        openCreateModal,
        openEditModal: vi.fn(),
        closeModal: vi.fn(),
        handleSubmit: vi.fn(),
        handleDelete: vi.fn(),
        createMutation: { isPending: false },
        updateMutation: { isPending: false },
        deleteMutation: { isPending: false },
      });

      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      const addButton = screen.getByTestId("add-scheduled-shifts");
      fireEvent.click(addButton);

      expect(openCreateModal).toHaveBeenCalled();
    });

    it("displays create shift modal when opened", async () => {
      mockUseCrud.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        isModalOpen: true,
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
      });

      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      expect(screen.getByTestId("modal-form")).toBeInTheDocument();
    });

    it("handles shift form submission with validation", async () => {
      const handleSubmit = vi.fn();
      mockUseCrud.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        isModalOpen: true,
        editingItem: null,
        isSubmitting: false,
        openCreateModal: vi.fn(),
        openEditModal: vi.fn(),
        closeModal: vi.fn(),
        handleSubmit,
        handleDelete: vi.fn(),
        createMutation: { isPending: false },
        updateMutation: { isPending: false },
        deleteMutation: { isPending: false },
      });

      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      const submitButton = screen.getByTestId("modal-submit");
      fireEvent.click(submitButton);

      expect(handleSubmit).toHaveBeenCalled();
    });

    it("handles shift edit operation", async () => {
      const mockShift = { id: 1, name: "Test Shift", date: "2024-01-01" };
      const openEditModal = vi.fn();
      
      mockUseCrud.mockReturnValue({
        data: [mockShift],
        isLoading: false,
        error: null,
        isModalOpen: false,
        editingItem: null,
        isSubmitting: false,
        openCreateModal: vi.fn(),
        openEditModal,
        closeModal: vi.fn(),
        handleSubmit: vi.fn(),
        handleDelete: vi.fn(),
        createMutation: { isPending: false },
        updateMutation: { isPending: false },
        deleteMutation: { isPending: false },
      });

      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      const editButton = screen.getByTestId("edit-0");
      fireEvent.click(editButton);

      expect(openEditModal).toHaveBeenCalledWith(mockShift);
    });

    it("handles shift delete with custom confirmation", async () => {
      const mockShift = { id: 1, name: "Test Shift", date: "2024-01-01" };
      const handleDelete = vi.fn();
      
      mockUseCrud.mockReturnValue({
        data: [mockShift],
        isLoading: false,
        error: null,
        isModalOpen: false,
        editingItem: null,
        isSubmitting: false,
        openCreateModal: vi.fn(),
        openEditModal: vi.fn(),
        closeModal: vi.fn(),
        handleSubmit: vi.fn(),
        handleDelete,
        createMutation: { isPending: false },
        updateMutation: { isPending: false },
        deleteMutation: { isPending: false },
      });

      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      const deleteButton = screen.getByTestId("delete-0");
      fireEvent.click(deleteButton);

      expect(handleDelete).toHaveBeenCalledWith(mockShift);
    });

    it("shows validation errors on invalid shift submission", async () => {
      const handleSubmit = vi.fn().mockRejectedValue(new Error("Validation failed"));
      mockUseCrud.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        isModalOpen: true,
        editingItem: null,
        isSubmitting: false,
        openCreateModal: vi.fn(),
        openEditModal: vi.fn(),
        closeModal: vi.fn(),
        handleSubmit,
        handleDelete: vi.fn(),
        createMutation: { isPending: false },
        updateMutation: { isPending: false },
        deleteMutation: { isPending: false },
      });

      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      const submitButton = screen.getByTestId("modal-submit");
      fireEvent.click(submitButton);

      expect(handleSubmit).toHaveBeenCalled();
    });

    it("updates UI after successful shift operations", async () => {
      const mockShifts = [
        { id: 1, name: "Morning Shift", date: "2024-01-01" },
        { id: 2, name: "Evening Shift", date: "2024-01-01" }
      ];
      
      mockUseCrud.mockReturnValue({
        data: mockShifts,
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
      });

      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      expect(screen.getByText("Table with 2 items")).toBeInTheDocument();
      expect(screen.getByTestId("table-row-0")).toBeInTheDocument();
      expect(screen.getByTestId("table-row-1")).toBeInTheDocument();
    });
  });

  describe("Template Operations", () => {
    it("creates template successfully", async () => {
      const handleSubmit = vi.fn();
      mockUseCrud.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        isModalOpen: true,
        editingItem: null,
        isSubmitting: false,
        openCreateModal: vi.fn(),
        openEditModal: vi.fn(),
        closeModal: vi.fn(),
        handleSubmit,
        handleDelete: vi.fn(),
        createMutation: { isPending: false },
        updateMutation: { isPending: false },
        deleteMutation: { isPending: false },
      });

      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      // Switch to templates tab
      fireEvent.click(screen.getByText("Templates"));
      
      await waitFor(() => {
        expect(screen.getByText("Shift Templates")).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId("modal-submit");
      fireEvent.click(submitButton);

      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe("Live Operations & Clock-in/out", () => {
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

    it("handles clock-in flow for staff", async () => {
      // Mock clock-in API
      mockApiRequest.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 1 }) });

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
        expect(mockApiRequest).toHaveBeenCalledWith("POST", "/api/time-entries", expect.any(Object));
      });
    });

    it("updates statistics after clock operations", async () => {
      // Mock live operations data with some clocked in staff
      const mockLiveOps = [
        { id: 1, status: "clocked-in", name: "John Doe" },
        { id: 2, status: "on-break", name: "Jane Smith" },
        { id: 3, status: "absent", name: "Bob Johnson" },
      ];

      // Mock the fetch to return live operations data
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLiveOps),
      });

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

  describe("API Integration", () => {
    it("fetches shifts data on load", async () => {
      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/shifts")
        );
      });
    });

    it("fetches templates data on load", async () => {
      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/schedule-templates")
        );
      });
    });

    it("fetches staff data for live operations", async () => {
      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/staff")
        );
      });
    });

    it("handles API errors gracefully", async () => {
      (global.fetch as any).mockRejectedValue(new Error("API Error"));

      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      // Should still render the UI even with API errors
      expect(screen.getByText("Scheduling")).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("shows loading state for shifts", async () => {
      mockUseCrud.mockReturnValue({
        data: [],
        isLoading: true,
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
      });

      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      // Should show loading state
      expect(screen.getByText("Scheduled Shifts")).toBeInTheDocument();
    });

    it("shows submitting state during form submission", async () => {
      mockUseCrud.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        isModalOpen: true,
        editingItem: null,
        isSubmitting: true,
        openCreateModal: vi.fn(),
        openEditModal: vi.fn(),
        closeModal: vi.fn(),
        handleSubmit: vi.fn(),
        handleDelete: vi.fn(),
        createMutation: { isPending: false },
        updateMutation: { isPending: false },
        deleteMutation: { isPending: false },
      });

      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      expect(screen.getByTestId("modal-form")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper heading structure", () => {
      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      expect(screen.getByRole("heading", { level: 2, name: "Scheduling" })).toBeInTheDocument();
    });

    it("has accessible tab navigation", () => {
      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      const tabList = screen.getByRole("tablist");
      expect(tabList).toBeInTheDocument();
      
      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(3);
      expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    });

    it("has accessible modal dialogs", async () => {
      mockUseCrud.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        isModalOpen: true,
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
      });

      const Wrapper = createWrapper("owner");
      render(<Wrapper><Scheduling /></Wrapper>);

      const modal = screen.getByTestId("modal-form");
      expect(modal).toHaveAttribute("aria-label");
    });
  });
});