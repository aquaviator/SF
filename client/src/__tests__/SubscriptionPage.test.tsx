import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import Subscription from '@/pages/subscription';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderSubscription = () => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Subscription />
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('Subscription', () => {
  beforeEach(() => {
    // Mock console to avoid warnings in tests
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders subscription page', () => {
    renderSubscription();
    
    expect(screen.getByText('Subscription')).toBeInTheDocument();
    expect(screen.getByText('Manage your plan, billing, and usage')).toBeInTheDocument();
  });

  it('displays all three tabs', () => {
    renderSubscription();
    
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Plans')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
  });

  it('shows current plan information in overview tab', async () => {
    renderSubscription();
    
    await waitFor(() => {
      expect(screen.getByText('Current Plan')).toBeInTheDocument();
      expect(screen.getByText('Professional Plan')).toBeInTheDocument();
      expect(screen.getByText('$49/month • $490/year')).toBeInTheDocument();
    });
  });

  it('displays trial status and extend trial button', async () => {
    renderSubscription();
    
    await waitFor(() => {
      expect(screen.getByText('Trial')).toBeInTheDocument();
      expect(screen.getByText('15 days left in trial')).toBeInTheDocument();
      expect(screen.getByText('Extend Trial')).toBeInTheDocument();
    });
  });

  it('shows plan features', async () => {
    renderSubscription();
    
    await waitFor(() => {
      expect(screen.getByText('Features')).toBeInTheDocument();
      expect(screen.getByText('Up to 50 staff members')).toBeInTheDocument();
      expect(screen.getByText('Unlimited shifts')).toBeInTheDocument();
      expect(screen.getByText('Advanced analytics')).toBeInTheDocument();
    });
  });

  it('displays usage metrics with progress bars', async () => {
    renderSubscription();
    
    await waitFor(() => {
      expect(screen.getByText('Usage')).toBeInTheDocument();
      expect(screen.getByText('Staff Members')).toBeInTheDocument();
      expect(screen.getByText('12 / 50')).toBeInTheDocument();
      expect(screen.getByText('Shifts This Month')).toBeInTheDocument();
      expect(screen.getByText('156 / Unlimited')).toBeInTheDocument();
    });
  });

  it('switches to plans tab and shows available plans', async () => {
    renderSubscription();
    
    fireEvent.click(screen.getByText('Plans'));
    
    await waitFor(() => {
      expect(screen.getByText('Starter')).toBeInTheDocument();
      expect(screen.getByText('Professional')).toBeInTheDocument();
      expect(screen.getByText('Enterprise')).toBeInTheDocument();
      expect(screen.getByText('Most Popular')).toBeInTheDocument();
    });
  });

  it('shows plan pricing and features', async () => {
    renderSubscription();
    
    fireEvent.click(screen.getByText('Plans'));
    
    await waitFor(() => {
      expect(screen.getByText('$19')).toBeInTheDocument();
      expect(screen.getByText('$49')).toBeInTheDocument();
      expect(screen.getByText('$99')).toBeInTheDocument();
      expect(screen.getByText('Up to 10 staff members')).toBeInTheDocument();
    });
  });

  it('switches to billing tab and shows invoice history', async () => {
    renderSubscription();
    
    fireEvent.click(screen.getByText('Billing'));
    
    await waitFor(() => {
      expect(screen.getByText('Billing History')).toBeInTheDocument();
      expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
      expect(screen.getByText('Professional Plan - Monthly')).toBeInTheDocument();
    });
  });

  it('opens billing modal when update billing button is clicked', async () => {
    renderSubscription();
    
    fireEvent.click(screen.getByText('Update Billing'));
    
    await waitFor(() => {
      expect(screen.getByText('Update Billing Information')).toBeInTheDocument();
      expect(screen.getByLabelText('Card Number')).toBeInTheDocument();
      expect(screen.getByLabelText('Expiry Date')).toBeInTheDocument();
      expect(screen.getByLabelText('CVV')).toBeInTheDocument();
    });
  });

  it('fills billing form fields in modal', async () => {
    renderSubscription();
    
    fireEvent.click(screen.getByText('Update Billing'));
    
    await waitFor(() => {
      const cardNumberInput = screen.getByLabelText('Card Number');
      const expiryInput = screen.getByLabelText('Expiry Date');
      const cvvInput = screen.getByLabelText('CVV');
      
      fireEvent.change(cardNumberInput, { target: { value: '1234567890123456' } });
      fireEvent.change(expiryInput, { target: { value: '12/25' } });
      fireEvent.change(cvvInput, { target: { value: '123' } });
      
      expect(cardNumberInput).toHaveValue('1234567890123456');
      expect(expiryInput).toHaveValue('12/25');
      expect(cvvInput).toHaveValue('123');
    });
  });

  it('shows billing address fields in modal', async () => {
    renderSubscription();
    
    fireEvent.click(screen.getByText('Update Billing'));
    
    await waitFor(() => {
      expect(screen.getByLabelText('Cardholder Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Billing Address')).toBeInTheDocument();
      expect(screen.getByLabelText('City')).toBeInTheDocument();
      expect(screen.getByLabelText('Postal Code')).toBeInTheDocument();
      expect(screen.getByLabelText('Country')).toBeInTheDocument();
    });
  });

  it('validates billing form fields', async () => {
    renderSubscription();
    
    fireEvent.click(screen.getByText('Update Billing'));
    
    await waitFor(() => {
      const updateButton = screen.getByText('Update Billing');
      fireEvent.click(updateButton);
    });
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Card number must be 16 digits')).toBeInTheDocument();
      expect(screen.getByText('Invalid expiry date (MM/YY)')).toBeInTheDocument();
      expect(screen.getByText('CVV must be 3 digits')).toBeInTheDocument();
    });
  });

  it('shows plan limits and savings', async () => {
    renderSubscription();
    
    fireEvent.click(screen.getByText('Plans'));
    
    await waitFor(() => {
      expect(screen.getByText('Limits')).toBeInTheDocument();
      expect(screen.getByText('Staff: 10')).toBeInTheDocument();
      expect(screen.getByText('Storage: 10GB')).toBeInTheDocument();
      expect(screen.getByText('save $38')).toBeInTheDocument(); // (19*12) - 190
    });
  });

  it('shows download buttons for paid invoices', async () => {
    renderSubscription();
    
    fireEvent.click(screen.getByText('Billing'));
    
    await waitFor(() => {
      const downloadButtons = screen.getAllByText('Download');
      expect(downloadButtons.length).toBeGreaterThan(0);
    });
  });

  it('handles extend trial button click', async () => {
    renderSubscription();
    
    await waitFor(() => {
      const extendButton = screen.getByText('Extend Trial');
      fireEvent.click(extendButton);
      
      // Button should be clickable
      expect(extendButton).toBeInTheDocument();
    });
  });

  it('shows current plan badge', async () => {
    renderSubscription();
    
    fireEvent.click(screen.getByText('Plans'));
    
    await waitFor(() => {
      expect(screen.getByText('Current Plan')).toBeInTheDocument();
      expect(screen.getByText('Current')).toBeInTheDocument();
    });
  });
});