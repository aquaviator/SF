import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { BottomTabBar } from '@/components/BottomTabBar';
import { MoreDrawer } from '@/components/MoreDrawer';

// Mock wouter
vi.mock('wouter', () => ({
  Link: ({ children, href, onClick, ...props }: any) => (
    <a href={href} onClick={onClick} {...props}>
      {children}
    </a>
  ),
  useLocation: () => ['/owner/dashboard'],
}));

// Mock the AuthContext hook directly
const mockUseAuth = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: mockUseAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const setupAuthMock = (role: 'owner' | 'staff') => {
  mockUseAuth.mockReturnValue({
    role: role,
    tenantId: 'test-tenant',
    user: {
      id: '1',
      firstName: 'Test',
      lastName: role === 'owner' ? 'Owner' : 'Staff',
      email: `${role}@test.com`
    },
    switchRole: vi.fn(),
    isAuthenticated: true
  });
};

describe('BottomTabBar', () => {
  const mockOnMoreClick = vi.fn();

  beforeEach(() => {
    mockOnMoreClick.mockClear();
  });

  it('renders owner navigation tabs correctly', () => {
    setupAuthMock('owner');
    render(<BottomTabBar onMoreClick={mockOnMoreClick} />);

    // Check owner-specific tabs
    expect(screen.getByLabelText('Navigate to owner dashboard')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to scheduling management')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to workforce management')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to analytics dashboard')).toBeInTheDocument();
    expect(screen.getByLabelText('Open more options menu')).toBeInTheDocument();

    // Check tab labels
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Scheduling')).toBeInTheDocument();
    expect(screen.getByText('Workforce')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();
  });

  it('renders staff navigation tabs correctly', () => {
    setupAuthMock('staff');
    render(<BottomTabBar onMoreClick={mockOnMoreClick} />);

    // Check staff-specific tabs
    expect(screen.getByLabelText('Navigate to staff dashboard')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to my shifts')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to swap requests')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to account profile')).toBeInTheDocument();
    expect(screen.getByLabelText('Open more options menu')).toBeInTheDocument();

    // Check tab labels
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('My Work')).toBeInTheDocument();
    expect(screen.getByText('Requests')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();
  });

  it('calls onMoreClick when More button is pressed', () => {
    render(
      <MockAuthProvider role="owner">
        <BottomTabBar onMoreClick={mockOnMoreClick} />
      </MockAuthProvider>
    );

    const moreButton = screen.getByLabelText('Open more options menu');
    fireEvent.click(moreButton);

    expect(mockOnMoreClick).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility attributes', () => {
    render(
      <MockAuthProvider role="owner">
        <BottomTabBar onMoreClick={mockOnMoreClick} />
      </MockAuthProvider>
    );

    // Check navigation role and aria-label
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');

    // Check all buttons have minimum touch target size
    const buttons = screen.getAllByRole('link');
    buttons.forEach(button => {
      expect(button).toHaveClass('min-w-[48px]', 'min-h-[48px]');
    });

    const moreButton = screen.getByRole('button');
    expect(moreButton).toHaveClass('min-w-[48px]', 'min-h-[48px]');
  });
});

describe('MoreDrawer', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders owner drawer items correctly when open', () => {
    render(
      <MockAuthProvider role="owner">
        <MoreDrawer isOpen={true} onClose={mockOnClose} />
      </MockAuthProvider>
    );

    // Check drawer title
    expect(screen.getByText('More Options')).toBeInTheDocument();

    // Check owner-specific items
    expect(screen.getByLabelText('Navigate to policies management')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to subscription management')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to activity logs')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to help and support')).toBeInTheDocument();

    // Check section titles
    expect(screen.getByText('Management')).toBeInTheDocument();
    expect(screen.getByText('Business Settings')).toBeInTheDocument();

    // Check menu labels
    expect(screen.getByText('Policies')).toBeInTheDocument();
    expect(screen.getByText('Subscription')).toBeInTheDocument();
    expect(screen.getByText('Activity Logs')).toBeInTheDocument();
    expect(screen.getByText('Help & Support')).toBeInTheDocument();
  });

  it('renders staff drawer items correctly when open', () => {
    render(
      <MockAuthProvider role="staff">
        <MoreDrawer isOpen={true} onClose={mockOnClose} />
      </MockAuthProvider>
    );

    // Check drawer title
    expect(screen.getByText('More Options')).toBeInTheDocument();

    // Check staff-specific items
    expect(screen.getByLabelText('Navigate to my calendar')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to shift opportunities')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to swap requests')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to my performance')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to help and support')).toBeInTheDocument();

    // Check section title
    expect(screen.getByText('My Work')).toBeInTheDocument();

    // Check menu labels
    expect(screen.getByText('My Calendar')).toBeInTheDocument();
    expect(screen.getByText('Opportunities')).toBeInTheDocument();
    expect(screen.getByText('Swap Requests')).toBeInTheDocument();
    expect(screen.getByText('My Performance')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <MockAuthProvider role="owner">
        <MoreDrawer isOpen={false} onClose={mockOnClose} />
      </MockAuthProvider>
    );

    expect(screen.queryByText('More Options')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <MockAuthProvider role="owner">
        <MoreDrawer isOpen={true} onClose={mockOnClose} />
      </MockAuthProvider>
    );

    const closeButton = screen.getByLabelText('Close more options menu');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('handles business settings collapsible correctly', () => {
    render(
      <MockAuthProvider role="owner">
        <MoreDrawer isOpen={true} onClose={mockOnClose} />
      </MockAuthProvider>
    );

    // Business Settings should be collapsible
    const businessSettingsButton = screen.getByRole('button', { name: /business settings/i });
    expect(businessSettingsButton).toHaveAttribute('aria-expanded', 'false');

    // Initially collapsed, business profile link should not be visible
    expect(screen.queryByText('Business Profile')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(businessSettingsButton);

    // Now business settings items should be visible
    expect(screen.getByText('Business Profile')).toBeInTheDocument();
    expect(screen.getByText('Job Roles')).toBeInTheDocument();
    expect(screen.getByText('Operating Hours')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <MockAuthProvider role="owner">
        <MoreDrawer isOpen={true} onClose={mockOnClose} />
      </MockAuthProvider>
    );

    // Check dialog attributes
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'drawer-title');

    // Check navigation role
    const nav = screen.getByRole('navigation', { name: 'More options navigation' });
    expect(nav).toBeInTheDocument();

    // Check all links have minimum touch target size
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveClass('min-h-[48px]');
    });
  });
});

