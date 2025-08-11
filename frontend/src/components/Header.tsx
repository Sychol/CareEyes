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

const USER_INFO_API_URL = "/api/member/userinfo";

const pageNames: Record<string, string> = {
  "/": "Dashboard",
  "/cctv": "CCTV List",
  "/alerts": "Alert History",
  "/analytics": "Data Analytics",
  "/worker": "Worker Management",
  "/profile": "Profile",
  "/settings": "Setting",
};

// ✅ 1. ID 기반 이미지 매칭 로직 추가
const profileImagePaths = Object.values(
  import.meta.glob("@/assets/profile/man*.png", { eager: true, as: "url" })
);

const getProfileImageById = (id: number | string): string | null => {
  const numericId = Number(id);
  if (!numericId || profileImagePaths.length === 0) {
    return null;
  }
  // ID를 이미지 배열의 길이로 나눈 나머지 값을 인덱스로 사용
  const index = numericId % profileImagePaths.length;
  return profileImagePaths[index];
};

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPageName = pageNames[location.pathname] || "Dashboard";

  const [userData, setUserData] = useState({
    MEMBER_NAME: "",
    DEPARTMENT: "",
    MEMBER_ID: "",
  });
  
  // ✅ 2. 프로필 이미지 경로를 저장할 state 추가
  const [profileImg, setProfileImg] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get(USER_INFO_API_URL)
      .then((res) => {
        const userInfo = res.data;
        if (userInfo && userInfo.memberName) {
          setUserData({
            MEMBER_NAME: userInfo.memberName,
            DEPARTMENT: userInfo.department,
            MEMBER_ID: userInfo.memberId,
          });
          // ✅ 3. 사용자 ID를 기반으로 이미지 경로를 찾아서 state에 저장
          const imgSrc = getProfileImageById(userInfo.memberId);
          setProfileImg(imgSrc);
        }
      })
      .catch((err) => {
        console.error("사용자 정보 가져오기 실패:", err);
      });
  }, []);

  const handleSignOut = () => {
    axios
      .post("/api/member/logout", {}, { withCredentials: true })
      .then(() => {
        console.log("로그아웃 성공");
        navigate("/login");
      })
      .catch((error) => {
        console.error("로그아웃 실패:", error);
      });
  };

  return (
    <div className="h-16 bg-[#5F69C7] flex items-center justify-between px-6 shadow-md box-border border-l border-[#5F69C7]">
      <div className="flex items-center text-white/90">
        <span className="text-sm">Pages</span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-sm font-medium text-white">
          {currentPageName}
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-white text-sm text-right">
          <span className="font-medium">{userData.MEMBER_NAME || "사용자"}</span>
          <span className="mx-2">|</span>
          <span>{userData.DEPARTMENT || "부서"}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                {/* ✅ 4. state에 저장된 이미지 경로를 사용 */}
                <AvatarImage src={profileImg || ""} alt={userData.MEMBER_NAME} />
                <AvatarFallback className="bg-white/20 text-white">
                  {/* 사진 없을 땐 이름 첫 글자 보여주기 */}
                  {userData.MEMBER_NAME ? (
                    userData.MEMBER_NAME.charAt(0)
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-48 bg-white shadow-md rounded-md"
            align="end"
            forceMount
          >
            <DropdownMenuItem
              onClick={() => navigate("/profile")}
              className="cursor-pointer"
            >
              <User className="mr-2 h-4 w-4" />
              <span>프로필</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
