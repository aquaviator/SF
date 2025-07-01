import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts/AuthContext';
import Shifts from '../pages/shifts';
import Staff from '../pages/staff';
import SwapRequests from '../pages/swap-requests';

// Mock the API module
vi.mock('../lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  }),
}));
// Test wrapper with required providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
  });
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};
describe('Select Forms Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock API responses
    const { apiRequest } = require('../lib/queryClient');
    apiRequest.mockResolvedValue({
      json: () => Promise.resolve([]),
    });
  describe('Shifts Form Select Components', () => {
    it('all Role SelectItems have non-empty values', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Shifts />
        </TestWrapper>
      );
      // Open the create modal
      const addButton = screen.getByText('Add Shift');
      await user.click(addButton);
      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByText('Create Shift')).toBeInTheDocument();
      });
      // Find and click the Role select trigger
      const roleSelect = screen.getByText('Select a role');
      await user.click(roleSelect);
      // Wait for dropdown to appear and check all options
        const options = screen.getAllByRole('option');
        expect(options.length).toBeGreaterThan(0);
        
        options.forEach(option => {
          expect(option).toHaveAttribute('data-value');
          const value = option.getAttribute('data-value');
          expect(value).toBeTruthy();
          expect(value).not.toBe('');
        });
    it('all Assign To SelectItems have non-empty values', async () => {
      // Find and click the Assign To select trigger
      const assignSelect = screen.getByText('Leave unassigned');
      await user.click(assignSelect);
  describe('Staff Form Select Components', () => {
    it('all Status SelectItems have non-empty values', async () => {
          <Staff />
      const addButton = screen.getByText('Add Staff');
        expect(screen.getByText('Add Staff Member')).toBeInTheDocument();
      // Find the Status select trigger by looking for the SelectValue component
      const statusSelects = screen.getAllByRole('combobox');
      const statusSelect = statusSelects.find(select => 
        select.closest('[role="group"]')?.querySelector('label')?.textContent === 'Status'
      if (statusSelect) {
        await user.click(statusSelect);
        // Wait for dropdown to appear and check all options
        await waitFor(() => {
          const options = screen.getAllByRole('option');
          expect(options.length).toBeGreaterThan(0);
          
          options.forEach(option => {
            expect(option).toHaveAttribute('data-value');
            const value = option.getAttribute('data-value');
            expect(value).toBeTruthy();
            expect(value).not.toBe('');
          });
      }
  describe('Swap Requests Form Select Components', () => {
    it('all Original Shift SelectItems have non-empty values', async () => {
          <SwapRequests />
      const addButton = screen.getByText('Request Swap');
        expect(screen.getByText('Request Shift Swap')).toBeInTheDocument();
      // Find and click the Original Shift select trigger
      const originalShiftSelect = screen.getByText('Select your shift');
      await user.click(originalShiftSelect);
    it('all Target Shift SelectItems have non-empty values', async () => {
      // Find and click the Target Shift select trigger
      const targetShiftSelect = screen.getByText('Select target shift or leave open');
      await user.click(targetShiftSelect);
});
