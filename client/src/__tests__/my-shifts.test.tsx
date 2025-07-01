import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyShifts from '../pages/my-shifts';
import { AuthProvider } from '../contexts/AuthContext';

// Mock the fetch function
global.fetch = jest.fn();

// Test wrapper with required providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('My Shifts Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fetch responses
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        {
          id: 1,
          tenantId: 'acme-corp',
          date: '2024-12-20',
          startTime: '09:00',
          endTime: '17:00',
          role: 'Customer Service',
          status: 'assigned',
          assignedTo: 1,
          notes: 'Regular shift',
          createdBy: 1,
        },
        {
          id: 2,
          tenantId: 'acme-corp',
          date: '2024-12-22',
          startTime: '14:00',
          endTime: '22:00',
          role: 'Security',
          status: 'confirmed',
          assignedTo: 1,
          notes: null,
          createdBy: 1,
        }
      ]),
    });
  });

  it('renders my shifts page with correct title', async () => {
    render(
      <TestWrapper>
        <MyShifts />
      </TestWrapper>
    );

    expect(screen.getByText('My Shifts')).toBeInTheDocument();
    expect(screen.getByText('View and manage your scheduled shifts')).toBeInTheDocument();
  });

  it('displays next shift card when shifts are available', async () => {
    render(
      <TestWrapper>
        <MyShifts />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Next Shift')).toBeInTheDocument();
    });
  });

  it('renders shifts table with data', async () => {
    render(
      <TestWrapper>
        <MyShifts />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Customer Service')).toBeInTheDocument();
      expect(screen.getByText('Security')).toBeInTheDocument();
      expect(screen.getByText('09:00 - 17:00')).toBeInTheDocument();
      expect(screen.getByText('14:00 - 22:00')).toBeInTheDocument();
    });
  });

  it('displays status badges correctly', async () => {
    render(
      <TestWrapper>
        <MyShifts />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Assigned')).toBeInTheDocument();
      expect(screen.getByText('Confirmed')).toBeInTheDocument();
    });
  });

  it('shows confirm button for assigned shifts', async () => {
    render(
      <TestWrapper>
        <MyShifts />
      </TestWrapper>
    );

    await waitFor(() => {
      const confirmButtons = screen.getAllByText('Confirm');
      expect(confirmButtons.length).toBeGreaterThan(0);
    });
  });

  it('handles confirm button click', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MyShifts />
      </TestWrapper>
    );

    await waitFor(async () => {
      const confirmButton = screen.getAllByText('Confirm')[0];
      await user.click(confirmButton);
    });

    // Should handle the confirm action without errors
  });

  it('shows empty state when no shifts', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(
      <TestWrapper>
        <MyShifts />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No shifts assigned')).toBeInTheDocument();
      expect(screen.getByText('Check back later for new assignments')).toBeInTheDocument();
    });
  });

  it('handles fetch error gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(
      <TestWrapper>
        <MyShifts />
      </TestWrapper>
    );

    // Component should not crash on fetch error
    expect(screen.getByText('My Shifts')).toBeInTheDocument();
  });

  it('displays notes when available', async () => {
    render(
      <TestWrapper>
        <MyShifts />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Regular shift')).toBeInTheDocument();
      expect(screen.getByText('No notes')).toBeInTheDocument();
    });
  });
});