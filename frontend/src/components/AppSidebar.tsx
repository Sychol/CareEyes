// 대시보드의 좌측 사이드바(AppSidebar) 컴포넌트 전체
import { Eye, Home, Camera, AlertTriangle, BarChart3, Users, Settings, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "대시보드", url: "/", icon: Home },
  { title: "CCTV 목록", url: "/cctv", icon: Camera },
  { title: "알림 내역", url: "/alerts", icon: AlertTriangle },
  { title: "데이터 분석", url: "/analytics", icon: BarChart3 },
  { title: "작업자 관리", url: "/users", icon: Users },
];

const accountItems = [
  { title: "Profile", url: "/profile", icon: User },
  { title: "Setting", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const getNavCls = (active: boolean) =>
    active
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary"
      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground";

  return (
    <Sidebar className="w-52 bg-card border-r border-border">
  <SidebarContent className="p-0">
    {/* Logo */}
    <div className="p-6 border-b border-border bg-[#5F69C7]">
  <div className="flex items-center space-x-2">
    <img src="/CareEyesLogo.png" alt="CareEyes Logo" className="w-6 h-6 object-contain" />
    <span className="text-xl font-bold text-white">CareEyes</span>
  </div>
</div>




        {/* Main Navigation */}
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 p-4">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12">
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        `flex items-center space-x-3 w-full px-3 py-3 rounded-lg transition-all duration-200 ${getNavCls(isActive)}`
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Account Pages */}
        <div className="mt-auto border-t border-border">
          <div className="p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            ACCOUNT PAGES
          </div>
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1 px-4 pb-4">
                {accountItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-10">
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          `flex items-center space-x-3 w-full px-3 py-2 rounded-lg transition-all duration-200 ${getNavCls(isActive)}`
                        }
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="text-sm">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}