// CareEyes 전체 페이지의 기본 레이아웃 컴포넌트
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { Outlet } from "react-router-dom";

export function Layout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-white"> {/* ✅ 고정 높이 + overflow-hidden */}
        {/* 좌측 사이드바 */}
        <AppSidebar />

        {/* 우측 본문 */}
        <div className="flex-1 flex flex-col">
          {/* 상단 헤더 */}
          <Header />

          {/* 자식 라우트가 출력될 메인 영역 */}
          <main className="flex-1 overflow-y-auto bg-muted px-6 py-4"> {/* ✅ 여기 overflow-y-auto */}
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
