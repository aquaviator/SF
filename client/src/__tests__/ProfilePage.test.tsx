import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import Profile from '../pages/profile';
import { AuthProvider } from '../contexts/AuthContext';
import { apiRequest } from '../lib/queryClient';

// Mock the apiRequest function
vi.mock('../lib/queryClient', () => ({
  apiRequest: vi.fn(),
}));
const mockApiRequest = apiRequest as any;
// Mock toast
vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
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
// Mock fetch globally for proper response handling
global.fetch = vi.fn();
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
describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
    
    // Setup default apiRequest mock to return a Promise
    mockApiRequest.mockResolvedValue(new Response(JSON.stringify(mockUser), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));
  it('shows loading spinner initially and then displays profile data', async () => {
    // Mock the fetch response for user data loading
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    });
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );
    // Check that loading spinner shows initially
    expect(screen.getByText('Loading Profile...')).toBeInTheDocument();
    expect(screen.getByText('Please wait while we fetch your information.')).toBeInTheDocument();
    // Wait for data to load and loading to disappear
    await waitFor(() => {
      expect(screen.queryByText('Loading Profile...')).not.toBeInTheDocument();
    }, { timeout: 3000 });
    // Verify profile data is displayed correctly
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    // Edit Profile button should be enabled after loading
    const editButton = screen.getByRole('button', { name: /edit profile/i });
    expect(editButton).toBeEnabled();
  it('shows error state when profile data fails to load', async () => {
    // Mock fetch to reject
    (global.fetch as any).mockRejectedValueOnce(new Error('Failed to fetch'));
    // Wait for error state to appear
      expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
      expect(screen.getByText('Unable to fetch profile data. Please try refreshing the page.')).toBeInTheDocument();
  it('renders profile form and submits correctly with full data merge', async () => {
    // Mock successful data loading
    // Mock the apiRequest for the PUT operation
    mockApiRequest.mockResolvedValueOnce(new Response());
    // Wait for loading to complete
    // Click Edit Profile button
    fireEvent.click(editButton);
    // Wait for modal to open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Update form fields
    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
    fireEvent.change(lastNameInput, { target: { value: 'Smith' } });
    fireEvent.change(emailInput, { target: { value: 'jane.smith@example.com' } });
    // Submit the form
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    // Verify the API call was made with correct merged data
      expect(mockApiRequest).toHaveBeenCalledWith('PUT', '/api/staff/1', {
        username: 'john.doe',      // from existing data
        password: 'password',      // from existing data
        role: 'staff',            // from existing data
        tenantId: 'acme-corp',    // from existing data
        isActive: true,           // from existing data
        firstName: 'Jane',        // from form
        lastName: 'Smith',        // from form
        email: 'jane.smith@example.com', // from form
      });
  it('never shows "Error Profile Data not loaded" message during normal operation', async () => {
    // Ensure the old error message never appears
    expect(screen.queryByText('Error Profile Data not loaded')).not.toBeInTheDocument();
    expect(screen.queryByText('Profile data not loaded')).not.toBeInTheDocument();
});
