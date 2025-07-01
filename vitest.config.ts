import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default defineConfig({
  ...viteConfig,
  root: '.',
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['client/src/__tests__/**/*.test.tsx'],
    setupFiles: ['client/src/setupTests.ts'],
    coverage: { reporter: ['text'] },
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    server: {
      deps: {
        inline: ['@tanstack/react-query'],
        external: ['lucide-react','recharts','d3','lodash']
      }
    }
  }
});