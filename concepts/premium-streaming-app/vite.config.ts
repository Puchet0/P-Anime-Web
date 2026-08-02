import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const API_TARGET = process.env.API_TARGET || 'http://localhost:3002'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '192.168.1.207',
      '.uruguay.dpdns.org',
      '.puchet.dpdns.org',
      '.lan',
      '.local',
    ],
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
      },
      '/covers': {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
})
