import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SwapRequests from '../pages/swap-requests';
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
    vi.clearAllMocks();
  it('renders swap requests page', async () => {
    render(
      <TestWrapper>
        <SwapRequests />
      </TestWrapper>
    );
    expect(screen.getByText('Shift Swap Requests')).toBeInTheDocument();
    expect(screen.getByText('Manage shift exchange requests with your team')).toBeInTheDocument();
  it('shows empty state when no swap requests', async () => {
    const { apiRequest } = require('../lib/queryClient');
    apiRequest.mockResolvedValue({
      json: () => Promise.resolve([]),
    });
    await waitFor(() => {
      expect(screen.getByText('No swap requests')).toBeInTheDocument();
  it('opens modal when Request Swap button is clicked', async () => {
    const user = userEvent.setup();
    const addButton = screen.getByText('Request Swap');
    await user.click(addButton);
      expect(screen.getByText('Request Shift Swap')).toBeInTheDocument();
});
