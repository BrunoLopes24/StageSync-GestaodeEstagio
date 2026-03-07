import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    pool: 'threads',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: [
        'src/hooks/**/*.{ts,tsx}',
        'src/context/AuthContext.tsx',
        'src/lib/api.ts',
        'src/lib/api-base.ts',
        'src/lib/tokenManager.ts',
        'src/lib/utils.ts',
        'src/services/authService.ts',
        'src/components/professor/StudentOverviewCard.tsx',
        'src/components/dashboard/RecentLogs.tsx',
        'src/components/dashboard/StatsCards.tsx',
        'src/components/work-log/WorkLogTable.tsx',
      ],
      exclude: ['src/main.tsx', 'src/test/**'],
      thresholds: {
        statements: 75,
        lines: 75,
        functions: 75,
        branches: 70,
      },
    },
  },
});
