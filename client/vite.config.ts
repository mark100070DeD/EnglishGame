import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    // The browser only talks to the Vite origin; API calls are proxied to the backend.
    proxy: {
      '/api': { target: 'http://127.0.0.1:3001', changeOrigin: true },
      '/health': { target: 'http://127.0.0.1:3001', changeOrigin: true },
    },
  },
  build: {
    target: 'es2022',
    // Phaser alone is ~1.5 MB; keep it in its own long-cached chunk.
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: { manualChunks: { phaser: ['phaser'] } },
    },
  },
});
