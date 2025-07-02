import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../pages/dashboard';
import { AuthProvider } from '../contexts/AuthContext';

// Mock date-fns functions
vi.mock('date-fns', () => ({
  format: vi.fn((date, format) => {
    if (format === "MMM d") return "Dec 1";
    return "Dec 1";
  }),
  isThisWeek: vi.fn(() => true),
  parseISO: vi.fn((date) => new Date(date)),
  isToday: vi.fn(() => false),
  isTomorrow: vi.fn(() => true),
  addDays: vi.fn((date, days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000)),
}));

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Sample test data
const mockShifts = [
  {
    id: 1,
    tenantId: "acme-corp",
    date: "2024-12-15",
    startTime: "09:00",
    endTime: "17:00",
    role: "Customer Service",
    description: "Morning shift",
    location: "Office",
    assignedTo: 1,
    status: "assigned"
  },
  {
    id: 2,
    tenantId: "acme-corp",
    date: "2024-12-16",
    startTime: "18:00",
    endTime: "02:00",
    role: "Security",
    description: "Night shift",
    location: "Main entrance",
    assignedTo: null,
    status: "open"
  }
];

const mockStaff = [
  {
    id: 1,
    username: "john.doe",
    firstName: "John",
    lastName: "Doe",
    email: "john@acme-corp.com",
    role: "staff",
    isActive: true,
    tenantId: "acme-corp"
  },
  {
    id: 2,
    username: "sarah.anderson",
    firstName: "Sarah",
    lastName: "Anderson",
    email: "sarah@acme-corp.com",
    role: "staff",
    isActive: true,
    tenantId: "acme-corp"
  }
];

const mockOpportunities = [
  {
    id: 1,
    tenantId: "acme-corp",
    shiftId: 2,
    description: "Weekend security coverage needed",
    requirements: "Security certification preferred",
    isActive: true
  }
];

const mockSwapRequests = [
  {
    id: 1,
    tenantId: "acme-corp",
    requesterId: 1,
    originalShiftId: 1,
    targetShiftId: 2,
    status: "pending",
    reason: "Family emergency"
  }
];

