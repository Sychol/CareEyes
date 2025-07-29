// "이상물체 탐지 알림 내역 리스트"에서 한 줄짜리 알림 박스(카드) 하나를 렌더링하는 컴포넌트
import { Badge } from "@/components/ui/badge";

interface AlertItemProps {
  icon: string;
  level: string;
  count: string;
  location: string;
  time: string;
  manage: string;
}

export function AlertItem({
  icon,
  level,
  count,
  location,
  time,
  manage,
}: AlertItemProps) {
  // ✅ 상태별 색상
  const statusColor =
    manage === "미처리"
      ? "bg-destructive"
      : manage === "처리완료"
      ? "bg-success"
      : "bg-muted";

  // ✅ 상태별 텍스트
  const statusLabel =
    manage === "미처리"
      ? "처리 미완료"
      : manage === "처리완료"
      ? "처리완료"
      : "처리중";

  return (
    <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
      <div className="flex items-center gap-3">
        <div className="text-2xl">{icon}</div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">탐지 유형:</span>
            <span className="text-sm">{level}</span>
            <span className="text-sm font-medium">수량:</span>
            <span className="text-sm">{count}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-medium">위치:</span>
            <span className="text-sm text-primary">{location}</span>
            <span className="text-sm font-medium">일시:</span>
            <span className="text-sm">{time}</span>
          </div>
        </div>
      </div>
      {/* ✅ 상태 텍스트 반영 */}
      <Badge className={`${statusColor} text-white`}>
        {statusLabel}
      </Badge>
    </div>
  );
}
