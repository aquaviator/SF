import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CalendarView } from '../components/CalendarView';

const mockShifts = [
  {
    id: 1,
    date: '2025-01-15',
    startTime: '09:00',
    endTime: '17:00',
    role: 'Server',
    description: 'Morning shift',
    location: 'Main Hall',
    assignedTo: 1,
    status: 'confirmed' as const,
    tenantId: 'test-tenant',
    assignmentType: 'assigned' as const,
    requiredStaff: 1,
    claimedBy: null,
    templateId: null,
    createdBy: 1,
    notes: null
  }
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('Calendar Modal Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call onCreateShift when clicking a calendar day', async () => {
    const mockOnCreateShift = vi.fn();
    const mockOnEditShift = vi.fn();
    const mockOnDuplicateShift = vi.fn();
    const mockOnDeleteShift = vi.fn();

    render(
      <CalendarView
        shifts={mockShifts}
        onCreateShift={mockOnCreateShift}
        onEditShift={mockOnEditShift}
        onDuplicateShift={mockOnDuplicateShift}
        onDeleteShift={mockOnDeleteShift}
        userRole="owner"
      />,
      { wrapper: createWrapper() }
    );

    // Find a day that doesn't have shifts (should be clickable)
    const emptyDay = screen.getByText('10'); // Assuming day 10 is empty
    fireEvent.click(emptyDay);

    await waitFor(() => {
      expect(screen.getByText(/Shifts for/)).toBeInTheDocument();
    });

    // Click the "Create Shift" button in the modal
    const createButton = screen.getByText('Create Shift');
    fireEvent.click(createButton);

    expect(mockOnCreateShift).toHaveBeenCalledWith('2025-01-10');
  });

  it('should show shift details and action buttons in modal', async () => {
    const mockOnCreateShift = vi.fn();
    const mockOnEditShift = vi.fn();
    const mockOnDuplicateShift = vi.fn();
    const mockOnDeleteShift = vi.fn();

    render(
      <CalendarView
        shifts={mockShifts}
        onCreateShift={mockOnCreateShift}
        onEditShift={mockOnEditShift}
        onDuplicateShift={mockOnDuplicateShift}
        onDeleteShift={mockOnDeleteShift}
        userRole="owner"
      />,
      { wrapper: createWrapper() }
    );

    // Click on day 15 which has a shift
    const dayWithShift = screen.getByText('15');
    fireEvent.click(dayWithShift);

    await waitFor(() => {
      expect(screen.getByText(/Shifts for/)).toBeInTheDocument();
    });

    // Verify shift details are shown
    expect(screen.getByText('Morning shift')).toBeInTheDocument();
    expect(screen.getByText('09:00 - 17:00')).toBeInTheDocument();
    expect(screen.getByText('Server')).toBeInTheDocument();

    // Verify action buttons are present
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Duplicate')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should call onEditShift when edit button is clicked', async () => {
    const mockOnCreateShift = vi.fn();
    const mockOnEditShift = vi.fn();
    const mockOnDuplicateShift = vi.fn();
    const mockOnDeleteShift = vi.fn();

    render(
      <CalendarView
        shifts={mockShifts}
        onCreateShift={mockOnCreateShift}
        onEditShift={mockOnEditShift}
        onDuplicateShift={mockOnDuplicateShift}
        onDeleteShift={mockOnDeleteShift}
        userRole="owner"
      />,
      { wrapper: createWrapper() }
    );

    // Click on day 15 which has a shift
    const dayWithShift = screen.getByText('15');
    fireEvent.click(dayWithShift);

    await waitFor(() => {
      expect(screen.getByText(/Shifts for/)).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    expect(mockOnEditShift).toHaveBeenCalledWith(mockShifts[0]);
  });

  it('should call onDuplicateShift when duplicate button is clicked', async () => {
    const mockOnCreateShift = vi.fn();
    const mockOnEditShift = vi.fn();
    const mockOnDuplicateShift = vi.fn();
    const mockOnDeleteShift = vi.fn();

    render(
      <CalendarView
        shifts={mockShifts}
        onCreateShift={mockOnCreateShift}
        onEditShift={mockOnEditShift}
        onDuplicateShift={mockOnDuplicateShift}
        onDeleteShift={mockOnDeleteShift}
        userRole="owner"
      />,
      { wrapper: createWrapper() }
    );

    // Click on day 15 which has a shift
    const dayWithShift = screen.getByText('15');
    fireEvent.click(dayWithShift);

    await waitFor(() => {
      expect(screen.getByText(/Shifts for/)).toBeInTheDocument();
    });

    // Click duplicate button
    const duplicateButton = screen.getByText('Duplicate');
    fireEvent.click(duplicateButton);

    expect(mockOnDuplicateShift).toHaveBeenCalledWith(mockShifts[0]);
  });

  it('should call onDeleteShift when delete button is clicked', async () => {
    const mockOnCreateShift = vi.fn();
    const mockOnEditShift = vi.fn();
    const mockOnDuplicateShift = vi.fn();
    const mockOnDeleteShift = vi.fn();

    render(
      <CalendarView
        shifts={mockShifts}
        onCreateShift={mockOnCreateShift}
        onEditShift={mockOnEditShift}
        onDuplicateShift={mockOnDuplicateShift}
        onDeleteShift={mockOnDeleteShift}
        userRole="owner"
      />,
      { wrapper: createWrapper() }
    );

    // Click on day 15 which has a shift
    const dayWithShift = screen.getByText('15');
    fireEvent.click(dayWithShift);

    await waitFor(() => {
      expect(screen.getByText(/Shifts for/)).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(mockOnDeleteShift).toHaveBeenCalledWith(1); // Should pass shift ID
  });

  it('should hide action buttons for staff users', async () => {
    const mockOnCreateShift = vi.fn();
    const mockOnEditShift = vi.fn();
    const mockOnDuplicateShift = vi.fn();
    const mockOnDeleteShift = vi.fn();

    render(
      <CalendarView
        shifts={mockShifts}
        onCreateShift={mockOnCreateShift}
        onEditShift={mockOnEditShift}
        onDuplicateShift={mockOnDuplicateShift}
        onDeleteShift={mockOnDeleteShift}
        userRole="staff"
      />,
      { wrapper: createWrapper() }
    );

    // Click on day 15 which has a shift
    const dayWithShift = screen.getByText('15');
    fireEvent.click(dayWithShift);

    await waitFor(() => {
      expect(screen.getByText(/Shifts for/)).toBeInTheDocument();
    });

    // Verify staff cannot see action buttons
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Duplicate')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    expect(screen.queryByText('Create Shift')).not.toBeInTheDocument();
  });

  it('should navigate between months correctly', () => {
    const mockOnCreateShift = vi.fn();
    const mockOnEditShift = vi.fn();
    const mockOnDuplicateShift = vi.fn();
    const mockOnDeleteShift = vi.fn();

    render(
      <CalendarView
        shifts={mockShifts}
        onCreateShift={mockOnCreateShift}
        onEditShift={mockOnEditShift}
        onDuplicateShift={mockOnDuplicateShift}
        onDeleteShift={mockOnDeleteShift}
        userRole="owner"
      />,
      { wrapper: createWrapper() }
    );

    // Check initial month is current month
    const now = new Date();
    const currentMonthText = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    expect(screen.getByText(currentMonthText)).toBeInTheDocument();

    // Click next month button
    const nextButton = screen.getByText('Next month');
    fireEvent.click(nextButton);

    // Verify month changed
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1);
    const nextMonthText = nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    expect(screen.getByText(nextMonthText)).toBeInTheDocument();

    // Click previous month button twice to go back
    const prevButton = screen.getByText('Previous month');
    fireEvent.click(prevButton);
    fireEvent.click(prevButton);

    // Verify we're now at previous month from original
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1);
    const prevMonthText = prevMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    expect(screen.getByText(prevMonthText)).toBeInTheDocument();
  });
});