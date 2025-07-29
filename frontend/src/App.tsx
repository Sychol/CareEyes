import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider"; // default export 기준
import { Layout } from "@/components/Layout";

// 페이지
import Dashboard from "./pages/Dashboard";
import CCTVList from "./pages/CCTVList";
import AlertHistory from "./pages/AlertHistory";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AirportDashboard from "./components/AirportDashboard";
import LogIn from "./tests/Login"; // 소문자 확인
import Join from "./tests/Register";


const queryClient = new QueryClient();

const App = () => (
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
        <BrowserRouter>
          <Routes>
            {/* ✅ Layout이 적용되는 내부 페이지들 */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/cctv" element={<CCTVList />} />
              <Route path="/alerts" element={<AlertHistory />} />
              <Route path="/index" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* ❌ Layout 없이 뜨는 페이지들 */}
            
            <Route path="/make" element={<AirportDashboard />} />
            <Route path="/sangje" element={<AirportDashboard />} />
            <Route path="/login" element={<LogIn />} />
            <Route path="/join" element={<Join />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
