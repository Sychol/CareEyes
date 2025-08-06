import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { Outlet } from "react-router-dom";

export function Layout() {
  // ✅ 직접 상태 관리
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    // ✅ Radix SidebarProvider도 살림
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-white">
        {/* 좌측 사이드바 */}
        <div
          className={`transition-all duration-300 ${
            isCollapsed ? "w-16" : "w-64"
          }`}
        >
          <AppSidebar
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
        </div>

        {/* 우측 본문 */}
        <div className="flex flex-col flex-1 bg-muted">
          <Header />
          <main className="flex-1 overflow-y-auto px-6 py-4">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
