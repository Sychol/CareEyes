import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { Outlet } from "react-router-dom";
import { useEffect } from "react";

function MainLayout() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div className="flex w-full h-screen overflow-hidden bg-white relative">
      {/* ✅ 사이드바 */}
      <div
        className={`h-full transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"
          }`}
      >
        <AppSidebar />
      </div>



      {/* ✅ 본문 */}
      <div className="flex flex-col flex-1 bg-muted">
        <Header />
        <main className="flex-1 overflow-y-auto px-6 py-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function Layout() {
  return (
    <SidebarProvider>
      <MainLayout />
    </SidebarProvider>
  );
}
