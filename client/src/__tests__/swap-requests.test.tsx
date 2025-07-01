import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SwapRequests from '../pages/swap-requests';
import { AuthProvider } from '../contexts/AuthContext';

// Mock the API module
jest.mock('../lib/queryClient', () => ({
  apiRequest: jest.fn(),
  queryClient: new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  }),
}));

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

describe('SwapRequests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders swap requests page', async () => {
    render(
      <TestWrapper>
        <SwapRequests />
      </TestWrapper>
    );

    expect(screen.getByText('Shift Swap Requests')).toBeInTheDocument();
    expect(screen.getByText('Manage shift exchange requests with your team')).toBeInTheDocument();
  });

  it('shows empty state when no swap requests', async () => {
    const { apiRequest } = require('../lib/queryClient');
    apiRequest.mockResolvedValue({
      json: () => Promise.resolve([]),
    });

    render(
      <TestWrapper>
        <SwapRequests />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No swap requests')).toBeInTheDocument();
    });
  });

  it('opens modal when Request Swap button is clicked', async () => {
    const { apiRequest } = require('../lib/queryClient');
    apiRequest.mockResolvedValue({
      json: () => Promise.resolve([]),
    });

    const user = userEvent.setup();

    render(
      <TestWrapper>
        <SwapRequests />
      </TestWrapper>
    );

    const addButton = screen.getByText('Request Swap');
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Request Shift Swap')).toBeInTheDocument();
    });
  });
});