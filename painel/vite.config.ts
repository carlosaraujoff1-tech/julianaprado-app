import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// base './' porque o painel é um site estático (EAS Hosting) sem rotas no servidor.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5174 },
});
