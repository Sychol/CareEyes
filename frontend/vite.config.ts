// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import dotenv from "dotenv";

// 환경변수 로드 (docker-compose에서도 반영됨)
dotenv.config();

// test용 backend server : http://223.130.130.196:8090/
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_SERVER || 'http://223.130.130.196:8090/', // 백엔드 주소
        changeOrigin: true,
      },
      '/oauth': {
        target: process.env.VITE_BACKEND_SERVER || 'http://223.130.130.196:8090/',
        changeOrigin: true,
      }
    }
  }
}));
