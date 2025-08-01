import { useEffect, useState } from "react";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, Search, Bell } from "lucide-react";

interface WorkerAlert {
  memberId: number | null;
  memberPw: string | null;
  memberName: string;
  email: string | null;
  phone: string | null;
  memberRole: string;
  company: string;
  department: string;
  kakaoId: string | null;
  alertState: number;
}

// ✅ 이미지 자동 import
const profileImages = import.meta.glob("@/assets/profile/*.png", {
  eager: true,
}) as Record<string, { default: string }>;

// ✅ 이름 → 파일명 매핑
const nameToFile: Record<string, string> = {
  "최동혁": "man1.png",
  "조동수": "man2.png",
  "양정민": "man3.png",
  "황상제": "man4.png",
  "김순찰": "man5.png",
  "이홍진": "man6.png",
  "정민양": "man7.png"
  // 필요 시 추가
};

// ✅ 이미지 경로 추출
const getProfileImage = (name: string): string | null => {
  const filename = nameToFile[name];
  if (!filename) return null;

  const entry = Object.entries(profileImages).find(([path]) =>
    path.endsWith(`/profile/${filename}`)
  );
  return entry?.[1].default || null;
};

export const AlertTable = () => {
  const [alerts, setAlerts] = useState<WorkerAlert[]>([]);

  useEffect(() => {
    axios
      .get("http://223.130.130.196:8090/api/member/workerlist")
      .then((res) => setAlerts(res.data))
      .catch((err) => console.error("작업자 경고 데이터 실패:", err));
  }, []);

  return (
    <Card className="flex-1">
      <div className="p-6">
        {/* 상단 필터바 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">작업자 관리 내역</h2>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="전체" className="pl-10 w-32 h-9" />
            </div>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="h-4 w-4 mr-2" />
              전체
            </Button>
          </div>
        </div>

        {/* 작업자 목록 */}
        <div className="space-y-3">
          {alerts.map((alert, index) => {
            const isAlertEnabled = alert.alertState === 1;
            const location = `${alert.company} • ${alert.department}`;
            const profileImg = getProfileImage(alert.memberName);

            return (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* 프로필 + 이름 + 위치 */}
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profileImg || "/placeholder.svg"} />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {alert.memberName.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-foreground">{alert.memberName}</span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{location}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>알림 상태: {isAlertEnabled ? "알림 설정" : "미설정"}</span>
                      <span>위치: 철주몰 동 1 · CCTV {index + 1}</span>
                    </div>
                  </div>
                </div>

                {/* 알림 종 아이콘 */}
                <div className="flex items-center space-x-4">
                  <Bell
                    className={`h-5 w-5 ${
                      isAlertEnabled ? "text-green-500" : "text-red-500"
                    }`}
                    strokeWidth={2.5}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default AlertTable;
