import {
  Home,
  Video,
  AlertTriangle,
  BarChart3,
  Users,
  Settings,
  User,
} from "lucide-react";
import careEyesLogo from "@/assets/logo/CareEyes_title Logo_nobg2.png";

import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

const navItems = [
  { title: "대시보드", url: "/", icon: Home },
  { title: "CCTV 목록", url: "/cctv", icon: Video },
  { title: "알림 내역", url: "/alerts", icon: AlertTriangle },
  { title: "데이터 분석", url: "/analytics", icon: BarChart3 },
  { title: "작업자 관리", url: "/worker", icon: Users },
];

const accountItems = [
  { title: "Profile", url: "/profile", icon: User },
  { title: "Setting", url: "/settings", icon: Settings },
];

export function AppSidebar({ isCollapsed, setIsCollapsed }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate(); // ✅ 이동용 훅

  return (
    <Sidebar
      className={`${isCollapsed ? "w-16" : "w-52"} bg-card transition-all duration-300 shadow-md`}
    >
      <SidebarContent className="p-0 h-full flex flex-col">
        {/* ✅ 로고 + 접기 버튼 */}
        <div className="h-16 px-4 border-b border-border bg-[#5F69C7] flex items-center justify-between">
          {!isCollapsed && (
  <div
    className="flex items-center space-x-2 cursor-pointer"
    onClick={() => navigate("/")}
  >
    <img
      src={careEyesLogo}
      alt="CareEyes Logo"
      className="w-6 h-6 object-contain"
    />
    <span className="text-xl font-bold text-white">CareEyes</span>
  </div>
)}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white text-xs ml-2"
          >
            {isCollapsed ? "▶" : "◀"}
          </button>
        </div>

        {/* 네비게이션 메뉴 */}
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className={`space-y-1 ${isCollapsed ? "p-2 space-y-0" : "p-4"}`}>
              {navItems.map((item) => {
                const isSelected =
                  location.pathname === item.url ||
                  location.pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-12">
                      <NavLink
                        to={item.url}
                        className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-3"
                          } w-full px-3 ${isCollapsed ? "py-2" : "py-3"} rounded-xl transition-all duration-200 ${isSelected
                            ? "bg-[#EEF2FF] font-semibold"
                            : "text-muted-foreground hover:bg-[#F3F5FF] hover:text-[#5F69C7]"
                          }`}
                      >
                        <item.icon
                          className={`w-5 h-5 ${isSelected
                              ? "text-[#5F69C7]"
                              : "text-muted-foreground group-hover:text-[#5F69C7]"
                            }`}
                        />
                        {!isCollapsed && (
                          <span
                            className={`text-sm ${isSelected ? "text-[#5F69C7]" : ""}`}
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

        {/* 하단 Account Pages */}
        <div className="mt-auto border-t border-border">
          {!isCollapsed && (
            <div className="p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            </div>
          )}
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className={`space-y-1 ${isCollapsed ? "p-2 space-y-0" : "px-4 pb-4"}`}>
                {accountItems.map((item) => {
                  const isSelected =
                    location.pathname === item.url ||
                    location.pathname.startsWith(item.url + "/");
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className="h-10">
                        <NavLink
                          to={item.url}
                          className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-3"
                            } w-full px-3 py-2 rounded-lg transition-all duration-200 ${isSelected
                              ? "bg-[#EEF2FF] text-[#5F69C7] font-semibold"
                              : "text-muted-foreground hover:bg-[#F3F5FF] hover:text-[#5F69C7]"
                            }`}
                        >
                          <item.icon
                            className={`w-4 h-4 ${isSelected
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
    </Sidebar>
  );
}
