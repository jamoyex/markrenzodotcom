import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    host: true, // Allow external hosts
    port: 5173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'b4198e3285ec.ngrok-free.app'
    ]
  }
}) 