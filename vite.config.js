import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Proxy ALL /api/* to Express — covers /api/chat AND /api/stock/*
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});