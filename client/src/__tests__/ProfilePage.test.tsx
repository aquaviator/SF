import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../contexts/AuthContext";
import Profile from "../pages/profile";

// Mock the API request function
vi.mock("../lib/queryClient", () => ({
  apiRequest: vi.fn(),
}));

// Mock toast
vi.mock("../hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

import { apiRequest } from "../lib/queryClient";

const mockApiRequest = apiRequest as any;

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
    vi.clearAllMocks();
    
    // Mock fetch for profile data retrieval
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });
    
    // Mock successful user data fetch
    mockApiRequest.mockResolvedValue(mockUser);
  });

  it('renders profile form with user data', async () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    expect(screen.getByText('Profile')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    expect(mockApiRequest).toHaveBeenCalled();
  });
});