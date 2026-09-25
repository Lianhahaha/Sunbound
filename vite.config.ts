import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  server: { port: 5180, strictPort: true },
  build: { target: 'es2022', chunkSizeWarningLimit: 1600 },
});
