import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: { port: 3000, open: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // ─── Vendor chunks ───
          if (id.includes('node_modules/react-dom')) return 'vendor-react';
          if (id.includes('node_modules/react/'))    return 'vendor-react';
          if (id.includes('node_modules/leaflet'))   return 'vendor-leaflet';
          if (id.includes('node_modules/d3'))         return 'vendor-d3';

          // ─── Feature chunks (lazy-loaded panels) ───
          if (id.includes('/components/admin/'))      return 'chunk-admin';
          if (id.includes('/components/alam/'))        return 'chunk-alam';
          if (id.includes('/components/yaqut/'))       return 'chunk-yaqut';
          if (id.includes('/components/scholars/'))    return 'chunk-scholars';
          if (id.includes('/components/battles/'))     return 'chunk-battles';
          if (id.includes('/components/causal/'))      return 'chunk-causal';
          if (id.includes('QuizMode'))                 return 'chunk-quiz';

          // ─── Data chunk (scholar_identity is big) ───
          if (id.includes('scholar_identity'))         return 'chunk-scholar-data';
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
});
