// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind()],
  // Nur lokal (npm run dev/preview): /api wie Caddy auf das Backend :8080 umleiten
  vite: {
    server: { proxy: { '/api': { target: 'http://localhost:8080', rewrite: (p) => p.replace(/^\/api/, '') } } },
    preview: { proxy: { '/api': { target: 'http://localhost:8080', rewrite: (p) => p.replace(/^\/api/, '') } } },
  },
});