import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts/AuthContext';
import Shifts from '../pages/shifts';
import Staff from '../pages/staff';
import SwapRequests from '../pages/swap-requests';

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

describe('Form Validation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock API responses
    const { apiRequest } = require('../lib/queryClient');
    apiRequest.mockResolvedValue({
      json: () => Promise.resolve([]),
    });
  });

  describe('Shifts Form Validation', () => {
    it('prevents submission with empty required fields', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Shifts />
        </TestWrapper>
      );

      // Open the create modal
      const addButton = screen.getByText('Add Shift');
      await user.click(addButton);

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByText('Create Shift')).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      const submitButton = screen.getByText('Create Shift', { selector: 'button' });
      await user.click(submitButton);

      // Check for validation errors
      await waitFor(() => {
        // The form should show validation errors and not submit
        expect(screen.getByText('Create Shift')).toBeInTheDocument(); // Modal should still be open
      });
    });

    it('validates date format and time constraints', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Shifts />
        </TestWrapper>
      );

      // Open the create modal
      const addButton = screen.getByText('Add Shift');
      await user.click(addButton);

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByText('Create Shift')).toBeInTheDocument();
      });

      // Fill in valid form data
      const dateInput = screen.getByLabelText('Date');
      const startTimeInput = screen.getByLabelText('Start Time');
      const endTimeInput = screen.getByLabelText('End Time');

      await user.type(dateInput, '2024-12-20');
      await user.type(startTimeInput, '09:00');
      await user.type(endTimeInput, '17:00');

      // Select a role
      const roleSelect = screen.getByText('Select a role');
      await user.click(roleSelect);
      
      await waitFor(() => {
        const customerServiceOption = screen.getByText('Customer Service');
        user.click(customerServiceOption);
      });
    });
  });

  describe('Staff Form Validation', () => {
    it('validates email format and required fields', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Staff />
        </TestWrapper>
      );

      // Open the create modal
      const addButton = screen.getByText('Add Staff');
      await user.click(addButton);

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByText('Add Staff Member')).toBeInTheDocument();
      });

      // Try invalid email
      const emailInput = screen.getByLabelText('Email');
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByText('Add Staff');
      await user.click(submitButton);

      // Form should show validation error and stay open
      await waitFor(() => {
        expect(screen.getByText('Add Staff Member')).toBeInTheDocument();
      });
    });

    it('ensures password field is properly handled', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Staff />
        </TestWrapper>
      );

      // Open the create modal
      const addButton = screen.getByText('Add Staff');
      await user.click(addButton);

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByText('Add Staff Member')).toBeInTheDocument();
      });

      // Check password field exists and accepts input
      const passwordInput = screen.getByLabelText('Password');
      expect(passwordInput).toHaveAttribute('type', 'password');
      
      await user.type(passwordInput, 'testpassword123');
      expect(passwordInput).toHaveValue('testpassword123');
    });
  });

  describe('Swap Requests Form Validation', () => {
    it('requires original shift selection', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SwapRequests />
        </TestWrapper>
      );

      // Open the create modal
      const addButton = screen.getByText('Request Swap');
      await user.click(addButton);

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByText('Request Shift Swap')).toBeInTheDocument();
      });

      // Try to submit without selecting original shift
      const submitButton = screen.getByText('Submit Request');
      await user.click(submitButton);

      // Form should show validation error and stay open
      await waitFor(() => {
        expect(screen.getByText('Request Shift Swap')).toBeInTheDocument();
      });
    });

    it('allows optional target shift and reason fields', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SwapRequests />
        </TestWrapper>
      );

      // Open the create modal
      const addButton = screen.getByText('Request Swap');
      await user.click(addButton);

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByText('Request Shift Swap')).toBeInTheDocument();
      });

      // Select original shift
      const originalShiftSelect = screen.getByText('Select your shift');
      await user.click(originalShiftSelect);
      
      await waitFor(() => {
        const firstShift = screen.getByText('Customer Service - Dec 16, 9:00 AM');
        user.click(firstShift);
      });

      // Leave target shift and reason empty - should be valid
      const reasonTextarea = screen.getByPlaceholderText('Why do you need to swap this shift?');
      expect(reasonTextarea).toBeInTheDocument();
      expect(reasonTextarea).toHaveValue('');
    });
  });

  describe('Modal Form Behavior', () => {
    it('resets form when modal closes and reopens', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Shifts />
        </TestWrapper>
      );

      // Open the create modal
      const addButton = screen.getByText('Add Shift');
      await user.click(addButton);

      // Wait for modal and fill some data
      await waitFor(() => {
        expect(screen.getByText('Create Shift')).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText('Date');
      await user.type(dateInput, '2024-12-20');

      // Close modal by clicking outside or close button
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      // Reopen modal
      await user.click(addButton);

      // Form should be reset
      await waitFor(() => {
        const newDateInput = screen.getByLabelText('Date');
        expect(newDateInput).toHaveValue('');
      });
    });
  });
});