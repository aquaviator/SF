export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/client/src/setupTests.ts'],
  testTimeout: 30000,
  maxWorkers: 1,
  resetMocks: true,
  roots: ['<rootDir>/client/src'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.(ts|tsx)', '**/*.(test|spec).(ts|tsx)'],
  transformIgnorePatterns: [
    'node_modules/(?!(wouter|@radix-ui|@hookform|recharts)/)',
  ],
  collectCoverageFrom: [
    'client/src/**/*.{ts,tsx}',
    '!client/src/**/*.d.ts',
    '!client/src/main.tsx',
    '!client/src/vite-env.d.ts',
  ],
};
