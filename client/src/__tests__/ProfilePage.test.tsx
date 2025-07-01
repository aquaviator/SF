import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Profile from '../pages/profile';
import { AuthProvider } from '../contexts/AuthContext';
import { apiRequest } from '../lib/queryClient';

// Mock the apiRequest function
jest.mock('../lib/queryClient', () => ({
  apiRequest: jest.fn(),
}));

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

// Mock user data
const mockUser = {
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  role: 'staff' as const,
  username: 'john.doe',
  password: 'password',
  tenantId: 'acme-corp',
  isActive: true,
};

// Create a wrapper component with providers
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

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the user profile fetch
    mockApiRequest.mockImplementation((method, url) => {
      if (method === 'GET' && url === '/api/users/1') {
        return Promise.resolve(mockUser);
      }
      if (method === 'PUT' && url === '/api/staff/1') {
        return Promise.resolve({ ...mockUser, firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com' });
      }
      return Promise.reject(new Error('Unexpected API call'));
    });
  });

  it('should render profile page and make correct API call when form is submitted', async () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    // Wait for profile data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Open the edit profile modal
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Fill in the form fields
    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const emailInput = screen.getByLabelText(/email/i);

    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
    fireEvent.change(lastNameInput, { target: { value: 'Smith' } });
    fireEvent.change(emailInput, { target: { value: 'jane.smith@example.com' } });

    // Submit the form
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    // Assert the API was called correctly with full user data
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('PUT', '/api/staff/1', {
        username: 'john.doe',
        password: 'password',
        role: 'staff',
        tenantId: 'acme-corp',
        isActive: true,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
      });
    });

    // Verify the API was called exactly once with PUT method
    const putCalls = mockApiRequest.mock.calls.filter(call => call[0] === 'PUT');
    expect(putCalls).toHaveLength(1);
    expect(putCalls[0][0]).toBe('PUT');
    expect(putCalls[0][1]).toBe('/api/staff/1');
    expect(putCalls[0][2]).toEqual({
      username: 'john.doe',
      password: 'password',
      role: 'staff',
      tenantId: 'acme-corp',
      isActive: true,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
    });
  });
});