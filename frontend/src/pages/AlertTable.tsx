import { useEffect, useState } from "react";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Bell } from "lucide-react";

// ✅ memberId 타입을 string으로 수정
interface WorkerAlert {
  memberId: string;
  memberPw: string;
  memberName: string;
  email: string;
  phone: string;
  memberRole: string;
  company: string;
  department: string;
  kakaoId: string;
  alertState: number;
}

// 프로필 이미지 가져오기
const profileImages = import.meta.glob("@/assets/profile/*.png", { eager: true }) as Record<string, { default: string }>;
const profileFilenames = Object.entries(profileImages)
  .filter(([path]) => path.includes("/man"))
  .map(([_, mod]) => mod.default);

export const AlertTable = () => {
  const [alerts, setAlerts] = useState<WorkerAlert[]>([]);

  useEffect(() => {
    console.log("📦 useEffect 실행됨");
    axios
      .get("/api/member/workerlist")
      .then((res) => {
        console.log("✅ 초기 알림 목록 불러옴:", res.data);
        setAlerts(res.data);

        res.data.forEach((item: any, idx: number) => {
          console.log(`👀 [${idx}] memberId:`, item.memberId);
        });
      })
      .catch((err) => console.error("❌ 작업자 경고 데이터 실패:", err));
  }, []);

  const toggleAlert = (memberId: string | null, currentState: number) => {
    console.log("🔥 toggleAlert 호출됨:", { memberId, currentState });

    if (!memberId) {
      console.warn("⚠️ memberId가 null이라 무시됨");
      return;
    }

    const newState = currentState === 1 ? 0 : 1;
    console.log("🔁 상태 바꾸기 시도:", newState);

    setAlerts((prev) =>
      prev.map((a) =>
        a.memberId === memberId ? { ...a, alertState: newState } : a
      )
    );

    const request =
      currentState === 1
        ? axios.post("/api/member/pause-alert-forever", { memberId })
        : axios.post("/api/member/resume-alert", { memberId });

    request
      .then((res) => {
        console.log("✅ 서버 상태 변경 완료:", res.data);
        return axios.get("/api/member/workerlist");
      })
      .then((res) => {
        console.log("🔁 서버에서 새 알림 목록 다시 받아옴:", res.data);
        setAlerts(res.data);
      })
      .catch((err) => {
        console.error("❌ 서버 요청 중 에러:", err);
      });
  };

  const renderWorkerCard = (alert: WorkerAlert, index: number, showToggle = false) => {
    console.log("🧱 renderWorkerCard 실행:", alert.memberName, alert.alertState);

    const location = `${alert.company} • ${alert.department}`;
    const profileImg =
      profileFilenames.length > 0
        ? profileFilenames[index % profileFilenames.length]
        : "/default-profile.png";

    const isAlertEnabled = alert.alertState === 1;

    return (
      <div
        key={alert.memberId !== null ? alert.memberId : `fallback-${index}`}
        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profileImg} />
            <AvatarFallback className="bg-muted text-muted-foreground">
              {alert.memberName?.slice(0, 1) ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-foreground">{alert.memberName}</span>
              <span className="text-sm text-muted-foreground">• {location}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              위치: 철주몰 동 1 · CCTV {index + 1}
            </div>
          </div>
        </div>

        <Bell
          className={`h-5 w-5 cursor-pointer ${isAlertEnabled ? "text-green-500" : "text-red-500"}`}
          strokeWidth={2.5}
          onClick={() => {
            console.log("🖱️ 벨 클릭됨 - memberId:", alert.memberId);
            toggleAlert(alert.memberId, alert.alertState);
          }}
        />
      </div>
    );
  };

  const enabledAlerts = alerts.filter((alert) => alert.alertState === 1);
  const disabledAlerts = alerts.filter((alert) => alert.alertState !== 1);

  return (
    <div className="flex flex-row w-full gap-4">
      <div className="w-1/3">
        <Card className="p-6 h-full">
          <h3 className="text-lg font-semibold mb-4">알림 수신 설정됨</h3>
          <div className="space-y-3">
            {enabledAlerts.map((alert, idx) => renderWorkerCard(alert, idx))}
          </div>
        </Card>
      </div>

      <div className="w-1/3">
        <Card className="p-6 h-full">
          <h3 className="text-lg font-semibold mb-4">알림 일시 정지</h3>
          <div className="space-y-3">
            {disabledAlerts.map((alert, idx) =>
              renderWorkerCard(alert, idx + enabledAlerts.length)
            )}
          </div>
        </Card>
      </div>

      <div className="w-1/3">
        <Card className="p-6 h-full">
          <h3 className="text-lg font-semibold mb-4">전체 작업자 알림 제어</h3>
          <div className="space-y-3">
            {alerts.map((alert, idx) => renderWorkerCard(alert, idx, true))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AlertTable;
