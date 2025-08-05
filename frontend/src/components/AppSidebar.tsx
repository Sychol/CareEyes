import {
  Home,
  Camera,
  AlertTriangle,
  BarChart3,
  Users,
  Settings,
  User,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "대시보드", url: "/", icon: Home },
  { title: "CCTV 목록", url: "/cctv", icon: Camera },
  { title: "알림 내역", url: "/alerts", icon: AlertTriangle },
  { title: "데이터 분석", url: "/analytics", icon: BarChart3 },
  { title: "작업자 관리", url: "/worker", icon: Users },
];

const accountItems = [
  { title: "Profile", url: "/profile", icon: User },
  { title: "Setting", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      className={`$${isCollapsed ? "w-16" : "w-52"} border-r border-border transition-all duration-300`}
    >
      <div className="flex flex-col min-h-screen bg-white">
        {/* 상단 보라색 헤더 */}
        <div className="h-16 px-4 bg-[#5F69C7] flex items-center justify-between border-b border-border">
          <div className="flex items-center space-x-2">
            <img src="/CareEyesLogo.png" className="w-6 h-6 object-contain" />
            {!isCollapsed && (
              <span className="text-xl font-bold text-white">CareEyes</span>
            )}
          </div>
          <button onClick={toggleSidebar} className="text-white text-xs">
            {isCollapsed ? "▶" : "◀"}
          </button>
        </div>

        {/* 아래 메뉴 영역 */}
        <SidebarContent className="flex-1 flex flex-col bg-white">
          <SidebarGroup className="p-0 flex-1">
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1 p-4">
                {navItems.map((item) => {
                  const isSelected =
                    location.pathname === item.url ||
                    location.pathname.startsWith(item.url + "/");
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className="h-12">
                        <NavLink
                          to={item.url}
                          className={`flex items-center ${
                            isCollapsed ? "justify-center" : "space-x-3"
                          } w-full px-3 py-3 rounded-xl transition-all duration-200 ${
                            isSelected
                              ? "bg-[#EEF2FF] font-semibold"
                              : "text-muted-foreground hover:bg-[#F3F5FF] hover:text-[#5F69C7]"
                          }`}
                        >
                          <item.icon
                            className={`w-5 h-5 ${
                              isSelected
                                ? "text-[#5F69C7]"
                                : "text-muted-foreground group-hover:text-[#5F69C7]"
                            }`}
                          />
                          {!isCollapsed && (
                            <span
                              className={`text-sm ${
                                isSelected ? "text-[#5F69C7]" : ""
                              }`}
                            >
                              {item.title}
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Account Pages */}
          <div className="mt-auto border-t border-border">
            {!isCollapsed && (
              <div className="p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                ACCOUNT PAGES
              </div>
            )}
            <SidebarGroup className="p-0">
              <SidebarGroupContent>
                <SidebarMenu
                  className={`space-y-1 ${isCollapsed ? "p-2" : "px-4 pb-4"}`}
                >
                  {accountItems.map((item) => {
                    const isSelected =
                      location.pathname === item.url ||
                      location.pathname.startsWith(item.url + "/");
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild className="h-10">
                          <NavLink
                            to={item.url}
                            className={`flex items-center ${
                              isCollapsed ? "justify-center" : "space-x-3"
                            } w-full px-3 py-2 rounded-lg transition-all duration-200 ${
                              isSelected
                                ? "bg-[#EEF2FF] text-[#5F69C7] font-semibold"
                                : "text-muted-foreground hover:bg-[#F3F5FF] hover:text-[#5F69C7]"
                            }`}
                          >
                            <item.icon
                              className={`w-4 h-4 ${
                                isSelected
                                  ? "text-[#5F69C7]"
                                  : "text-muted-foreground group-hover:text-[#5F69C7]"
                              }`}
                            />
                            {!isCollapsed && (
                              <span className="text-sm">{item.title}</span>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        </SidebarContent>
      </div>
    </Sidebar>
  );
}
