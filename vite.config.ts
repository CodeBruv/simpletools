import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Keep the initial payload small. Heavy, tool-specific dependencies are
    // pulled in via React.lazy() at the route level, so they never land in
    // the homepage chunk.
    target: 'es2022',
    chunkSizeWarningLimit: 600,
  },
})
