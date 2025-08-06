import { useState, useEffect } from "react";
import { createContext } from "react";
export const UserContext = createContext(null);
import axios from "axios";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useNavigate, BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider"; // default export 기준
import { Layout } from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";

// 페이지
import Dashboard from "./pages/Dashboard";
import CCTVList from "./pages/CCTVList";
import AlertHistory from "./pages/AlertHistory";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AirportDashboard from "./pages/AirportDashboard";
import LogIn from "./pages/Login"; // 소문자 확인
import Join from "./pages/Register";
import KakaoCallback from "./pages/KakaoCallback";
import WorkPage from "./pages/WorkPage";
import Analytics from "./pages/Analytics"
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/member/userinfo", { withCredentials: true })
      .then(res => {
        console.log("✅ 로그인 유저 정보:", res.data);
        setUser(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("❌ 로그인 안 됨", err);
        setUser(null);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>로딩 중...</p>;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange={false}
      >
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <UserContext.Provider value={{ user, setUser }}>
            {/* 사용자 정보가 있는지 확인하고, ProtectedRoute로 감싸기 */}
            <BrowserRouter>
              <Routes>
                {/* ✅ Layout 적용, 로그인 필요한 페이지들 */}
                <Route element={
                  <ProtectedRoute user={user}>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/cctv" element={<CCTVList />} />
                  <Route path="/alerts" element={<AlertHistory />} />
                  <Route path="/index" element={<Index />} />
                  <Route path="/worker" element={<WorkPage />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
                {/* ❌ Layout 없이, 로그인 필요한 Airport 대시보드 페이지 */}
                <Route path="/airport" element={
                  <ProtectedRoute user={user}>
                    <AirportDashboard />
                  </ProtectedRoute>
                }>
                </Route>
                {/* ❌ Layout 없이 뜨는 페이지들 */}
                <Route path="/login" element={<LogIn />} />
                <Route path="/join" element={<Join />} />
                <Route path="/kakao/callback" element={<KakaoCallback />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </BrowserRouter>
          </UserContext.Provider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;