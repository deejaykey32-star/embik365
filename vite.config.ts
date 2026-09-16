import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function apiShortenDevPlugin(): Plugin {
  return {
    name: 'api-shorten-dev-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/shorten')) {
          try {
            const urlObj = new URL(req.url, 'http://localhost');
            let targetUrl = urlObj.searchParams.get('url') || '';
            if (!targetUrl) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Brak parametru url' }));
            }
            if (targetUrl.startsWith('/')) {
              targetUrl = `https://widokinaraj.pl${targetUrl}`;
            } else if (targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1')) {
              targetUrl = targetUrl.replace(/^https?:\/\/[^\/]+/, 'https://widokinaraj.pl');
            }
            const clckRes = await fetch(`https://clck.ru/--?url=${encodeURIComponent(targetUrl)}`, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });
            if (clckRes.ok) {
              const text = await clckRes.text();
              if (text && text.trim().startsWith('http')) {
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: true, shortUrl: text.trim(), provider: 'clck.ru' }));
              }
            }
          } catch (err: any) {
            console.warn('Vite dev api/shorten plugin error:', err);
          }
        }
        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiShortenDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
