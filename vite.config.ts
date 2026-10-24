import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base` controls every asset URL. Keep "/" for a root deployment (dev server,
// preview, site root) and build with LPM_BASE=/app/ when the app is served from
// a sub-path such as https://localprojects.jrispace.com/app/.
export default defineConfig({
  base: process.env.LPM_BASE || '/',
  plugins: [react()],
  server: {
    port: 8080,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  preview: {
    port: 4173,
  },
})
