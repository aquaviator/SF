import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Opportunities from '../pages/opportunities';
import { AuthProvider } from '../contexts/AuthContext';

// Mock the API module
vi.mock('../lib/queryClient', () => ({
  apiRequest: vi.fn(),
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

describe('Opportunities Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock API responses
    const { apiRequest } = require('../lib/queryClient');
    apiRequest.mockResolvedValue({
      json: () => Promise.resolve([
        {
          id: 1,
          tenantId: 'acme-corp',
          role: 'Customer Service',
          date: '2024-12-20',
          startTime: '09:00',
          endTime: '17:00',
          description: 'Weekend shift coverage needed',
          createdBy: 1,
        }
      ]),
    });
  });

  it('renders opportunities page with correct title', async () => {
    render(
      <TestWrapper>
        <Opportunities />
      </TestWrapper>
    );

    expect(screen.getByText('Shift Opportunities')).toBeInTheDocument();
    expect(screen.getByText('Browse and apply for available shifts')).toBeInTheDocument();
  });

  it('displays opportunity statistics cards', async () => {
    render(
      <TestWrapper>
        <Opportunities />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Available')).toBeInTheDocument();
      expect(screen.getByText('This Week')).toBeInTheDocument();
      expect(screen.getByText('My Applications')).toBeInTheDocument();
    });
  });

  it('renders opportunities table with data', async () => {
    render(
      <TestWrapper>
        <Opportunities />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Customer Service')).toBeInTheDocument();
      expect(screen.getByText('09:00 - 17:00')).toBeInTheDocument();
    });
  });

  it('shows apply button for opportunities', async () => {
    render(
      <TestWrapper>
        <Opportunities />
      </TestWrapper>
    );

    await waitFor(() => {
      const applyButtons = screen.getAllByText('Apply');
      expect(applyButtons.length).toBeGreaterThan(0);
    });
  });

  it('handles apply button click', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Opportunities />
      </TestWrapper>
    );

    await waitFor(() => {
      const applyButton = screen.getAllByText('Apply')[0];
      user.click(applyButton);
    });

    // Should handle the apply action without errors
  });

  it('shows empty state when no opportunities', async () => {
    const { apiRequest } = require('../lib/queryClient');
    apiRequest.mockResolvedValue({
      json: () => Promise.resolve([]),
    });

    render(
      <TestWrapper>
        <Opportunities />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No opportunities available')).toBeInTheDocument();
    });
  });
});