describe('Navigation Integration', () => {
  it('owner role shows different navigation items than staff role', () => {
    const { rerender } = render(
      <MockAuthProvider role="owner">
        <BottomTabBar onMoreClick={() => {}} />
      </MockAuthProvider>
    );

    // Owner should see Analytics tab
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.queryByText('Account')).not.toBeInTheDocument();

    // Rerender with staff role
    rerender(
      <MockAuthProvider role="staff">
        <BottomTabBar onMoreClick={() => {}} />
      </MockAuthProvider>
    );

    // Staff should see Account tab, not Analytics
    expect(screen.queryByText('Analytics')).not.toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  it('navigation items have correct paths for each role', () => {
    render(
      <MockAuthProvider role="owner">
        <BottomTabBar onMoreClick={() => {}} />
      </MockAuthProvider>
    );

    // Check owner paths
    expect(screen.getByLabelText('Navigate to owner dashboard')).toHaveAttribute('href', '/owner/dashboard');
    expect(screen.getByLabelText('Navigate to scheduling management')).toHaveAttribute('href', '/owner/scheduling');
    expect(screen.getByLabelText('Navigate to workforce management')).toHaveAttribute('href', '/owner/workforce');
    expect(screen.getByLabelText('Navigate to analytics dashboard')).toHaveAttribute('href', '/owner/analytics');
  });
});