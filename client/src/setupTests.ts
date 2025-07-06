import "@testing-library/jest-dom";
import { vi, beforeEach, afterEach } from 'vitest';

// Make vitest functions available globally
global.afterEach = afterEach;

// Mock global fetch
global.fetch = vi.fn();

// Mock window.confirm
global.confirm = vi.fn(() => true);

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Setup default mocks
beforeEach(() => {
  vi.clearAllMocks();
  
  // Reset fetch mock to return a basic response
  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({}),
  });
});