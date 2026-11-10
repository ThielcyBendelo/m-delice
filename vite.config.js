import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
    },
  },
  preview: {
    host: '127.0.0.1',
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
    },
  },
  build: {
    chunkSizeWarningLimit: 2000, // Augmente la limite pour masquer l'alerte
    rollupOptions: {
      output: {
        // Sépare automatiquement les dépendances node_modules en blocs distincts plus légers
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
            
          }
        }
      }
    }
  }
});