const mockAssignments = [
  {
    id: 1,
    tenantId: "acme-corp",
    shiftId: 1,
    assignedTo: 1,
    assignedBy: 3,
    assignedAt: new Date(),
    status: "accepted",
    notes: "Confirmed availability"
  }
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
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

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default successful fetch responses
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/shifts')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockShifts)
        });
      }
      if (url.includes('/api/staff')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStaff)
        });
      }
      if (url.includes('/api/opportunities')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOpportunities)
        });
      }
      if (url.includes('/api/swap-requests')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSwapRequests)
        });
      }
      if (url.includes('/api/assignments')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAssignments)
        });
      }
      return Promise.reject(new Error('Unknown API endpoint'));
    });
  });

  describe('Owner Dashboard', () => {
    it('should render owner dashboard with live statistics', async () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      // Should show management dashboard title
      expect(screen.getByText('Management Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Real-time overview of your team\'s shift management')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        // Should show calculated statistics based on real data
        expect(screen.getByText('This Week')).toBeInTheDocument();
        expect(screen.getByText('Assigned')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('Urgent')).toBeInTheDocument();
      });

      // Should show live statistics (2 total shifts, 1 assigned, 1 pending)
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // This Week count
        expect(screen.getByText('1')).toBeInTheDocument(); // Assigned count
      });
    });

    it('should display recent activity based on real data', async () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      });

      // Should show activity from assignments and opportunities
      await waitFor(() => {
        expect(screen.getByText(/Shift assigned to/)).toBeInTheDocument();
        expect(screen.getByText(/opportunity posted/)).toBeInTheDocument();
      });
    });

    it('should show upcoming shifts with real data', async () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Upcoming Shifts')).toBeInTheDocument();
      });

      // Should show shifts from real data
      await waitFor(() => {
        expect(screen.getByText('Customer Service')).toBeInTheDocument();
        expect(screen.getByText('Security')).toBeInTheDocument();
        expect(screen.getByText('Unassigned')).toBeInTheDocument();
      });
    });

    it('should show loading state while fetching data', () => {
      // Mock fetch to be slow
      mockFetch.mockImplementation(() => new Promise(() => {}));

      render(<Dashboard />, { wrapper: createWrapper() });

      expect(screen.getByText('Loading dashboard data...')).toBeInTheDocument();
      expect(screen.getAllByTestId('skeleton')).toHaveLength(10); // 4 stat cards + 6 skeleton rows
    });
  });

  describe('Staff Dashboard', () => {
    beforeEach(() => {
      // Mock AuthContext to return staff role
      vi.doMock('../contexts/AuthContext', () => ({
        useAuth: () => ({
          role: 'staff',
          tenantId: 'acme-corp',
          user: { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@acme-corp.com' },
          switchRole: vi.fn(),
          isAuthenticated: true
        }),
        AuthProvider: ({ children }: { children: React.ReactNode }) => children
      }));
    });

    it('should render staff dashboard with personalized statistics', async () => {
      const { useAuth } = await import('../contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({
        role: 'staff',
        tenantId: 'acme-corp',
        user: { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@acme-corp.com' },
        switchRole: vi.fn(),
        isAuthenticated: true
      });

      render(<Dashboard />, { wrapper: createWrapper() });

      // Should show staff dashboard title
      expect(screen.getByText('My Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Your personalized shift schedule and opportunities')).toBeInTheDocument();

      await waitFor(() => {
        // Should show staff-specific statistics
        expect(screen.getByText('My Shifts')).toBeInTheDocument();
        expect(screen.getByText('Available')).toBeInTheDocument();
        expect(screen.getByText('Requests')).toBeInTheDocument();
      });
    });

    it('should calculate staff-specific metrics correctly', async () => {
      const { useAuth } = await import('../contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({
        role: 'staff',
        tenantId: 'acme-corp',
        user: { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@acme-corp.com' },
        switchRole: vi.fn(),
        isAuthenticated: true
      });

      render(<Dashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Staff user (id: 1) has 1 assigned shift
        const myShiftsValue = screen.getByText('My Shifts').closest('div')?.querySelector('[class*="font-semibold"]');
        expect(myShiftsValue).toHaveTextContent('1');

        // 1 active opportunity available
        const availableValue = screen.getByText('Available').closest('div')?.querySelector('[class*="font-semibold"]');
        expect(availableValue).toHaveTextContent('1');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('API Error'));

      render(<Dashboard />, { wrapper: createWrapper() });

      // Should still render basic structure even with API errors
      expect(screen.getByText('Management Dashboard')).toBeInTheDocument();
      
      // Should handle empty states when data fails to load
      await waitFor(() => {
        expect(screen.getByText('No recent activity')).toBeInTheDocument();
        expect(screen.getByText('No upcoming shifts')).toBeInTheDocument();
      });
    });

    it('should show empty states when no data is available', async () => {
      mockFetch.mockImplementation((url) => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]) // Return empty arrays
        });
      });

      render(<Dashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('No recent activity')).toBeInTheDocument();
        expect(screen.getByText('Activity will appear here as it happens')).toBeInTheDocument();
        expect(screen.getByText('No upcoming shifts')).toBeInTheDocument();
        expect(screen.getByText('Shifts for the next week will appear here')).toBeInTheDocument();
      });
    });
  });

  describe('Live Data Integration', () => {
    it('should make correct API calls for all required data', async () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/shifts?tenantId=acme-corp');
        expect(mockFetch).toHaveBeenCalledWith('/api/staff?tenantId=acme-corp');
        expect(mockFetch).toHaveBeenCalledWith('/api/opportunities?tenantId=acme-corp');
        expect(mockFetch).toHaveBeenCalledWith('/api/swap-requests?tenantId=acme-corp');
        expect(mockFetch).toHaveBeenCalledWith('/api/assignments?tenantId=acme-corp');
      });
    });

    it('should calculate statistics from real data accurately', async () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        // With 2 shifts total, 1 assigned, 1 open, 0 conflicts
        const thisWeekStat = screen.getByText('This Week').closest('[class*="Card"]');
        expect(thisWeekStat).toContainHTML('2'); // Total shifts this week

        const assignedStat = screen.getByText('Assigned').closest('[class*="Card"]');
        expect(assignedStat).toContainHTML('1'); // Assigned shifts

        const pendingStat = screen.getByText('Pending').closest('[class*="Card"]');
        expect(pendingStat).toContainHTML('1'); // Unassigned shifts
      });
    });

    it('should display trend indicators for statistics', async () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Should show trend percentages
        expect(screen.getByText('12%')).toBeInTheDocument();
        expect(screen.getByText('8%')).toBeInTheDocument();
      });
    });
  });
});