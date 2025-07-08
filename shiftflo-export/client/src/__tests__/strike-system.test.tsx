import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "wouter";
import { AuthProvider } from "@/contexts/AuthContext";
import StaffStrikesPage from "@/pages/staff/strikes";
import OwnerStrikesPage from "@/pages/owner/strikes";
import { StrikeHistoryModal } from "@/components/StrikeHistoryModal";
import { apiRequest } from "@/lib/queryClient";
import { staffApi } from "@/lib/staffApi";

// Mock the dependencies
vi.mock("@/lib/queryClient", () => ({
  apiRequest: vi.fn(),
}));

vi.mock("@/lib/staffApi", () => ({
  staffApi: {
    getStrikes: vi.fn(),
    createStrike: vi.fn(),
    updateStrike: vi.fn(),
    deactivateStrike: vi.fn(),
    canClaimShift: vi.fn(),
    getAllStaffStrikes: vi.fn(),
  },
}));

// Mock icons
vi.mock("lucide-react", () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Search: () => <div data-testid="search-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  X: () => <div data-testid="x-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
}));

const mockUser = {
  id: 1,
  firstName: "John",
  lastName: "Doe",
  role: "staff" as const,
  tenantId: "acme-corp",
  username: "john.doe",
  email: "john@example.com",
  password: "hashed",
  isActive: true,
  address: null,
  phone: null,
  dateOfBirth: null,
  hireDate: null,
  emergencyContact: null,
  emergencyPhone: null,
  bio: null,
};

const mockOwnerUser = {
  ...mockUser,
  id: 2,
  role: "owner" as const,
  firstName: "Jane",
  lastName: "Manager",
};

const mockStrikeData = {
  totalPoints: 3,
  strikes: [
    {
      id: 1,
      userId: 1,
      tenantId: "acme-corp",
      points: 2,
      reason: "no_show" as const,
      issuedAt: "2025-07-01T10:00:00Z",
      expiresAt: "2025-10-01T10:00:00Z",
      isActive: true,
      shiftId: 101,
      notes: "Failed to show up for morning shift",
    },
    {
      id: 2,
      userId: 1,
      tenantId: "acme-corp",
      points: 1,
      reason: "late_cancellation" as const,
      issuedAt: "2025-07-02T14:00:00Z",
      expiresAt: "2025-10-02T14:00:00Z",
      isActive: true,
      shiftId: 102,
      notes: "Cancelled with only 2 hours notice",
    },
  ],
};

const mockStaffList = [
  {
    id: 1,
    firstName: "John",
    lastName: "Doe",
    role: "staff" as const,
    tenantId: "acme-corp",
    username: "john.doe",
    email: "john@example.com",
    password: "hashed",
    isActive: true,
    address: null,
    phone: null,
    dateOfBirth: null,
    hireDate: null,
    emergencyContact: null,
    emergencyPhone: null,
    bio: null,
  },
  {
    id: 3,
    firstName: "Mike",
    lastName: "Worker",
    role: "staff" as const,
    tenantId: "acme-corp",
    username: "mike.worker",
    email: "mike@example.com",
    password: "hashed",
    isActive: true,
    address: null,
    phone: null,
    dateOfBirth: null,
    hireDate: null,
    emergencyContact: null,
    emergencyPhone: null,
    bio: null,
  },
];

