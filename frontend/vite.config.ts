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
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_SERVER || 'http://223.130.130.196:8090',
        changeOrigin: true,
        secure: false, // SSL 인증서 검증 비활성화 (개발 환경용)
        rewrite: (path) => path, // 경로 재작성이 필요한 경우 사용
      },
      '/oauth': {
        target: process.env.VITE_BACKEND_SERVER || 'http://223.130.130.196:8090',
        changeOrigin: true,
        secure: false,
      },
      '/ai': {
        target: process.env.VITE_BACKEND_SERVER || 'http://223.130.138.9:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
}));
