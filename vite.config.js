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
})
