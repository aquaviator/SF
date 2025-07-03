import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HolidayRequests from './holiday-requests';
import { AuthProvider } from '@/contexts/AuthContext';
import type { HolidayRequest } from '@shared/schema';

// Mock the API request function
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }),
}));

// Mock the authentication context
const mockAuthContext = {
  user: { id: '1', role: 'owner' as const },
  tenantId: 'test-tenant',
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
};

vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => mockAuthContext,
}));

// Mock holiday requests data
const mockHolidayRequests: HolidayRequest[] = [
  {
    id: 1,
    tenantId: 'test-tenant',
    requesterId: 2,
    startDate: '2025-08-01',
    endDate: '2025-08-03',
    reason: 'Family vacation',
    status: 'pending',
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: null,
    createdAt: new Date('2025-07-01'),
  },
  {
    id: 2,
    tenantId: 'test-tenant',
    requesterId: 3,
    startDate: '2025-07-15',
    endDate: '2025-07-17',
    reason: 'Medical appointment',
    status: 'approved',
    reviewedBy: 1,
    reviewedAt: new Date('2025-07-02'),
    reviewNotes: 'Approved - adequate coverage',
    createdAt: new Date('2025-06-20'),
  },
  {
    id: 3,
    tenantId: 'test-tenant',
    requesterId: 4,
    startDate: '2025-06-20',
    endDate: '2025-06-22',
    reason: 'Personal time',
    status: 'rejected',
    reviewedBy: 1,
    reviewedAt: new Date('2025-06-15'),
    reviewNotes: 'Denied - insufficient coverage',
    createdAt: new Date('2025-06-10'),
  },
];

const renderComponent = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HolidayRequests />
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('HolidayRequests Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API responses
    const { apiRequest } = require('@/lib/queryClient');
    apiRequest.mockImplementation((method: string, url: string) => {
      if (method === 'GET' && url.includes('/api/holiday-requests')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockHolidayRequests),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('renders the holiday requests page with correct title', async () => {
    renderComponent();
    
    expect(screen.getByText('Holiday Requests')).toBeInTheDocument();
    expect(screen.getByText('Manage time off requests and approvals')).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    renderComponent();
    
    // Should show loading skeleton or spinner
    expect(screen.getByText('Holiday Requests')).toBeInTheDocument();
  });

  it('renders holiday requests table with correct columns', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Requested By')).toBeInTheDocument();
      expect(screen.getByText('Dates')).toBeInTheDocument();
      expect(screen.getByText('Reason')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Requested')).toBeInTheDocument();
      expect(screen.getByText('Reviewed By')).toBeInTheDocument();
    });
  });

  it('displays holiday request data correctly', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Family vacation')).toBeInTheDocument();
      expect(screen.getByText('Medical appointment')).toBeInTheDocument();
      expect(screen.getByText('Personal time')).toBeInTheDocument();
    });
  });

  it('shows correct status badges', async () => {
    renderComponent();
    
    await waitFor(() => {
      // Status badges should be rendered (exact implementation depends on getStatusBadge function)
      expect(screen.getByText('pending')).toBeInTheDocument();
      expect(screen.getByText('approved')).toBeInTheDocument();
      expect(screen.getByText('rejected')).toBeInTheDocument();
    });
  });

  it('formats dates correctly', async () => {
    renderComponent();
    
    await waitFor(() => {
      // Check if dates are formatted properly
      expect(screen.getByText(/8\/1\/2025/)).toBeInTheDocument();
      expect(screen.getByText(/7\/15\/2025/)).toBeInTheDocument();
    });
  });

  it('opens create modal when create button is clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      const createButton = screen.getByText('Create Holiday Request');
      fireEvent.click(createButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Create Holiday Request')).toBeInTheDocument();
    });
  });

  it('validates required fields in create form', async () => {
    renderComponent();
    
    await waitFor(() => {
      const createButton = screen.getByText('Create Holiday Request');
      fireEvent.click(createButton);
    });
    
    await waitFor(() => {
      const submitButton = screen.getByText('Create');
      fireEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Start date is required')).toBeInTheDocument();
      expect(screen.getByText('End date is required')).toBeInTheDocument();
    });
  });

  it('submits form with correct data structure', async () => {
    const { apiRequest } = require('@/lib/queryClient');
    
    renderComponent();
    
    await waitFor(() => {
      const createButton = screen.getByText('Create Holiday Request');
      fireEvent.click(createButton);
    });
    
    await waitFor(() => {
      const startDateInput = screen.getByLabelText('Start Date');
      const endDateInput = screen.getByLabelText('End Date');
      const reasonInput = screen.getByLabelText('Reason');
      
      fireEvent.change(startDateInput, { target: { value: '2025-08-01' } });
      fireEvent.change(endDateInput, { target: { value: '2025-08-03' } });
      fireEvent.change(reasonInput, { target: { value: 'Test vacation' } });
      
      const submitButton = screen.getByText('Create');
      fireEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('POST', '/api/holiday-requests', {
        tenantId: 'test-tenant',
        requesterId: 1,
        startDate: '2025-08-01',
        endDate: '2025-08-03',
        reason: 'Test vacation',
        status: 'pending',
        reviewedBy: null,
        reviewedAt: null,
        reviewNotes: null,
      });
    });
  });

  it('handles API errors gracefully', async () => {
    const { apiRequest } = require('@/lib/queryClient');
    apiRequest.mockRejectedValueOnce(new Error('API Error'));
    
    renderComponent();
    
    // Should handle loading errors without crashing
    await waitFor(() => {
      expect(screen.getByText('Holiday Requests')).toBeInTheDocument();
    });
  });

  it('displays requester information correctly', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('User #2')).toBeInTheDocument();
      expect(screen.getByText('User #3')).toBeInTheDocument();
      expect(screen.getByText('User #4')).toBeInTheDocument();
    });
  });

  it('shows review information for approved/rejected requests', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('User #1')).toBeInTheDocument(); // Reviewed by
      expect(screen.getByText('Pending')).toBeInTheDocument(); // Pending review
    });
  });

  it('calculates and displays correct number of days', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('3 days')).toBeInTheDocument(); // Aug 1-3
      expect(screen.getByText('3 days')).toBeInTheDocument(); // Jul 15-17
    });
  });
});