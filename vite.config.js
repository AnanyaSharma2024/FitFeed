import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1', // Vite ko explicit IPv4 standard par chalayega
    port: 5173,        // Try karega isi port par open karne ka
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:5001',
        ws: true,
        changeOrigin: true,      // Headers change karega
        rewriteWsOrigin: true,   // WebSocket origin mismatch ko bypass karega
      },
    },
  },
});