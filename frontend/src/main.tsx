// 액트 앱의 진짜 시작점(entry point)**이에요.
// 브라우저에서 최초로 실행되는 파일, 보통 main.tsx 또는 index.tsx
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
