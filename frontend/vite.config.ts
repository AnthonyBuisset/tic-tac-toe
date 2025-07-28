import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    allowedHosts: ['localhost', '127.0.0.1', '0.0.0.0', '789bfb5d5c43.ngrok-free.app']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})