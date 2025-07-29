// 대시보드의 상단 헤더(Header) 컴포넌트 전체
import { ChevronRight, User } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const pageNames: Record<string, string> = {
  "/": "Dashboard",
  "/cctv": "CCTV List", 
  "/alerts": "Alert History",
  "/analytics": "데이터 분석",
  "/users": "작업자 관리",
  "/profile": "Profile",
  "/settings": "Setting"
};

export function Header() {
  const location = useLocation();
  const currentPageName = pageNames[location.pathname] || "Dashboard";

  return (
    <div className="h-20 bg-[#5F69C7] flex items-center justify-between px-6 shadow-md">
      {/* Breadcrumb */}
      <div className="flex items-center text-white/90">
        <span className="text-sm">Pages</span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-sm font-medium text-white">{currentPageName}</span>
      </div>

      {/* User Profile */}
      <div className="flex items-center space-x-4">
        <div className="text-white text-sm">
          <span className="font-medium">나인진</span>
          <span className="mx-2">|</span>
          <span>관리자</span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" alt="User" />
                <AvatarFallback className="bg-white/20 text-white">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
         <DropdownMenuContent className="w-48 bg-white shadow-md rounded-md" align="end" forceMount>
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>프로필</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
