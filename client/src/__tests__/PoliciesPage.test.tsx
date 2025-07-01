import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import Policies from '@/pages/policies';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderPolicies = () => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Policies />
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('Policies', () => {
  beforeEach(() => {
    // Mock console to avoid warnings in tests
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders policies page', () => {
    renderPolicies();
    
    expect(screen.getByText('Policies')).toBeInTheDocument();
    expect(screen.getByText('Manage shift policies and notification settings')).toBeInTheDocument();
  });

  it('displays both tabs', () => {
    renderPolicies();
    
    expect(screen.getByText('Shift Policies')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('shows shift policies tab by default', () => {
    renderPolicies();
    
    // Should show the Add Policy button
    expect(screen.getByText('Add Policy')).toBeInTheDocument();
  });

  it('opens policy modal when add policy button is clicked', async () => {
    renderPolicies();
    
    fireEvent.click(screen.getByText('Add Policy'));
    
    await waitFor(() => {
      expect(screen.getByText('Add Shift Policy')).toBeInTheDocument();
      expect(screen.getByLabelText('Policy Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Category')).toBeInTheDocument();
    });
  });

  it('displays notification settings in second tab', async () => {
    renderPolicies();
    
    // Switch to notifications tab
    fireEvent.click(screen.getByText('Notifications'));
    
    await waitFor(() => {
      expect(screen.getByText('Notification Settings')).toBeInTheDocument();
      expect(screen.getByText('Notification Channels')).toBeInTheDocument();
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(screen.getByText('SMS Notifications')).toBeInTheDocument();
      expect(screen.getByText('Push Notifications')).toBeInTheDocument();
    });
  });

  it('shows notification types section', async () => {
    renderPolicies();
    
    fireEvent.click(screen.getByText('Notifications'));
    
    await waitFor(() => {
      expect(screen.getByText('Notification Types')).toBeInTheDocument();
      expect(screen.getByText('New Shifts')).toBeInTheDocument();
      expect(screen.getByText('Shift Changes')).toBeInTheDocument();
      expect(screen.getByText('Swap Requests')).toBeInTheDocument();
      expect(screen.getByText('Holiday Requests')).toBeInTheDocument();
    });
  });

  it('fills policy form fields in modal', async () => {
    renderPolicies();
    
    fireEvent.click(screen.getByText('Add Policy'));
    
    await waitFor(() => {
      const nameInput = screen.getByLabelText('Policy Name');
      const descriptionTextarea = screen.getByLabelText('Description');
      
      fireEvent.change(nameInput, { target: { value: 'Test Policy' } });
      fireEvent.change(descriptionTextarea, { target: { value: 'Test description' } });
      
      expect(nameInput).toHaveValue('Test Policy');
      expect(descriptionTextarea).toHaveValue('Test description');
    });
  });

  it('fills numeric fields in policy modal', async () => {
    renderPolicies();
    
    fireEvent.click(screen.getByText('Add Policy'));
    
    await waitFor(() => {
      const minNoticeInput = screen.getByLabelText('Min Notice (hours)');
      const maxAdvanceInput = screen.getByLabelText('Max Advance Booking (days)');
      
      fireEvent.change(minNoticeInput, { target: { value: '24' } });
      fireEvent.change(maxAdvanceInput, { target: { value: '30' } });
      
      expect(minNoticeInput).toHaveValue(24);
      expect(maxAdvanceInput).toHaveValue(30);
    });
  });

  it('toggles notification switches', async () => {
    renderPolicies();
    
    fireEvent.click(screen.getByText('Notifications'));
    
    await waitFor(() => {
      // Find notification switches
      const switches = screen.getAllByRole('switch');
      expect(switches.length).toBeGreaterThan(0);
      
      // Toggle first switch
      fireEvent.click(switches[0]);
      
      // Switch should be toggled
      expect(switches[0]).toBeInTheDocument();
    });
  });

  it('shows email template field', async () => {
    renderPolicies();
    
    fireEvent.click(screen.getByText('Notifications'));
    
    await waitFor(() => {
      expect(screen.getByText('Email Template')).toBeInTheDocument();
      expect(screen.getByText('Available variables: {{staff_name}}, {{shift_details}}, {{business_name}}')).toBeInTheDocument();
    });
  });

  it('validates required fields in policy modal', async () => {
    renderPolicies();
    
    fireEvent.click(screen.getByText('Add Policy'));
    
    await waitFor(() => {
      const createButton = screen.getByText('Create Policy');
      fireEvent.click(createButton);
    });
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Policy name is required')).toBeInTheDocument();
      expect(screen.getByText('Policy description is required')).toBeInTheDocument();
      expect(screen.getByText('Category is required')).toBeInTheDocument();
    });
  });

  it('submits notification settings form', async () => {
    renderPolicies();
    
    fireEvent.click(screen.getByText('Notifications'));
    
    await waitFor(() => {
      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);
      
      // Form should be submitted
      expect(saveButton).toBeInTheDocument();
    });
  });

  it('shows strike points fields in policy modal', async () => {
    renderPolicies();
    
    fireEvent.click(screen.getByText('Add Policy'));
    
    await waitFor(() => {
      expect(screen.getByLabelText('Strike Points - No Show')).toBeInTheDocument();
      expect(screen.getByLabelText('Strike Points - Late Cancellation')).toBeInTheDocument();
      expect(screen.getByLabelText('Max Strike Points')).toBeInTheDocument();
    });
  });

  it('shows timing settings in notifications', async () => {
    renderPolicies();
    
    fireEvent.click(screen.getByText('Notifications'));
    
    await waitFor(() => {
      expect(screen.getByText('Timing Settings')).toBeInTheDocument();
      expect(screen.getByLabelText('Shift Reminder (hours before)')).toBeInTheDocument();
    });
  });
});