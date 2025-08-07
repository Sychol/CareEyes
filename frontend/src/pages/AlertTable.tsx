import { useEffect, useState } from "react";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Bell } from "lucide-react";

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

const profileImages = import.meta.glob("@/assets/profile/*.png", { eager: true }) as Record<string, { default: string }>;
const profileFilenames = Object.entries(profileImages)
  .filter(([path]) => path.includes("/man"))
  .map(([_, mod]) => mod.default);

export const AlertTable = () => {
  const [alerts, setAlerts] = useState<WorkerAlert[]>([]);

  useEffect(() => {
    axios
      .get("/api/member/workerlist")
      .then((res) => setAlerts(res.data))
      .catch((err) => console.error("작업자 경고 데이터 실패:", err));
  }, []);

  const toggleAlert = (memberId: number | null, newState: number) => {
    axios
      .patch(`/api/member/update-alert`, { memberId, alertState: newState })
      .then(() => {
        setAlerts((prev) =>
          prev.map((a) => (a.memberId === memberId ? { ...a, alertState: newState } : a))
        );
      })
      .catch((err) => console.error("알림 상태 변경 실패:", err));
  };

  const renderWorkerCard = (alert: WorkerAlert, index: number, showToggle = false) => {
    const location = `${alert.company} • ${alert.department}`;
    const profileImg = profileFilenames[index % profileFilenames.length];
    const isAlertEnabled = alert.alertState === 1;

    const handleBellClick = () => {
      const newState = isAlertEnabled ? 0 : 1;
      toggleAlert(alert.memberId, newState);
    };

    return (
      <div
        key={index}
        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
      >
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
    const newState = isAlertEnabled ? 0 : 1;
    toggleAlert(alert.memberId, newState);
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
            {disabledAlerts.map((alert, idx) => renderWorkerCard(alert, idx + enabledAlerts.length))}
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
