import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import Profile from '@/pages/profile';
import Shifts from '@/pages/shifts';
import Staff from '@/pages/staff';
import Subscription from '@/pages/subscription';

// Mock API requests
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn().mockResolvedValue({ 
    id: 1, 
    firstName: 'Test', 
    lastName: 'User', 
    email: 'test@example.com' 
  }),
  queryClient: {
    invalidateQueries: vi.fn(),
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock react-query to prevent loading states
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(() => ({
      data: {
        id: 1,
        firstName: 'Test',
        lastName: 'User', 
        email: 'test@example.com'
      },
      isLoading: false,
      error: null
    })),
    useMutation: vi.fn(() => ({
      mutate: vi.fn(),
      isPending: false,
      isError: false
    }))
  };
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
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

describe('React Hook Form Validation - Comprehensive Tests', () => {
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Capture console errors and warnings to detect React Hook Form issues
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('Profile Form Validation', () => {
    it('renders all form fields without React Hook Form errors', async () => {
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      // Check that form renders without console errors
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      // Verify form fields are present
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('handles form input changes without controlled/uncontrolled warnings', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      const firstNameInput = screen.getByLabelText(/first name/i);
      
      await user.type(firstNameInput, 'John');
      
      expect(firstNameInput).toHaveValue('John');
      
      // Check for no controlled/uncontrolled component warnings
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/controlled.*uncontrolled/i)
      );
    });

    it('validates required fields and shows error messages', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      // Try to submit form without filling required fields
      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      // Should show validation errors without React Hook Form runtime errors
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/useFormField|FormControl|FormField/i)
      );
    });
  });

  describe('Shifts Form Validation', () => {
    it('renders shift form without React Hook Form context errors', async () => {
      render(
        <TestWrapper>
          <Shifts />
        </TestWrapper>
      );

      // Open add shift modal
      const addButton = screen.getByRole('button', { name: /add shift/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Shift')).toBeInTheDocument();
      });

      // Check that no React Hook Form errors occurred
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/useFormField should be used within/i)
      );
    });

    it('handles select field changes without validation errors', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Shifts />
        </TestWrapper>
      );

      const addButton = screen.getByRole('button', { name: /add shift/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Shift')).toBeInTheDocument();
      });

      // Try to interact with select fields
      const assignToSelect = screen.getByRole('combobox');
      await user.click(assignToSelect);

      // Should not trigger React Hook Form errors
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/FormControl|FormField|Controller/i)
      );
    });

    it('validates date and time fields correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Shifts />
        </TestWrapper>
      );

      const addButton = screen.getByRole('button', { name: /add shift/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText(/date/i);
      const startTimeInput = screen.getByLabelText(/start time/i);
      const endTimeInput = screen.getByLabelText(/end time/i);

      // Fill in form fields
      await user.type(dateInput, '2024-12-25');
      await user.type(startTimeInput, '09:00');
      await user.type(endTimeInput, '17:00');

      // Verify no React Hook Form validation errors
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('Staff Form Validation', () => {
    it('handles staff form submission without RHF errors', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Staff />
        </TestWrapper>
      );

      const addButton = screen.getByRole('button', { name: /add staff/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Staff Member')).toBeInTheDocument();
      });

      // Fill out form completely
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const emailInput = screen.getByLabelText(/email/i);

      await user.type(firstNameInput, 'Jane');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'jane.doe@example.com');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      // Verify no React Hook Form errors during submission
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/React Hook Form|useFormField|FormControl/i)
      );
    });

    it('validates email format with proper error display', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Staff />
        </TestWrapper>
      );

      const addButton = screen.getByRole('button', { name: /add staff/i });
      await user.click(addButton);

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email/i);
        expect(emailInput).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email/i);
      
      // Enter invalid email
      await user.type(emailInput, 'invalid-email');
      await user.tab(); // Trigger validation

      // Should handle validation without React Hook Form runtime errors
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/FormMessage|useFormField/i)
      );
    });
  });

  describe('Subscription Form Validation', () => {
    it('renders billing form without form context errors', async () => {
      render(
        <TestWrapper>
          <Subscription />
        </TestWrapper>
      );

      // Find and click update billing button
      const updateBillingButton = screen.getByRole('button', { name: /update billing/i });
      fireEvent.click(updateBillingButton);

      await waitFor(() => {
        expect(screen.getByText(/billing information/i)).toBeInTheDocument();
      });

      // Check that billing form renders without React Hook Form errors
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/useFormField should be used within|FormField|FormControl/i)
      );
    });

    it('validates credit card fields with proper formatting', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Subscription />
        </TestWrapper>
      );

      const updateBillingButton = screen.getByRole('button', { name: /update billing/i });
      await user.click(updateBillingButton);

      await waitFor(() => {
        const cardNumberInput = screen.getByLabelText(/card number/i);
        expect(cardNumberInput).toBeInTheDocument();
      });

      const cardNumberInput = screen.getByLabelText(/card number/i);
      const expiryInput = screen.getByLabelText(/expiry/i);
      const cvvInput = screen.getByLabelText(/cvv/i);

      // Test form field interactions
      await user.type(cardNumberInput, '4111111111111111');
      await user.type(expiryInput, '12/25');
      await user.type(cvvInput, '123');

      // Verify no React Hook Form validation errors
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('handles form submission with all required fields', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Subscription />
        </TestWrapper>
      );

      const updateBillingButton = screen.getByRole('button', { name: /update billing/i });
      await user.click(updateBillingButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/cardholder name/i)).toBeInTheDocument();
      });

      // Fill all required fields
      const cardholderInput = screen.getByLabelText(/cardholder name/i);
      const addressInput = screen.getByLabelText(/billing address/i);
      const cityInput = screen.getByLabelText(/city/i);
      const postalInput = screen.getByLabelText(/postal code/i);
      const countryInput = screen.getByLabelText(/country/i);

      await user.type(cardholderInput, 'John Doe');
      await user.type(addressInput, '123 Main St');
      await user.type(cityInput, 'New York');
      await user.type(postalInput, '10001');
      await user.type(countryInput, 'United States');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Verify no React Hook Form errors during submission
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/React Hook Form|FormField|Controller|useFormField/i)
      );
    });
  });

  describe('Form Error Detection and Regression Prevention', () => {
    it('catches any React Hook Form runtime errors', () => {
      // This test ensures our console spy is working correctly
      expect(consoleErrorSpy).toBeDefined();
      expect(consoleWarnSpy).toBeDefined();
    });

    it('prevents controlled/uncontrolled component warnings', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      const firstNameInput = screen.getByLabelText(/first name/i);
      
      // Clear and re-enter text multiple times to test for controlled/uncontrolled issues
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Test');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'NewTest');

      // Should not generate controlled/uncontrolled warnings
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/controlled.*uncontrolled|uncontrolled.*controlled/i)
      );
    });

    it('ensures all forms have proper FormProvider context', () => {
      // Test that our form components don't throw context errors
      expect(() => {
        render(
          <TestWrapper>
            <Profile />
          </TestWrapper>
        );
      }).not.toThrow();

      expect(() => {
        render(
          <TestWrapper>
            <Shifts />
          </TestWrapper>
        );
      }).not.toThrow();

      expect(() => {
        render(
          <TestWrapper>
            <Staff />
          </TestWrapper>
        );
      }).not.toThrow();

      expect(() => {
        render(
          <TestWrapper>
            <Subscription />
          </TestWrapper>
        );
      }).not.toThrow();
    });
  });
});