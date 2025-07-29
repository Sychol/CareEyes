import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8090', // 백엔드 주소
        changeOrigin: true,
      },
      '/ai': {
        target: 'http://127.0.0.1:5000', // ai-server 주소
        changeOrigin: true,
      },
      '/oauth': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      }
    }
  }
})
