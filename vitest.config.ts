import { defineConfig } from 'vitest/config';
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    // Exclude problematic plugins for testing
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: '.',
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['client/src/__tests__/**/*.test.tsx'],
    setupFiles: ['client/src/setupTests.ts'],
    coverage: { 
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'client/src/setupTests.ts',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    server: {
      deps: {
        inline: ['@tanstack/react-query', 'wouter']
      }
    },
    // Increase timeouts for complex components
    testTimeout: 10000,
    hookTimeout: 10000
  }
});