import { readFileSync } from 'node:fs';
import http from 'node:http';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function simotReadOnlyMemoryProxy() {
  const allowedPath = '/api/memory/working/simot-core-overview';

  return {
    name: 'simot-read-only-master-memory',
    configurePreviewServer(server) {
      // Register before Vite's static/fallback handlers. Only one GET route is exposed.
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api')) return next();

        const requestUrl = new URL(req.url, 'http://localhost');
        if (req.method !== 'GET' || requestUrl.pathname !== allowedPath || requestUrl.search) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end('READ_ONLY_API_ROUTE_DENIED');
          return;
        }

        let token;
        try {
          token = readFileSync('/srv/simot-memory/.api-token', 'utf8').trim();
        } catch {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end('MASTER_MEMORY_TOKEN_UNAVAILABLE');
          return;
        }

        if (!token) {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end('MASTER_MEMORY_TOKEN_UNAVAILABLE');
          return;
        }

        const upstream = http.request({
          hostname: '127.0.0.1',
          port: 9100,
          path: '/memory/working/simot-core-overview',
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + token,
            Accept: 'application/json'
          }
        }, upstreamResponse => {
          res.statusCode = upstreamResponse.statusCode || 502;
          const contentType = upstreamResponse.headers['content-type'];
          if (contentType) res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'no-store');
          upstreamResponse.pipe(res);
        });

        upstream.on('error', () => {
          if (res.headersSent) return res.destroy();
          res.statusCode = 502;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end('MASTER_MEMORY_READ_FAILED');
        });

        req.on('aborted', () => upstream.destroy());
        upstream.end();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), simotReadOnlyMemoryProxy()],
  preview: {
    allowedHosts: ['srv7015981364.tail11b490.ts.net']
  },
  base: './'
});
