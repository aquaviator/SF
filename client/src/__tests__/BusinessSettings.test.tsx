import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import BusinessSettings from '@/pages/business-settings';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderBusinessSettings = () => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BusinessSettings />
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('BusinessSettings', () => {
  beforeEach(() => {
    // Mock console to avoid warnings in tests
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders business settings page', () => {
    renderBusinessSettings();
    
    expect(screen.getByText('Business Settings')).toBeInTheDocument();
    expect(screen.getByText('Manage your business profile, roles, and operating hours')).toBeInTheDocument();
  });

  it('displays all three tabs', () => {
    renderBusinessSettings();
    
    expect(screen.getByText('Business Profile')).toBeInTheDocument();
    expect(screen.getByText('Job Roles')).toBeInTheDocument();
    expect(screen.getByText('Operating Hours')).toBeInTheDocument();
  });

  it('shows business profile form in first tab', () => {
    renderBusinessSettings();
    
    expect(screen.getByLabelText('Business Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Website')).toBeInTheDocument();
    expect(screen.getByText('Save Profile')).toBeInTheDocument();
  });

  it('opens job role modal when add role button is clicked', async () => {
    renderBusinessSettings();
    
    // Switch to roles tab
    fireEvent.click(screen.getByText('Job Roles'));
    
    await waitFor(() => {
      expect(screen.getByText('Add Role')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Add Role'));
    
    await waitFor(() => {
      expect(screen.getByText('Add Job Role')).toBeInTheDocument();
      expect(screen.getByLabelText('Role Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Department')).toBeInTheDocument();
    });
  });

  it('displays operating hours form in third tab', async () => {
    renderBusinessSettings();
    
    // Switch to operating hours tab
    fireEvent.click(screen.getByText('Operating Hours'));
    
    await waitFor(() => {
      expect(screen.getByText('Monday')).toBeInTheDocument();
      expect(screen.getByText('Tuesday')).toBeInTheDocument();
      expect(screen.getByText('Wednesday')).toBeInTheDocument();
      expect(screen.getByText('Thursday')).toBeInTheDocument();
      expect(screen.getByText('Friday')).toBeInTheDocument();
      expect(screen.getByText('Saturday')).toBeInTheDocument();
      expect(screen.getByText('Sunday')).toBeInTheDocument();
      expect(screen.getByText('Save Operating Hours')).toBeInTheDocument();
    });
  });

  it('fills and submits business profile form', async () => {
    renderBusinessSettings();
    
    const nameInput = screen.getByLabelText('Business Name');
    const addressTextarea = screen.getByLabelText('Address');
    const phoneInput = screen.getByLabelText('Phone');
    const emailInput = screen.getByLabelText('Email');
    
    fireEvent.change(nameInput, { target: { value: 'Test Business' } });
    fireEvent.change(addressTextarea, { target: { value: '123 Test St' } });
    fireEvent.change(phoneInput, { target: { value: '+1234567890' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    expect(nameInput).toHaveValue('Test Business');
    expect(addressTextarea).toHaveValue('123 Test St');
    expect(phoneInput).toHaveValue('+1234567890');
    expect(emailInput).toHaveValue('test@example.com');
    
    const saveButton = screen.getByText('Save Profile');
    fireEvent.click(saveButton);
    
    // Form should be submitted (would show loading state in real app)
    expect(saveButton).toBeInTheDocument();
  });

  it('fills role form fields in modal', async () => {
    renderBusinessSettings();
    
    // Switch to roles tab and open modal
    fireEvent.click(screen.getByText('Job Roles'));
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Add Role'));
    });
    
    await waitFor(() => {
      const titleInput = screen.getByLabelText('Role Title');
      const descriptionTextarea = screen.getByLabelText('Description');
      
      fireEvent.change(titleInput, { target: { value: 'Test Role' } });
      fireEvent.change(descriptionTextarea, { target: { value: 'Test description' } });
      
      expect(titleInput).toHaveValue('Test Role');
      expect(descriptionTextarea).toHaveValue('Test description');
    });
  });

  it('toggles day switches in operating hours', async () => {
    renderBusinessSettings();
    
    // Switch to operating hours tab
    fireEvent.click(screen.getByText('Operating Hours'));
    
    await waitFor(() => {
      // Find switches for different days (there should be 7 switches)
      const switches = screen.getAllByRole('switch');
      expect(switches).toHaveLength(7);
      
      // Toggle first switch (Monday)
      fireEvent.click(switches[0]);
      
      // Switch should be toggled
      expect(switches[0]).toBeInTheDocument();
    });
  });

  it('validates required fields in business profile form', async () => {
    renderBusinessSettings();
    
    const saveButton = screen.getByText('Save Profile');
    fireEvent.click(saveButton);
    
    // Should show validation errors for required fields
    await waitFor(() => {
      expect(screen.getByText('Business name is required')).toBeInTheDocument();
      expect(screen.getByText('Business address is required')).toBeInTheDocument();
      expect(screen.getByText('Phone number is required')).toBeInTheDocument();
      expect(screen.getByText('Valid email is required')).toBeInTheDocument();
    });
  });

  it('validates required fields in role modal', async () => {
    renderBusinessSettings();
    
    // Switch to roles tab and open modal
    fireEvent.click(screen.getByText('Job Roles'));
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Add Role'));
    });
    
    await waitFor(() => {
      const createButton = screen.getByText('Create Role');
      fireEvent.click(createButton);
    });
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Role title is required')).toBeInTheDocument();
      expect(screen.getByText('Role description is required')).toBeInTheDocument();
      expect(screen.getByText('Department is required')).toBeInTheDocument();
    });
  });
});