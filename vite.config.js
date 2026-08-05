import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    'process.env': {},   // Prevents missing process reference errors
    'global': {},        // Prevents "global is not defined"
    'browser': '{}',     // Fixes "browser is not defined"
  },
  build: {
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [
            {
              name: 'react-vendor',
              test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
            },
            {
              name: 'motion-vendor',
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            },
            {
              name: 'mapbox-vendor',
              test: /[\\/]node_modules[\\/](mapbox-gl|react-map-gl)[\\/]/,
            },
            {
              name: 'supabase-vendor',
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            },
          ],
        },
      },
    },
  },
})
