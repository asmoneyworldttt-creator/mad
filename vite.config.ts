import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    target: 'es2015',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'framer-motion', 'lucide-react'],
          'supabase': ['@supabase/supabase-js']
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
      'qrcode.react',
      'react-markdown',
    ]
  }
})

