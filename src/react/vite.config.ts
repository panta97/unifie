import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/static/',
  build: {
    sourcemap: true,
    manifest: true,
    outDir: '../django/django_kdosh/static',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'sales': 'web/k_sales/index.jsx',
        'default': 'web/default/main.tsx'
      },
    }
  },
})
