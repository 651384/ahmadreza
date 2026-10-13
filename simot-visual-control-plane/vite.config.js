import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function readOnlyProxy(allowedPath) {
  return {
    target: 'http://127.0.0.1:9100',
    changeOrigin: false,
    rewrite: path => {
      const pathname = path.split('?')[0];
      if (pathname !== allowedPath) {
        throw new Error('READ_ONLY_ROUTE_BLOCKED');
      }
      return path.replace(/^\\/api/, '');
    },
    configure: proxy => {
      proxy.on('proxyReq', (proxyReq, req) => {
        // Never attach the Master Memory token to non-GET requests.
        if (req.method !== 'GET') {
          proxyReq.destroy(new Error('READ_ONLY_METHOD_BLOCKED'));
          return;
        }
        const token = readFileSync('/srv/simot-memory/.api-token', 'utf8').trim();
        proxyReq.setHeader('Authorization', `Bearer ${token}`);
      });
    }
  };
}

export default defineConfig({
  preview: {
    allowedHosts: ['srv7015981364.tail11b490.ts.net'],
    proxy: {
      '/api/list/working': readOnlyProxy('/api/list/working'),
      '/api/memory/working/simot-core-overview': readOnlyProxy('/api/memory/working/simot-core-overview')
    }
  },
  plugins: [react()],
  base: './',
});
