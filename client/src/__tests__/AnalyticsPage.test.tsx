import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import Analytics from '@/pages/analytics';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderAnalytics = () => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Analytics />
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('Analytics', () => {
  beforeEach(() => {
    // Mock console to avoid warnings in tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders analytics page', () => {
    renderAnalytics();
    
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Insights and reports for your workforce management')).toBeInTheDocument();
  });

  it('displays all three tabs', () => {
    renderAnalytics();
    
    expect(screen.getByText('Charts')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Activity Log')).toBeInTheDocument();
  });

  it('shows key metrics cards in charts tab', () => {
    renderAnalytics();
    
    expect(screen.getByText('Labor Cost')).toBeInTheDocument();
    expect(screen.getByText('Avg Fill Rate')).toBeInTheDocument();
    expect(screen.getByText('Overtime Hours')).toBeInTheDocument();
    expect(screen.getByText('Active Staff')).toBeInTheDocument();
  });

  it('displays chart titles', () => {
    renderAnalytics();
    
    expect(screen.getByText('Labor Cost vs Budget')).toBeInTheDocument();
    expect(screen.getByText('Department Fill Rates')).toBeInTheDocument();
    expect(screen.getByText('Weekly Time Tracking')).toBeInTheDocument();
  });

  it('switches to reports tab', async () => {
    renderAnalytics();
    
    fireEvent.click(screen.getByText('Reports'));
    
    await waitFor(() => {
      expect(screen.getByText('Generated Reports')).toBeInTheDocument();
      expect(screen.getByText('Generate New Report')).toBeInTheDocument();
    });
  });

  it('switches to activity log tab', async () => {
    renderAnalytics();
    
    fireEvent.click(screen.getByText('Activity Log'));
    
    await waitFor(() => {
      expect(screen.getByText('Activity Log')).toBeInTheDocument();
      expect(screen.getByText('Filter by impact')).toBeInTheDocument();
      expect(screen.getByText('More Filters')).toBeInTheDocument();
    });
  });

  it('shows time range selector', () => {
    renderAnalytics();
    
    expect(screen.getByText('Select time range')).toBeInTheDocument();
    expect(screen.getByText('Export All')).toBeInTheDocument();
  });

  it('changes time range selection', async () => {
    renderAnalytics();
    
    const timeRangeSelect = screen.getByText('Select time range');
    fireEvent.click(timeRangeSelect);
    
    await waitFor(() => {
      expect(screen.getByText('Last 7 days')).toBeInTheDocument();
      expect(screen.getByText('Last 30 days')).toBeInTheDocument();
      expect(screen.getByText('Last 90 days')).toBeInTheDocument();
      expect(screen.getByText('Last year')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Last 7 days'));
  });

  it('shows report download buttons in reports tab', async () => {
    renderAnalytics();
    
    fireEvent.click(screen.getByText('Reports'));
    
    await waitFor(() => {
      const csvButtons = screen.getAllByText('CSV');
      const pdfButtons = screen.getAllByText('PDF');
      
      expect(csvButtons.length).toBeGreaterThan(0);
      expect(pdfButtons.length).toBeGreaterThan(0);
    });
  });

  it('filters activity log by impact', async () => {
    renderAnalytics();
    
    fireEvent.click(screen.getByText('Activity Log'));
    
    await waitFor(() => {
      const filterSelect = screen.getByText('Filter by impact');
      fireEvent.click(filterSelect);
    });
    
    await waitFor(() => {
      expect(screen.getByText('All Activities')).toBeInTheDocument();
      expect(screen.getByText('High Impact')).toBeInTheDocument();
      expect(screen.getByText('Medium Impact')).toBeInTheDocument();
      expect(screen.getByText('Low Impact')).toBeInTheDocument();
    });
  });

  it('displays metric values', () => {
    renderAnalytics();
    
    expect(screen.getByText('$15,800')).toBeInTheDocument();
    expect(screen.getByText('88.3%')).toBeInTheDocument();
    expect(screen.getByText('43h')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('shows percentage changes in metrics', () => {
    renderAnalytics();
    
    expect(screen.getByText('+5.3% vs target')).toBeInTheDocument();
    expect(screen.getByText('+2.1% vs last month')).toBeInTheDocument();
    expect(screen.getByText('+12% vs last week')).toBeInTheDocument();
    expect(screen.getByText('All departments')).toBeInTheDocument();
  });

  it('renders generate new report button', async () => {
    renderAnalytics();
    
    fireEvent.click(screen.getByText('Reports'));
    
    await waitFor(() => {
      const generateButton = screen.getByText('Generate New Report');
      expect(generateButton).toBeInTheDocument();
      
      fireEvent.click(generateButton);
      // Button should be clickable
      expect(generateButton).toBeInTheDocument();
    });
  });

  it('shows export all button functionality', () => {
    renderAnalytics();
    
    const exportButton = screen.getByText('Export All');
    expect(exportButton).toBeInTheDocument();
    
    fireEvent.click(exportButton);
    // Button should be clickable
    expect(exportButton).toBeInTheDocument();
  });
});