import { useEffect, useState } from "react";
import { ChevronRight, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axios from "axios";

// ✅ 사용자 정보 API URL
const USER_INFO_API_URL = "/api/member/userinfo";

const pageNames: Record<string, string> = {
  "/": "Dashboard",
  "/cctv": "CCTV List", 
  "/alerts": "Alert History",
  "/analytics": "Data Analytics",
  "/worker": "Worker Management",
  "/profile": "Profile",
  "/settings": "Setting"
};

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPageName = pageNames[location.pathname] || "Dashboard";

  // ✅ 사용자 정보 상태
  const [userData, setUserData] = useState({
    MEMBER_NAME: "",
    DEPARTMENT: "",
    MEMBER_ID: "",
  });

  // ✅ 사용자 정보 가져오기
  useEffect(() => {
    axios.get(USER_INFO_API_URL)
      .then((res) => {
        const userInfo = res.data;
        if (userInfo && userInfo.memberName) {
          setUserData({
            MEMBER_NAME: userInfo.memberName,
            DEPARTMENT: userInfo.department,
            MEMBER_ID: userInfo.memberId,
          });
        }
      })
      .catch((err) => {
        console.error("사용자 정보 가져오기 실패:", err);
      });
  }, []);

  // ✅ 로그아웃
  const handleSignOut = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="h-16 bg-[#5F69C7] flex items-center justify-between px-6 shadow-md">
      {/* Breadcrumb */}
      <div className="flex items-center text-white/90">
        <span className="text-sm">Pages</span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-sm font-medium text-white">{currentPageName}</span>
      </div>

      {/* User Profile */}
      <div className="flex items-center space-x-4">
        <div className="text-white text-sm">
          <span className="font-medium">{userData.MEMBER_NAME || "사용자"}</span>
          <span className="mx-2">|</span>
          <span>{userData.DEPARTMENT || "부서"}</span>
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
            <DropdownMenuItem onClick={handleSignOut}>
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
