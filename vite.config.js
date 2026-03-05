import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 3000, open: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          leaflet: ['leaflet'],
          d3: ['d3'],
        }
      }
    },
    chunkSizeWarningLimit: 900,
  }
});
