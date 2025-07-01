import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Staff from '../pages/staff';
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

describe('Staff Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock API responses
    const { apiRequest } = require('../lib/queryClient');
    apiRequest.mockResolvedValue({
      json: () => Promise.resolve([
        {
          id: 1,
          tenantId: 'acme-corp',
          username: 'sarah.anderson',
          firstName: 'Sarah',
          lastName: 'Anderson',
          email: 'sarah@acme-corp.com',
          isActive: true,
        },
        {
          id: 2,
          tenantId: 'acme-corp',
          username: 'mike.johnson',
          firstName: 'Mike',
          lastName: 'Johnson',
          email: 'mike@acme-corp.com',
          isActive: false,
        }
      ]),
    });
  });

  it('renders staff page with correct title', async () => {
    render(
      <TestWrapper>
        <Staff />
      </TestWrapper>
    );

    expect(screen.getByText('Staff Management')).toBeInTheDocument();
    expect(screen.getByText('Manage your team members and their access')).toBeInTheDocument();
  });

  it('displays staff table with data', async () => {
    render(
      <TestWrapper>
        <Staff />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Sarah Anderson')).toBeInTheDocument();
      expect(screen.getByText('Mike Johnson')).toBeInTheDocument();
      expect(screen.getByText('sarah@acme-corp.com')).toBeInTheDocument();
      expect(screen.getByText('mike@acme-corp.com')).toBeInTheDocument();
    });
  });

  it('shows status badges correctly', async () => {
    render(
      <TestWrapper>
        <Staff />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  it('opens add staff modal when Add Staff button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Staff />
      </TestWrapper>
    );

    const addButton = screen.getByText('Add Staff');
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add Staff Member')).toBeInTheDocument();
    });
  });

  it('renders form fields in add modal', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Staff />
      </TestWrapper>
    );

    const addButton = screen.getByText('Add Staff');
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Staff />
      </TestWrapper>
    );

    // Open modal
    const addButton = screen.getByText('Add Staff');
    await user.click(addButton);

    // Try to submit without filling required fields
    await waitFor(async () => {
      const submitButton = screen.getByText('Add Staff', { selector: 'button' });
      await user.click(submitButton);
    });

    // Modal should remain open (validation failed)
    await waitFor(() => {
      expect(screen.getByText('Add Staff Member')).toBeInTheDocument();
    });
  });

  it('fills form fields correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Staff />
      </TestWrapper>
    );

    const addButton = screen.getByText('Add Staff');
    await user.click(addButton);

    await waitFor(async () => {
      // Fill form fields
      await user.type(screen.getByLabelText('First Name'), 'John');
      await user.type(screen.getByLabelText('Last Name'), 'Doe');
      await user.type(screen.getByLabelText('Email'), 'john@acme-corp.com');
      await user.type(screen.getByLabelText('Username'), 'john.doe');
      await user.type(screen.getByLabelText('Password'), 'password123');
      
      // Check values
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@acme-corp.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john.doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('password123')).toBeInTheDocument();
    });
  });

  it('opens edit modal when edit button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Staff />
      </TestWrapper>
    );

    await waitFor(async () => {
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText('Edit Staff Member')).toBeInTheDocument();
    });
  });

  it('shows empty state when no staff', async () => {
    const { apiRequest } = require('../lib/queryClient');
    apiRequest.mockResolvedValue({
      json: () => Promise.resolve([]),
    });

    render(
      <TestWrapper>
        <Staff />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No staff members')).toBeInTheDocument();
    });
  });

  it('handles delete action', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Staff />
      </TestWrapper>
    );

    await waitFor(async () => {
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);
    });

    // Should handle delete without errors
  });
});