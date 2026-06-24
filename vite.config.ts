import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    // Do NOT expose GEMINI_KEY to the browser bundle via define.
    // The key is used server-side only via the /api/gemini proxy below.
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        // Proxy /api/gemini → Google Generative Language API, injecting the key server-side.
        '/api/gemini': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/gemini/, '/v1beta/models/gemini-2.0-flash:generateContent') + `?key=${env.GEMINI_KEY ?? env.VITE_GEMINI_KEY ?? ''}`,
        },
      },
    },
  };
});
