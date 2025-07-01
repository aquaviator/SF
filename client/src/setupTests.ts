import "@testing-library/jest-dom";

// Increase default timeout for tests
jest.setTimeout(10000);

// Mock global fetch
global.fetch = jest.fn();

// Mock window.confirm
global.confirm = jest.fn(() => true);

// Setup default mocks
beforeEach(() => {
  jest.clearAllMocks();
});