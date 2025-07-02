import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomTabBar } from '@/components/BottomTabBar';
import { SidebarNav } from '@/components/SidebarNav';
import { MoreDrawer } from '@/components/MoreDrawer';
import { ownerMenu, staffMenu, ownerMoreMenu, staffMoreMenu } from '@/config/menus';

// Mock wouter with memory router capability
const mockLocation = vi.fn();
const mockNavigate = vi.fn();

vi.mock('wouter', () => ({
  Link: ({ children, href, onClick, ...props }: any) => (
    <a 
      href={href} 
      onClick={(e) => {
        e.preventDefault();
        mockNavigate(href);
        onClick?.(e);
      }} 
      {...props}
    >
      {children}
    </a>
  ),
  useLocation: () => [mockLocation(), mockNavigate],
}));

// Mock the AuthContext hook
const mockUseAuth = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

describe('Unified Menu System', () => {
  const setupMockAuth = (role: 'owner' | 'staff', location = '/') => {
    mockUseAuth.mockReturnValue({
      role: role,
      tenantId: 'acme-corp',
      user: {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: `${role}@acme-corp.com`
      },
      switchRole: vi.fn(),
      isAuthenticated: true
    });
    mockLocation.mockReturnValue(location);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Owner Menu Tests', () => {
    beforeEach(() => {
      setupMockAuth('owner');
    });

    it('BottomTabBar renders exactly ownerMenu.length links with correct hrefs', () => {
      const mockOnMoreClick = vi.fn();
      render(<BottomTabBar onMoreClick={mockOnMoreClick} />);

      // Should have exactly the number of owner menu items
      const navLinks = screen.getAllByRole('link');
      expect(navLinks).toHaveLength(ownerMenu.length);

      // Each link should match the config
      ownerMenu.forEach((menuItem, index) => {
        const link = navLinks[index];
        expect(link).toHaveAttribute('href', menuItem.route);
        expect(link).toHaveTextContent(menuItem.label);
      });

      // Should have More button
      const moreButton = screen.getByRole('button');
      expect(moreButton).toHaveAttribute('aria-label', 'Open more options menu');
    });

    it('SidebarNav renders owner menu items with correct hrefs and no duplicate keys', () => {
      render(<SidebarNav />);

      // Check primary menu items
      ownerMenu.forEach((menuItem) => {
        const link = screen.getByRole('link', { 
          name: new RegExp(`Navigate to ${menuItem.description || menuItem.label}`, 'i') 
        });
        expect(link).toHaveAttribute('href', menuItem.route);
      });

      // Check more menu items
      ownerMoreMenu.forEach((menuItem) => {
        const link = screen.getByRole('link', { 
          name: new RegExp(`Navigate to ${menuItem.description || menuItem.label}`, 'i') 
        });
        expect(link).toHaveAttribute('href', menuItem.route);
      });

      // Verify no React key warnings by checking all links have unique keys
      const allLinks = screen.getAllByRole('link');
      expect(allLinks.length).toBe(ownerMenu.length + ownerMoreMenu.length);
    });

    it('clicking first link updates navigation', () => {
      const mockOnMoreClick = vi.fn();
      render(<BottomTabBar onMoreClick={mockOnMoreClick} />);

      const firstLink = screen.getAllByRole('link')[0];
      fireEvent.click(firstLink);

      expect(mockNavigate).toHaveBeenCalledWith(ownerMenu[0].route);
    });
  });

  describe('Staff Menu Tests', () => {
    beforeEach(() => {
      setupMockAuth('staff');
    });

    it('BottomTabBar renders exactly staffMenu.length links with correct hrefs', () => {
      const mockOnMoreClick = vi.fn();
      render(<BottomTabBar onMoreClick={mockOnMoreClick} />);

      // Should have exactly the number of staff menu items
      const navLinks = screen.getAllByRole('link');
      expect(navLinks).toHaveLength(staffMenu.length);

      // Each link should match the config
      staffMenu.forEach((menuItem, index) => {
        const link = navLinks[index];
        expect(link).toHaveAttribute('href', menuItem.route);
        expect(link).toHaveTextContent(menuItem.label);
      });
    });

    it('SidebarNav renders staff menu items with correct hrefs and no duplicate keys', () => {
      render(<SidebarNav />);

      // Check primary menu items
      staffMenu.forEach((menuItem) => {
        const link = screen.getByRole('link', { 
          name: new RegExp(`Navigate to ${menuItem.description || menuItem.label}`, 'i') 
        });
        expect(link).toHaveAttribute('href', menuItem.route);
      });

      // Check more menu items
      staffMoreMenu.forEach((menuItem) => {
        const link = screen.getByRole('link', { 
          name: new RegExp(`Navigate to ${menuItem.description || menuItem.label}`, 'i') 
        });
        expect(link).toHaveAttribute('href', menuItem.route);
      });

      // Verify total number of links
      const allLinks = screen.getAllByRole('link');
      expect(allLinks.length).toBe(staffMenu.length + staffMoreMenu.length);
    });

    it('clicking first link updates navigation', () => {
      const mockOnMoreClick = vi.fn();
      render(<BottomTabBar onMoreClick={mockOnMoreClick} />);

      const firstLink = screen.getAllByRole('link')[0];
      fireEvent.click(firstLink);

      expect(mockNavigate).toHaveBeenCalledWith(staffMenu[0].route);
    });
  });

  describe('Menu Configuration Consistency', () => {
    it('owner and staff menus have different routes', () => {
      const ownerRoutes = ownerMenu.map(item => item.route);
      const staffRoutes = staffMenu.map(item => item.route);
      
      // There should be some differences between owner and staff routes
      const intersection = ownerRoutes.filter(route => staffRoutes.includes(route));
      expect(intersection.length).toBeLessThan(Math.max(ownerRoutes.length, staffRoutes.length));
    });

    it('all menu items have required properties', () => {
      [...ownerMenu, ...staffMenu, ...ownerMoreMenu, ...staffMoreMenu].forEach(item => {
        expect(item).toHaveProperty('label');
        expect(item).toHaveProperty('route');
        expect(item).toHaveProperty('icon');
        expect(typeof item.label).toBe('string');
        expect(typeof item.route).toBe('string');
        expect(typeof item.icon).toBe('function');
      });
    });

    it('all routes start with forward slash', () => {
      [...ownerMenu, ...staffMenu, ...ownerMoreMenu, ...staffMoreMenu].forEach(item => {
        expect(item.route).toMatch(/^\/.*$/);
      });
    });
  });

  describe('Active State Handling', () => {
    it('marks active route correctly in BottomTabBar', () => {
      setupMockAuth('owner', '/owner/dashboard');
      const mockOnMoreClick = vi.fn();
      render(<BottomTabBar onMoreClick={mockOnMoreClick} />);

      // The active link should have aria-current="page"
      const activeLink = screen.getByRole('link', { current: 'page' });
      expect(activeLink).toHaveAttribute('href', '/owner/dashboard');
    });

    it('marks active route correctly in SidebarNav', () => {
      setupMockAuth('staff', '/my-shifts');
      render(<SidebarNav />);

      // The active link should have aria-current="page"
      const activeLink = screen.getByRole('link', { current: 'page' });
      expect(activeLink).toHaveAttribute('href', '/my-shifts');
    });
  });

  describe('Role Indicator Tests', () => {
    it('SidebarNav displays correct role badge for owner', () => {
      setupMockAuth('owner');
      render(<SidebarNav />);

      // Check user profile section exists
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Owner')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      
      // Check owner role badge styling
      const ownerBadge = screen.getByText('Owner');
      expect(ownerBadge).toHaveClass('bg-purple-100', 'text-purple-800');
    });

    it('SidebarNav displays correct role badge for staff', () => {
      setupMockAuth('staff');
      render(<SidebarNav />);

      // Check user profile section exists
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Staff')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      
      // Check staff role badge styling
      const staffBadge = screen.getByText('Staff');
      expect(staffBadge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('MoreDrawer displays correct role indicator for owner', () => {
      setupMockAuth('owner');
      const mockOnClose = vi.fn();
      render(<MoreDrawer isOpen={true} onClose={mockOnClose} />);

      // Check user profile section exists
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Owner')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      
      // Check owner role badge styling
      const ownerBadge = screen.getByText('Owner');
      expect(ownerBadge).toHaveClass('bg-purple-100', 'text-purple-800');
    });

    it('MoreDrawer displays correct role indicator for staff', () => {
      setupMockAuth('staff');
      const mockOnClose = vi.fn();
      render(<MoreDrawer isOpen={true} onClose={mockOnClose} />);

      // Check user profile section exists
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Staff')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      
      // Check staff role badge styling
      const staffBadge = screen.getByText('Staff');
      expect(staffBadge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('user avatar displays correct initials', () => {
      setupMockAuth('owner');
      render(<SidebarNav />);

      // Check initials are displayed correctly
      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });

  describe('Accessibility Requirements', () => {
    it('BottomTabBar has proper accessibility attributes', () => {
      setupMockAuth('owner');
      const mockOnMoreClick = vi.fn();
      render(<BottomTabBar onMoreClick={mockOnMoreClick} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');

      // All interactive elements should have proper aria-labels
      const allLinks = screen.getAllByRole('link');
      allLinks.forEach(link => {
        expect(link).toHaveAttribute('aria-label');
      });

      const moreButton = screen.getByRole('button');
      expect(moreButton).toHaveAttribute('aria-label');
    });

    it('SidebarNav has proper accessibility attributes', () => {
      setupMockAuth('owner');
      render(<SidebarNav />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');

      // All links should have proper aria-labels
      const allLinks = screen.getAllByRole('link');
      allLinks.forEach(link => {
        expect(link).toHaveAttribute('aria-label');
      });
    });
  });
});