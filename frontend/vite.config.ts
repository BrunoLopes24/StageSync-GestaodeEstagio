import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

// Prefer Docker service hostname when running inside a container.
const runningInDocker = fs.existsSync('/.dockerenv')
const defaultProxyTarget = runningInDocker ? 'http://backend:3000' : 'http://localhost:3000'
const proxyTarget = process.env.VITE_PROXY_TARGET || defaultProxyTarget

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
