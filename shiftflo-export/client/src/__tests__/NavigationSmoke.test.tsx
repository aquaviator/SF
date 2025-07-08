import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

// Mock the AuthContext hook
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    role: 'owner',
    tenantId: 'test-tenant',
    user: {
      id: '1',
      firstName: 'Test',
      lastName: 'Owner',
      email: 'owner@test.com'
    },
    switchRole: vi.fn(),
    isAuthenticated: true
  })),
}));

describe('Navigation Components', () => {
  it('renders BottomTabBar with correct accessibility attributes', () => {
    const mockOnMoreClick = vi.fn();
    render(<BottomTabBar onMoreClick={mockOnMoreClick} />);

    // Check navigation role and aria-label
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');

    // Check that More button exists and is clickable
    const moreButton = screen.getByLabelText('Open more options menu');
    expect(moreButton).toBeInTheDocument();
    
    fireEvent.click(moreButton);
    expect(mockOnMoreClick).toHaveBeenCalledTimes(1);
  });

  it('renders MoreDrawer with proper accessibility when open', () => {
    const mockOnClose = vi.fn();
    render(<MoreDrawer isOpen={true} onClose={mockOnClose} />);

    // Check dialog attributes
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'drawer-title');

    // Check drawer title
    expect(screen.getByText('More Options')).toBeInTheDocument();

    // Check close button functionality
    const closeButton = screen.getByLabelText('Close more options menu');
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('MoreDrawer does not render when closed', () => {
    const mockOnClose = vi.fn();
    render(<MoreDrawer isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByText('More Options')).not.toBeInTheDocument();
  });

  it('all navigation buttons meet minimum touch target size', () => {
    const mockOnMoreClick = vi.fn();
    render(<BottomTabBar onMoreClick={mockOnMoreClick} />);

    // Check all links have minimum touch target size
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveClass('min-w-[48px]', 'min-h-[48px]');
    });

    // Check more button has minimum touch target size
    const moreButton = screen.getByRole('button');
    expect(moreButton).toHaveClass('min-w-[48px]', 'min-h-[48px]');
  });

  it('navigation has proper focus management', () => {
    const mockOnMoreClick = vi.fn();
    render(<BottomTabBar onMoreClick={mockOnMoreClick} />);

    // Check focus styles are applied
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
    });

    const moreButton = screen.getByRole('button');
    expect(moreButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
  });
});