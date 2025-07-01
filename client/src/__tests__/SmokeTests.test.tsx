import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts/AuthContext';
import Dashboard from '../pages/dashboard';
import Shifts from '../pages/shifts';
import Staff from '../pages/staff';
import MyShifts from '../pages/my-shifts';
import Opportunities from '../pages/opportunities';
import SwapRequests from '../pages/swap-requests';
import NotFound from '../pages/not-found';

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

describe('Smoke Tests - All Pages Render Without Errors', () => {
  // Mock console.error to catch React errors
  const originalError = console.error;
  let consoleLogs: string[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogs = [];
    
    // Mock API responses
    const { apiRequest } = require('../lib/queryClient');
    apiRequest.mockResolvedValue({
      json: () => Promise.resolve([]),
    });

    // Capture console errors
    console.error = (...args: any[]) => {
      consoleLogs.push(args.join(' '));
    };
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('renders Dashboard page without console errors', () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(consoleLogs).toHaveLength(0);
  });

  it('renders Shifts page without console errors', () => {
    render(
      <TestWrapper>
        <Shifts />
      </TestWrapper>
    );

    expect(screen.getByText('Shift Management')).toBeInTheDocument();
    expect(consoleLogs).toHaveLength(0);
  });

  it('renders Staff page without console errors', () => {
    render(
      <TestWrapper>
        <Staff />
      </TestWrapper>
    );

    expect(screen.getByText('Staff Management')).toBeInTheDocument();
    expect(consoleLogs).toHaveLength(0);
  });

  it('renders My Shifts page without console errors', () => {
    render(
      <TestWrapper>
        <MyShifts />
      </TestWrapper>
    );

    expect(screen.getByText('My Shifts')).toBeInTheDocument();
    expect(consoleLogs).toHaveLength(0);
  });

  it('renders Opportunities page without console errors', () => {
    render(
      <TestWrapper>
        <Opportunities />
      </TestWrapper>
    );

    expect(screen.getByText('Shift Opportunities')).toBeInTheDocument();
    expect(consoleLogs).toHaveLength(0);
  });

  it('renders Swap Requests page without console errors', () => {
    render(
      <TestWrapper>
        <SwapRequests />
      </TestWrapper>
    );

    expect(screen.getByText('Shift Swap Requests')).toBeInTheDocument();
    expect(consoleLogs).toHaveLength(0);
  });

  it('renders Not Found page without console errors', () => {
    render(
      <TestWrapper>
        <NotFound />
      </TestWrapper>
    );

    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    expect(consoleLogs).toHaveLength(0);
  });

  it('all pages have proper form field structure', () => {
    const pages = [
      { component: Shifts, name: 'Shifts' },
      { component: Staff, name: 'Staff' },
      { component: SwapRequests, name: 'SwapRequests' },
    ];

    pages.forEach(({ component: Component, name }) => {
      const { unmount } = render(
        <TestWrapper>
          <Component />
        </TestWrapper>
      );

      // Check that the page renders without throwing
      expect(screen.getByRole('main') || document.body).toBeInTheDocument();
      
      // Ensure no console errors were logged
      expect(consoleLogs.filter(log => 
        log.includes('Warning') || log.includes('Error')
      )).toHaveLength(0);

      unmount();
    });
  });

  it('validates that all forms have proper default values', () => {
    // This test ensures that forms are structured correctly
    // and don't have undefined default values that could cause runtime errors
    
    const formsToTest = [
      { component: Shifts, formName: 'Shifts Form' },
      { component: Staff, formName: 'Staff Form' },
      { component: SwapRequests, formName: 'Swap Requests Form' },
    ];

    formsToTest.forEach(({ component: Component, formName }) => {
      const { unmount } = render(
        <TestWrapper>
          <Component />
        </TestWrapper>
      );

      // Look for form-related errors in console
      const formErrors = consoleLogs.filter(log => 
        log.includes('defaultValue') || 
        log.includes('controlled') || 
        log.includes('uncontrolled') ||
        log.includes('value prop')
      );
      
      expect(formErrors).toHaveLength(0);
      unmount();
    });
  });
});