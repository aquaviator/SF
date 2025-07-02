import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

// Simple test component that uses our form components
const TestFormComponent = () => {
  const form = useForm({
    defaultValues: {
      testField: '',
    },
  });

  return (
    <FormProvider {...form}>
      <form>
        <FormField
          control={form.control}
          name="testField"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Test Field</FormLabel>
              <FormControl>
                <Input placeholder="Enter test value" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </FormProvider>
  );
};

// Component without FormProvider to test error handling
const TestComponentWithoutProvider = () => {
  return (
    <FormItem>
      <FormLabel>Test Field</FormLabel>
      <FormControl>
        <Input placeholder="Enter test value" />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

describe('React Hook Form Error Regression Tests', () => {
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Capture console errors and warnings to detect React Hook Form issues
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
    consoleWarnSpy?.mockRestore();
  });

  describe('Form Component Validation', () => {
    it('renders form components without React Hook Form errors', () => {
      render(<TestFormComponent />);

      // Check that form renders without console errors
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      // Verify form field is present
      expect(screen.getByLabelText(/test field/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter test value/i)).toBeInTheDocument();
    });

    it('handles missing FormProvider gracefully without crashing', () => {
      // Our improved useFormField should handle missing context gracefully
      expect(() => {
        render(<TestComponentWithoutProvider />);
      }).not.toThrow();

      // Should not generate React Hook Form errors
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/useFormField should be used within|FormField|FormControl/i)
      );
    });

    it('provides proper form field IDs and accessibility attributes', () => {
      render(<TestFormComponent />);

      const input = screen.getByLabelText(/test field/i);
      
      // Check that input has proper ID and accessibility attributes
      expect(input).toHaveAttribute('id');
      expect(input).toHaveAttribute('aria-describedby');
      
      const label = screen.getByText('Test Field');
      expect(label).toHaveAttribute('for');
      
      // Verify no accessibility warnings
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/aria-|accessibility|form/i)
      );
    });

    it('prevents controlled/uncontrolled component warnings', () => {
      render(<TestFormComponent />);

      const input = screen.getByLabelText(/test field/i);
      
      // Simulate value changes that could trigger controlled/uncontrolled warnings
      input.focus();
      
      // Should not generate controlled/uncontrolled warnings
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/controlled.*uncontrolled|uncontrolled.*controlled/i)
      );
    });
  });

  describe('Form Context Error Prevention', () => {
    it('detects and prevents useFormField context errors', () => {
      // Test that our form components can handle missing context
      render(<TestComponentWithoutProvider />);

      // Should render without throwing errors
      expect(screen.getByText('Test Field')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter test value/i)).toBeInTheDocument();

      // Should not generate useFormField errors
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/useFormField should be used within <FormField>/i)
      );
    });

    it('ensures FormField components have proper structure', () => {
      render(<TestFormComponent />);

      // Check that all form components are present and structured correctly
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      
      // Verify no structural errors
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/FormItem|FormLabel|FormControl|FormMessage/i)
      );
    });

    it('validates form field registration works correctly', () => {
      render(<TestFormComponent />);

      const input = screen.getByLabelText(/test field/i);
      
      // Input should be properly registered with React Hook Form
      expect(input).toHaveAttribute('name', 'testField');
      
      // Should not generate registration errors
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/register|field.*not.*found|Controller/i)
      );
    });
  });

  describe('Form Error State Management', () => {
    it('handles form validation errors without console errors', () => {
      const TestFormWithValidation = () => {
        const form = useForm({
          defaultValues: {
            requiredField: '',
          },
          mode: 'onChange',
        });

        return (
          <FormProvider {...form}>
            <form>
              <FormField
                control={form.control}
                name="requiredField"
                rules={{ required: 'This field is required' }}
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Required Field</FormLabel>
                    <FormControl>
                      <Input placeholder="Required input" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </FormProvider>
        );
      };

      render(<TestFormWithValidation />);

      // Should render without errors even with validation rules
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('prevents React Hook Form runtime exceptions', () => {
      // This test ensures our form components don't cause runtime exceptions
      expect(() => {
        render(<TestFormComponent />);
      }).not.toThrow(/React Hook Form|useFormField|FormControl|FormField/);
    });
  });
});