import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HolidayRequests from './holiday-requests';
import { AuthProvider } from '@/contexts/AuthContext';
import type { HolidayRequest } from '@shared/schema';

// Mock the real API with realistic responses
const mockApiResponses = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn().mockImplementation((method: string, url: string, data?: unknown) => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve(mockApiResponses[method.toLowerCase()](url, data)),
    };
    return Promise.resolve(mockResponse);
  }),
  queryClient: new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }),
}));

// Mock authentication with realistic user data
const mockAuthContext = {
  user: { id: '1', role: 'owner' as const },
  tenantId: 'acme-corp',
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
};

vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => mockAuthContext,
}));

// Realistic test data from the actual database
const holidayRequestsData: HolidayRequest[] = [
  {
    id: 1,
    tenantId: 'acme-corp',
    requesterId: 2,
    startDate: '2025-08-15',
    endDate: '2025-08-20',
    reason: 'Family vacation to Hawaii',
    status: 'approved',
    reviewedBy: 1,
    reviewedAt: new Date('2025-07-01'),
    reviewNotes: null,
    createdAt: new Date('2025-06-20'),
  },
  {
    id: 2,
    tenantId: 'acme-corp',
    requesterId: 3,
    startDate: '2025-07-28',
    endDate: '2025-08-05',
    reason: 'Wedding attendance',
    status: 'pending',
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: null,
    createdAt: new Date('2025-07-01'),
  },
  {
    id: 3,
    tenantId: 'acme-corp',
    requesterId: 4,
    startDate: '2025-06-10',
    endDate: '2025-06-12',
    reason: 'Personal time off',
    status: 'rejected',
    reviewedBy: 1,
    reviewedAt: new Date('2025-05-28'),
    reviewNotes: null,
    createdAt: new Date('2025-05-15'),
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

describe('Holiday Requests Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default API responses
    mockApiResponses.get.mockImplementation((url: string) => {
      if (url.includes('/api/holiday-requests')) {
        return holidayRequestsData;
      }
      return [];
    });
    
    mockApiResponses.post.mockImplementation((url: string, data: unknown) => {
      if (url.includes('/api/holiday-requests')) {
        return {
          id: 4,
          ...data,
          createdAt: new Date(),
        };
      }
      return {};
    });
    
    mockApiResponses.put.mockImplementation((url: string, data: unknown) => {
      if (url.includes('/api/holiday-requests')) {
        const id = parseInt(url.split('/').pop() || '0');
        return {
          id,
          ...data,
        };
      }
      return {};
    });
    
    mockApiResponses.delete.mockResolvedValue({});
  });

  describe('Complete Holiday Request Workflow', () => {
    it('displays existing holiday requests correctly', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Family vacation to Hawaii')).toBeInTheDocument();
        expect(screen.getByText('Wedding attendance')).toBeInTheDocument();
        expect(screen.getByText('Personal time off')).toBeInTheDocument();
      });
    });

    it('shows correct status indicators for each request', async () => {
      renderComponent();
      
      await waitFor(() => {
        // Check that all three status types are displayed
        expect(screen.getByText('approved')).toBeInTheDocument();
        expect(screen.getByText('pending')).toBeInTheDocument();
        expect(screen.getByText('rejected')).toBeInTheDocument();
      });
    });

    it('completes full create workflow', async () => {
      renderComponent();
      
      // Open create modal
      await waitFor(() => {
        const createButton = screen.getByText('Create Holiday Request');
        fireEvent.click(createButton);
      });
      
      // Fill form with valid data
      await waitFor(() => {
        const startDateInput = screen.getByLabelText('Start Date');
        const endDateInput = screen.getByLabelText('End Date');
        const reasonInput = screen.getByLabelText('Reason');
        
        fireEvent.change(startDateInput, { target: { value: '2025-09-01' } });
        fireEvent.change(endDateInput, { target: { value: '2025-09-05' } });
        fireEvent.change(reasonInput, { target: { value: 'Conference attendance' } });
      });
      
      // Submit form
      await waitFor(() => {
        const submitButton = screen.getByText('Create');
        fireEvent.click(submitButton);
      });
      
      // Verify API was called with correct data
      expect(mockApiResponses.post).toHaveBeenCalledWith('/api/holiday-requests', {
        tenantId: 'acme-corp',
        requesterId: 1,
        startDate: '2025-09-01',
        endDate: '2025-09-05',
        reason: 'Conference attendance',
        status: 'pending',
        reviewedBy: null,
        reviewedAt: null,
        reviewNotes: null,
      });
    });

    it('handles form validation errors', async () => {
      renderComponent();
      
      // Open create modal
      await waitFor(() => {
        const createButton = screen.getByText('Create Holiday Request');
        fireEvent.click(createButton);
      });
      
      // Try to submit without filling required fields
      await waitFor(() => {
        const submitButton = screen.getByText('Create');
        fireEvent.click(submitButton);
      });
      
      // Verify validation errors are shown
      await waitFor(() => {
        expect(screen.getByText('Start date is required')).toBeInTheDocument();
        expect(screen.getByText('End date is required')).toBeInTheDocument();
      });
    });

    it('completes edit workflow', async () => {
      renderComponent();
      
      // Wait for data to load and find edit button
      await waitFor(() => {
        const editButtons = screen.getAllByText('Edit');
        expect(editButtons.length).toBeGreaterThan(0);
        fireEvent.click(editButtons[0]);
      });
      
      // Modify form data
      await waitFor(() => {
        const reasonInput = screen.getByLabelText('Reason');
        fireEvent.change(reasonInput, { target: { value: 'Extended family vacation to Hawaii' } });
      });
      
      // Submit form
      await waitFor(() => {
        const submitButton = screen.getByText('Update');
        fireEvent.click(submitButton);
      });
      
      // Verify PUT request was made
      expect(mockApiResponses.put).toHaveBeenCalledWith('/api/holiday-requests/1', expect.objectContaining({
        reason: 'Extended family vacation to Hawaii',
      }));
    });

    it('completes delete workflow', async () => {
      renderComponent();
      
      // Wait for data to load and find delete button
      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        expect(deleteButtons.length).toBeGreaterThan(0);
        fireEvent.click(deleteButtons[0]);
      });
      
      // Confirm deletion
      await waitFor(() => {
        const confirmButton = screen.getByText('Confirm Delete');
        fireEvent.click(confirmButton);
      });
      
      // Verify DELETE request was made
      expect(mockApiResponses.delete).toHaveBeenCalledWith('/api/holiday-requests/1');
    });
  });

  describe('Data Display and Formatting', () => {
    it('formats date ranges correctly', async () => {
      renderComponent();
      
      await waitFor(() => {
        // Check date formatting (Aug 15 - Aug 20, 2025)
        expect(screen.getByText(/8\/15\/2025.*8\/20\/2025/)).toBeInTheDocument();
        expect(screen.getByText(/7\/28\/2025.*8\/5\/2025/)).toBeInTheDocument();
      });
    });

    it('calculates request duration correctly', async () => {
      renderComponent();
      
      await waitFor(() => {
        // Should show duration in days
        expect(screen.getByText('6 days')).toBeInTheDocument(); // Aug 15-20
        expect(screen.getByText('9 days')).toBeInTheDocument(); // Jul 28 - Aug 5
        expect(screen.getByText('3 days')).toBeInTheDocument(); // Jun 10-12
      });
    });

    it('displays requester information', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('User #2')).toBeInTheDocument();
        expect(screen.getByText('User #3')).toBeInTheDocument();
        expect(screen.getByText('User #4')).toBeInTheDocument();
      });
    });

    it('shows reviewer information correctly', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('User #1')).toBeInTheDocument(); // Reviewed by owner
        expect(screen.getByText('Pending')).toBeInTheDocument(); // No reviewer yet
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      mockApiResponses.get.mockRejectedValue(new Error('Network error'));
      
      renderComponent();
      
      // Should not crash the application
      await waitFor(() => {
        expect(screen.getByText('Holiday Requests')).toBeInTheDocument();
      });
    });

    it('handles form submission errors', async () => {
      mockApiResponses.post.mockRejectedValue(new Error('Validation error'));
      
      renderComponent();
      
      // Open create modal and submit
      await waitFor(() => {
        const createButton = screen.getByText('Create Holiday Request');
        fireEvent.click(createButton);
      });
      
      await waitFor(() => {
        const startDateInput = screen.getByLabelText('Start Date');
        const endDateInput = screen.getByLabelText('End Date');
        
        fireEvent.change(startDateInput, { target: { value: '2025-09-01' } });
        fireEvent.change(endDateInput, { target: { value: '2025-09-05' } });
        
        const submitButton = screen.getByText('Create');
        fireEvent.click(submitButton);
      });
      
      // Should handle the error without crashing
      await waitFor(() => {
        expect(mockApiResponses.post).toHaveBeenCalled();
      });
    });
  });

  describe('Current Schema Assumptions', () => {
    it('handles current status values correctly', async () => {
      renderComponent();
      
      await waitFor(() => {
        // Test current schema status values
        expect(screen.getByText('approved')).toBeInTheDocument();
        expect(screen.getByText('pending')).toBeInTheDocument();
        expect(screen.getByText('rejected')).toBeInTheDocument();
      });
    });

    it('works with null optional fields', async () => {
      const dataWithNulls: HolidayRequest[] = [
        {
          id: 5,
          tenantId: 'acme-corp',
          requesterId: 5,
          startDate: '2025-10-01',
          endDate: '2025-10-03',
          reason: null, // Null reason
          status: 'pending',
          reviewedBy: null,
          reviewedAt: null,
          reviewNotes: null,
          createdAt: new Date('2025-09-01'),
        },
      ];
      
      mockApiResponses.get.mockResolvedValue(dataWithNulls);
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('No reason provided')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
      });
    });

    it('validates required fields according to current schema', async () => {
      renderComponent();
      
      // Test that all required fields are validated
      await waitFor(() => {
        const createButton = screen.getByText('Create Holiday Request');
        fireEvent.click(createButton);
      });
      
      await waitFor(() => {
        const submitButton = screen.getByText('Create');
        fireEvent.click(submitButton);
      });
      
      // Should show validation errors for required fields
      await waitFor(() => {
        expect(screen.getByText('Start date is required')).toBeInTheDocument();
        expect(screen.getByText('End date is required')).toBeInTheDocument();
      });
    });
  });
});