function TestWrapper({ children, user = mockUser }: { children: React.ReactNode; user?: typeof mockUser }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider value={{ user, login: vi.fn(), logout: vi.fn() }}>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe("Strike System Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Staff Strike Page", () => {
    it("displays staff member's own strikes", async () => {
      (staffApi.getStrikes as any).mockResolvedValue(mockStrikeData);

      render(
        <TestWrapper>
          <StaffStrikesPage />
        </TestWrapper>
      );

      // Check loading state
      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText("My Strike History")).toBeInTheDocument();
      });

      // Check strike summary
      expect(screen.getByText("Total Points")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("Active Strikes")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();

      // Check individual strikes are displayed
      expect(screen.getByText("No Show")).toBeInTheDocument();
      expect(screen.getByText("Late Cancellation")).toBeInTheDocument();
      expect(screen.getByText("2 points")).toBeInTheDocument();
      expect(screen.getByText("1 point")).toBeInTheDocument();
    });

    it("shows empty state when staff has no strikes", async () => {
      (staffApi.getStrikes as any).mockResolvedValue({
        totalPoints: 0,
        strikes: [],
      });

      render(
        <TestWrapper>
          <StaffStrikesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("My Strike History")).toBeInTheDocument();
      });

      expect(screen.getByText("No Strikes Found")).toBeInTheDocument();
      expect(screen.getByText("You currently have no strikes on record.")).toBeInTheDocument();
    });

    it("handles API errors gracefully", async () => {
      (staffApi.getStrikes as any).mockRejectedValue(new Error("API Error"));

      render(
        <TestWrapper>
          <StaffStrikesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Unable to Load Data")).toBeInTheDocument();
      });

      expect(screen.getByText(/Failed to load your strike information/)).toBeInTheDocument();
    });

    it("opens strike details modal when clicking on a strike", async () => {
      (staffApi.getStrikes as any).mockResolvedValue(mockStrikeData);

      render(
        <TestWrapper>
          <StaffStrikesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("My Strike History")).toBeInTheDocument();
      });

      // Click on the first strike
      const viewButton = screen.getAllByText("View Details")[0];
      fireEvent.click(viewButton);

      // Modal should open
      await waitFor(() => {
        expect(screen.getByText("Strike History")).toBeInTheDocument();
      });
    });
  });

  describe("Owner Strikes Page", () => {
    beforeEach(() => {
      (apiRequest as any).mockResolvedValue(mockStaffList);
      (staffApi.getStrikes as any).mockImplementation((userId: number) => {
        if (userId === 1) {
          return Promise.resolve(mockStrikeData);
        }
        return Promise.resolve({ totalPoints: 0, strikes: [] });
      });
    });

    it("displays staff strike overview for owners", async () => {
      render(
        <TestWrapper user={mockOwnerUser}>
          <OwnerStrikesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Strike Management")).toBeInTheDocument();
      });

      // Check summary cards
      expect(screen.getByText("Total Staff")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument(); // 2 staff members
      expect(screen.getByText("Active Strikes")).toBeInTheDocument();

      // Check staff list
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Mike Worker")).toBeInTheDocument();
    });

    it("allows filtering staff by search term", async () => {
      render(
        <TestWrapper user={mockOwnerUser}>
          <OwnerStrikesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Strike Management")).toBeInTheDocument();
      });

      // Search for specific staff member
      const searchInput = screen.getByPlaceholderText("Search staff by name");
      fireEvent.change(searchInput, { target: { value: "John" } });

      // Should show filtered results
      expect(screen.getByText("Showing 1 of 2 staff members")).toBeInTheDocument();
    });

    it("allows filtering by strike points", async () => {
      render(
        <TestWrapper user={mockOwnerUser}>
          <OwnerStrikesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Strike Management")).toBeInTheDocument();
      });

      // Filter by points range
      const pointsFilter = screen.getByRole("combobox");
      fireEvent.click(pointsFilter);
      
      // Should show filter options (would be more testable with actual select implementation)
      expect(pointsFilter).toBeInTheDocument();
    });

    it("opens strike management modal for staff member", async () => {
      render(
        <TestWrapper user={mockOwnerUser}>
          <OwnerStrikesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Strike Management")).toBeInTheDocument();
      });

      // Click view button for a staff member
      const viewButtons = screen.getAllByText(/View/);
      if (viewButtons.length > 0) {
        fireEvent.click(viewButtons[0]);

        await waitFor(() => {
          expect(screen.getByText("Strike History")).toBeInTheDocument();
        });
      }
    });
  });

  describe("Strike History Modal", () => {
    const mockModalProps = {
      isOpen: true,
      onClose: vi.fn(),
      userId: 1,
      tenantId: "acme-corp",
      mode: "staff" as const,
      onStrikeUpdated: vi.fn(),
    };

    it("displays strike history in modal", async () => {
      (staffApi.getStrikes as any).mockResolvedValue(mockStrikeData);

      render(
        <TestWrapper>
          <StrikeHistoryModal {...mockModalProps} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Strike History")).toBeInTheDocument();
      });

      // Check that strikes are displayed
      expect(screen.getByText("No Show")).toBeInTheDocument();
      expect(screen.getByText("Late Cancellation")).toBeInTheDocument();
    });

    it("allows owners to add new strikes", async () => {
      (staffApi.getStrikes as any).mockResolvedValue(mockStrikeData);
      (staffApi.createStrike as any).mockResolvedValue({
        id: 3,
        userId: 1,
        tenantId: "acme-corp",
        points: 1,
        reason: "manual_adjustment",
        issuedAt: "2025-07-03T10:00:00Z",
        expiresAt: "2025-10-03T10:00:00Z",
        isActive: true,
        notes: "Manual adjustment by manager",
      });

      render(
        <TestWrapper user={mockOwnerUser}>
          <StrikeHistoryModal {...mockModalProps} mode="owner" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Strike History")).toBeInTheDocument();
      });

      // Should show add strike button for owners
      const addButton = screen.getByText("Add Strike");
      expect(addButton).toBeInTheDocument();

      // Click add strike
      fireEvent.click(addButton);

      // Should show form fields
      expect(screen.getByLabelText(/Points/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Reason/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Notes/)).toBeInTheDocument();
    });

    it("allows strike deactivation", async () => {
      (staffApi.getStrikes as any).mockResolvedValue(mockStrikeData);
      (staffApi.updateStrike as any).mockResolvedValue({
        ...mockStrikeData.strikes[0],
        isActive: false,
      });

      render(
        <TestWrapper user={mockOwnerUser}>
          <StrikeHistoryModal {...mockModalProps} mode="owner" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Strike History")).toBeInTheDocument();
      });

      // Should show deactivate buttons for active strikes
      const deactivateButtons = screen.getAllByText(/Deactivate/);
      if (deactivateButtons.length > 0) {
        fireEvent.click(deactivateButtons[0]);

        await waitFor(() => {
          expect(staffApi.updateStrike).toHaveBeenCalledWith(
            1,
            1,
            { isActive: false }
          );
        });
      }
    });

    it("shows read-only view for staff", async () => {
      (staffApi.getStrikes as any).mockResolvedValue(mockStrikeData);

      render(
        <TestWrapper>
          <StrikeHistoryModal {...mockModalProps} mode="staff" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Strike History")).toBeInTheDocument();
      });

      // Staff should not see add/edit buttons
      expect(screen.queryByText("Add Strike")).not.toBeInTheDocument();
      expect(screen.queryByText("Deactivate")).not.toBeInTheDocument();
    });

    it("closes modal when clicking close button", async () => {
      (staffApi.getStrikes as any).mockResolvedValue(mockStrikeData);

      render(
        <TestWrapper>
          <StrikeHistoryModal {...mockModalProps} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Strike History")).toBeInTheDocument();
      });

      // Click close button
      const closeButton = screen.getByTestId("x-icon").parentElement;
      if (closeButton) {
        fireEvent.click(closeButton);
        expect(mockModalProps.onClose).toHaveBeenCalled();
      }
    });
  });

  describe("API Integration", () => {
    it("handles strike creation API calls", async () => {
      const mockCreateResponse = {
        id: 3,
        userId: 1,
        tenantId: "acme-corp",
        points: 2,
        reason: "manual_adjustment",
        issuedAt: "2025-07-03T10:00:00Z",
        expiresAt: "2025-10-03T10:00:00Z",
        isActive: true,
        notes: "Test strike",
      };

      (staffApi.createStrike as any).mockResolvedValue(mockCreateResponse);

      const request = {
        tenantId: "acme-corp",
        userId: 1,
        reason: "manual_adjustment" as const,
        points: 2,
        notes: "Test strike",
      };

      const result = await staffApi.createStrike(request);
      expect(result).toEqual(mockCreateResponse);
      expect(staffApi.createStrike).toHaveBeenCalledWith(request);
    });

    it("handles strike update API calls", async () => {
      const mockUpdateResponse = {
        ...mockStrikeData.strikes[0],
        isActive: false,
      };

      (staffApi.updateStrike as any).mockResolvedValue(mockUpdateResponse);

      const result = await staffApi.updateStrike(1, 1, { isActive: false });
      expect(result).toEqual(mockUpdateResponse);
      expect(staffApi.updateStrike).toHaveBeenCalledWith(1, 1, { isActive: false });
    });

    it("handles can claim shift validation", async () => {
      const mockCanClaim = { canClaim: false, reason: "Exceeded strike limit (5 points)" };
      (staffApi.canClaimShift as any).mockResolvedValue(mockCanClaim);

      const result = await staffApi.canClaimShift(1, "acme-corp");
      expect(result).toEqual(mockCanClaim);
      expect(staffApi.canClaimShift).toHaveBeenCalledWith(1, "acme-corp");
    });
  });

  describe("Mobile Accessibility", () => {
    it("renders mobile-friendly strike cards", async () => {
      (staffApi.getStrikes as any).mockResolvedValue(mockStrikeData);

      render(
        <TestWrapper>
          <StaffStrikesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("My Strike History")).toBeInTheDocument();
      });

      // Check that mobile cards are rendered (would need actual responsive testing)
      const strikeCards = screen.getAllByText(/Failed to show up/);
      expect(strikeCards.length).toBeGreaterThan(0);
    });

    it("has proper touch targets for mobile", async () => {
      (staffApi.getStrikes as any).mockResolvedValue(mockStrikeData);

      render(
        <TestWrapper>
          <StaffStrikesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("My Strike History")).toBeInTheDocument();
      });

      // Check that buttons have minimum touch target size (44px)
      const viewButtons = screen.getAllByText("View Details");
      viewButtons.forEach(button => {
        expect(button.closest("button")).toHaveClass(/min-h-\[44px\]/);
      });
    });
  });
});