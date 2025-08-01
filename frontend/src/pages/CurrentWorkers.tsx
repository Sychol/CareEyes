import { useEffect, useState } from "react";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, Bell } from "lucide-react";

interface Worker {
  memberId: number | null;
  memberPw: string | null;
  memberName: string;
  email: string | null;
  phone: string | null;
  memberRole: string;
  company: string;
  department: string;
  kakaoId: string | null;
  alertState: number; // 1: 출근, 0: 미출근
}

// 이미지 자동 import
const profileImages = import.meta.glob("@/assets/profile/*.png", {
  eager: true,
}) as Record<string, { default: string }>;

// 이름 → 파일명 매핑
const nameToFile: Record<string, string> = {
  "최동혁": "man1.png",
  "조동수": "man2.png",
  "양정민": "man3.png",
  "황상제": "man4.png",
  "김순찰": "man5.png",
  "이홍진": "man6.png",
  "정민양": "man7.png"
};

// 이미지 경로 가져오기
const getProfileImage = (name: string): string | null => {
  const filename = nameToFile[name];
  if (!filename) return null;

  const entry = Object.entries(profileImages).find(([path]) =>
    path.endsWith(`/profile/${filename}`)
  );
  return entry?.[1].default || null;
};

export const CurrentWorkers = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);

  useEffect(() => {
    axios
      .get("http://223.130.130.196:8090/api/member/workerlist")
      .then((res) => setWorkers(res.data))
      .catch((err) => console.error("근무자 목록 불러오기 실패:", err));
  }, []);

  return (
    <Card className="h-fit">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">현재 근무자</h3>
          <Button variant="outline" size="sm" className="h-8">
            <Filter className="h-3 w-3 mr-1" />
            전체
          </Button>
        </div>

        <div className="space-y-4">
          {workers
            .filter((worker) => worker.alertState !== 0) // ✅ 미출근 제거
            .map((worker, idx) => {
              const isWorking = worker.alertState === 1;
              const profileImg = getProfileImage(worker.memberName);

              return (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profileImg || "/placeholder.svg"} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                          {worker.memberName.slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          isWorking ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                    </div>

                    <div>
                      <div className="font-medium text-base text-foreground">
                        {worker.memberName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {worker.company} • {worker.department}
                      </div>
                    </div>
                  </div>

                  <Bell
                    className={`h-5 w-5 ${
                      isWorking ? "text-green-500" : "text-red-500"
                    }`}
                     strokeWidth={2.5}
                  />
                </div>
              );
            })}
        </div>
      </div>
    </Card>
  );
};

export default CurrentWorkers;
