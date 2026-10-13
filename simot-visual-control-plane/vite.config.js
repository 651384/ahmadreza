import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  preview: {
    allowedHosts: ['srv7015981364.tail11b490.ts.net'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:9100',
        changeOrigin: false,
        rewrite: path => path.replace(/^\/api/, ''),
        configure: proxy => {
          proxy.on('proxyReq', proxyReq => {
            const token = readFileSync('/srv/simot-memory/.api-token', 'utf8').trim();
            proxyReq.setHeader('Authorization', `Bearer ${token}`);
          });
        }
      }
    }
  },
  plugins: [react()],
  base: './',
});
