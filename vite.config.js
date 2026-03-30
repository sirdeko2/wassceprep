import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  build: {
    // Generate a manifest of assets so the SW can cache them precisely
    manifest: true,
    rollupOptions: {
      output: {
        // Stable chunk names help the SW cache invalidation strategy
        manualChunks: {
          vendor:   ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
        }
      }
    }
  },
  // Allow the SW (public/sw.js) to be served from root without hashing
  publicDir: 'public',
})
