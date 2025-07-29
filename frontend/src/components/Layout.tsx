// CareEyes 전체 페이지의 기본 레이아웃 컴포넌트
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { Outlet } from "react-router-dom";

export function Layout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-white">
        {/* 좌측 사이드바 */}
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* 상단 헤더 */}
          <Header />
          {/* 자식 라우트가 출력될 메인 영역 */}
          <main className="flex-1 bg-muted px-6 py-4">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
