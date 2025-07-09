import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../pages/dashboard';
import { AuthProvider } from '../contexts/AuthContext';

// Mock date-fns functions
vi.mock('date-fns', () => ({
  format: vi.fn(() => "Dec 1"),
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

describe('Dashboard Live Data Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup successful fetch responses
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
          json: () => Promise.resolve([])
        });
      }
      if (url.includes('/api/swap-requests')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      if (url.includes('/api/assignments')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      return Promise.reject(new Error('Unknown API endpoint'));
    });
  });

  it('should render owner dashboard with real-time data', async () => {
    render(<Dashboard />, { wrapper: createWrapper() });

    // Should show management dashboard title
    expect(screen.getByText('Management Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Real-time overview of your team\'s shift management')).toBeInTheDocument();

    // Wait for data to load and statistics to be calculated
    await waitFor(() => {
      expect(screen.getByText('This Week')).toBeInTheDocument();
      expect(screen.getByText('Assigned')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Urgent')).toBeInTheDocument();
    });

    // Should show calculated statistics
    await waitFor(() => {
      // The dashboard should show live data: 2 shifts this week, 1 assigned, 1 pending
      const thisWeekCount = screen.getByText('This Week').closest('div')?.textContent;
      expect(thisWeekCount).toContain('2');
      
      const assignedCount = screen.getByText('Assigned').closest('div')?.textContent;
      expect(assignedCount).toContain('1');
    });
  });

  it('should make API calls to fetch live data', async () => {
    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/shifts?tenantId=acme-corp');
      expect(mockFetch).toHaveBeenCalledWith('/api/staff?tenantId=acme-corp');
      expect(mockFetch).toHaveBeenCalledWith('/api/opportunities?tenantId=acme-corp');
      expect(mockFetch).toHaveBeenCalledWith('/api/swap-requests?tenantId=acme-corp');
      expect(mockFetch).toHaveBeenCalledWith('/api/assignments?tenantId=acme-corp');
    });
  });

  it('should show loading state while fetching data', () => {
    // Mock fetch to be slow
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<Dashboard />, { wrapper: createWrapper() });

    expect(screen.getByText('Loading dashboard data...')).toBeInTheDocument();
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('should handle empty data gracefully', async () => {
    mockFetch.mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });

    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No recent activity')).toBeInTheDocument();
      expect(screen.getByText('No upcoming shifts')).toBeInTheDocument();
    });
  });

  it('should display trend indicators', async () => {
    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Should show trend percentages
      const trendElements = screen.getAllByText(/%$/);
      expect(trendElements.length).toBeGreaterThan(0);
    });
  });
});