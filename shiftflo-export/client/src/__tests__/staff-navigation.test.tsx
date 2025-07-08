import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import App from '../App';

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock AuthContext to return staff role
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    role: 'staff',
    tenantId: 'acme-corp',
    user: { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@acme-corp.com' },
    switchRole: vi.fn(),
    isAuthenticated: true
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children
}));

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
      <Router>
        {children}
      </Router>
    </QueryClientProvider>
  );
}

describe('Staff Navigation to Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup successful fetch responses
    mockFetch.mockImplementation((url) => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });
  });

  it('should navigate to dashboard when staff clicks Dashboard link', async () => {
    render(<App />, { wrapper: createWrapper() });

    // Should see staff navigation
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Click the Dashboard link
    fireEvent.click(screen.getByText('Dashboard'));

    // Should navigate to dashboard and show staff dashboard content
    await waitFor(() => {
      expect(screen.getByText('My Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Your personalized shift schedule and opportunities')).toBeInTheDocument();
    });
  });

  it('should show correct route for staff dashboard link', () => {
    render(<App />, { wrapper: createWrapper() });
    
    // Find Dashboard link and check its href
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
  });
});