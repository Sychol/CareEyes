import { useEffect, useState, MouseEvent, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertFilterPanel } from "./AlertFilterPanel";
import axios from "axios";
import {
  Filter,
  Car,
  User,
  Bird,
  Cat,
  XCircle,
  Plane,
} from "lucide-react";
type StatusType = "미처리" | "처리중" | "처리완료";

// ==============================
// 🔹 타입 및 상수 정의
// ==============================

interface Item {
  ITEM_TYPE: string;
  ITEM_COUNT: number;
}

interface DetectionEvent {
  EVENT_ID: string;
  EVENT_DATE: string;
  EVENT_TIME: string;
  CCTV_ID: string;
  IMG_PATH: string;
  MANAGE: StatusType;
  ITEMS: Item[];
  LOCATION: string;
}


// ✅ API 응답 → DetectionEvent 타입으로 변환
const mapApiEvent = (apiEvent: any): DetectionEvent => ({
  EVENT_ID: String(apiEvent.eventId ?? apiEvent.EVENT_ID),
  EVENT_DATE: apiEvent.eventDate ?? apiEvent.EVENT_DATE,
  EVENT_TIME: apiEvent.eventTime ?? apiEvent.EVENT_TIME,
  CCTV_ID:
    apiEvent.cctvId !== undefined
      ? typeof apiEvent.cctvId === "number"
        ? `CCTV${apiEvent.cctvId}`
        : apiEvent.cctvId
      : apiEvent.CCTV_ID ?? "",
  IMG_PATH: apiEvent.imgPath ?? apiEvent.IMG_PATH,
  MANAGE:
    typeof apiEvent.manage === "number"
      ? apiEvent.manage === 0
        ? "미처리"
        : apiEvent.manage === 1
        ? "처리중"
        : "처리완료"
      : apiEvent.MANAGE ?? "미처리",
  ITEMS: apiEvent.itemType
    ? [{ ITEM_TYPE: apiEvent.itemType, ITEM_COUNT: apiEvent.itemCount }]
    : apiEvent.ITEMS ?? [],
  LOCATION: apiEvent.location ?? apiEvent.LOCATION,
});

// ✅ 탐지 유형 변환용 한영 매핑
const korToEngMap: Record<string, string> = {
  차량: "vehicle",
  조류: "bird",
  동물: "mammal",
  사람: "person",
};

const convertItemType = (type: string) => {
  switch (type) {
    case "vehicle":
      return "차량";
    case "bird":
      return "조류";
    case "mammal":
      return "동물";
    case "person":
      return "사람";
    case "airplane":
      return "항공기";
    default:
      return type;
  }
};

// ✅ 아이템 유형별 아이콘 표시
const ItemTypeIcon = ({ type }: { type: string }) => {
  const normalized =
    type === "airplane" || type === "항공기" || type === "비행기"
      ? "airplane"
      : type;

  switch (normalized) {
    case "차량":
    case "vehicle":
      return <Car className="h-10 w-10 text-black" />;
    case "사람":
    case "person":
      return <User className="h-10 w-10 text-black" />;
    case "조류":
    case "bird":
      return <Bird className="h-10 w-10 text-black" />;
    case "포유류":
    case "동물":
    case "mammal":
      return <Cat className="h-10 w-10 text-black" />;
    case "airplane":
      return <Plane className="h-10 w-10 text-black" />;
    default:
      return <XCircle className="h-10 w-10 text-black" />;
  }
};


interface StatusUpdateModalProps {
  alert: DetectionEvent; 
  onClose: () => void;
  onUpdate: (eventId: string, newStatus: StatusType) => void; 
}

const STATUS_ENUM: StatusType[] = ["미처리", "처리중", "처리완료"];

const getStatusClasses = (currentStatus: string, buttonStatus: string): string => {
  const unselectedClasses = 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300';

  if (currentStatus !== buttonStatus) {
    return unselectedClasses;
  }
  
  // 선택된 버튼의 경우, 상태에 따라 다른 색을 반환
  switch (buttonStatus) {
    case "미처리":
      return 'bg-red-500 text-white font-bold shadow-md';    // 🔴 빨간색
    case "처리중":
      return 'bg-yellow-400 text-black font-bold shadow-md'; // 🟡 노란색
    case "처리완료":
      return 'bg-green-500 text-white font-bold shadow-md';  // 🟢 초록색
    default:
      return unselectedClasses;
  }
};

const StatusUpdateModal = ({ alert, onClose, onUpdate }: StatusUpdateModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-80">
        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-800">작업 상태 변경</h3>
        </div>
        <div className="px-6 pb-4 flex flex-col space-y-2">
          {STATUS_ENUM.map((status) => (
            <button
              key={status}
              onClick={() => onUpdate(alert.EVENT_ID, status)}
              className={`w-full text-center py-3 px-4 rounded-lg transition-colors duration-200 text-base
                ${getStatusClasses(alert.MANAGE, status)} 
              `}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 text-center">
          <button
            onClick={onClose}
            className="w-full text-center py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};


export default function AlertHistory() {
  const [alerts, setAlerts] = useState<DetectionEvent[]>([]);
  const [filters, setFilters] = useState<{
    level: string[];
    location: string[];
    status: string[];
    date: string | null;
  }>({
    level: [],
    location: [],
    status: [],
    date: null,
  });
  const [showFilter, setShowFilter] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<DetectionEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertToEdit, setAlertToEdit] = useState<DetectionEvent | null>(null);

  const fetchInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchAlerts = (isInitialLoad = false) => {
      fetch("/api/eventlist")
        .then((res) => res.json())
        .then((data) => {
          console.log("✅ eventlist 갱신", data);
          const mappedData = Array.isArray(data) ? data.map(mapApiEvent) : [];
          setAlerts(mappedData);
          
          if (selectedAlert) {
            const updatedSelected = mappedData.find(a => a.EVENT_ID === selectedAlert.EVENT_ID);
            setSelectedAlert(updatedSelected || null);
          } else if (isInitialLoad && mappedData.length > 0) {
            const sorted = sortAlerts(mappedData);
            setSelectedAlert(sorted[0]);
          }
        })
        .catch((err) => console.error("Error fetching alerts:", err));
  };

  const startFetching = () => {
    if (fetchInterval.current) clearInterval(fetchInterval.current);
    fetchInterval.current = setInterval(() => fetchAlerts(), 10000);
  };

  const stopFetching = () => {
    if (fetchInterval.current) {
      clearInterval(fetchInterval.current);
      fetchInterval.current = null;
    }
  };

  useEffect(() => {
    fetchAlerts(true);
    startFetching();
    return () => stopFetching();
  }, []);

  const getStatusColor = (manage: StatusType) => {
    switch (manage) {
      case "미처리":
        return "bg-red-500 text-white";
      case "처리중":
        return "bg-yellow-400 text-black";
      case "처리완료":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  const handleStatusBadgeClick = (event: MouseEvent, alert: DetectionEvent) => {
    event.stopPropagation();
    setAlertToEdit(alert);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (eventId: string, newStatus: StatusType) => {
    const originalStatus = alertToEdit!.MANAGE;

    stopFetching();
    setIsModalOpen(false);

    setAlerts(prev =>
      prev.map(a => a.EVENT_ID === eventId ? { ...a, MANAGE: newStatus } : a)
    );

    try {
      const statusToNumber = newStatus === "미처리" ? 0 : newStatus === "처리중" ? 1 : 2;

     
      await axios.patch(`/api/event/${eventId}/status`, {
        status: statusToNumber, 
      });

      console.log("✅ 상태 변경 성공");

      fetchAlerts();
    } catch (err) {
      console.error("❌ 상태 변경 실패:", err);

      setAlerts(prev =>
        prev.map(a => a.EVENT_ID === eventId ? { ...a, MANAGE: originalStatus } : a)
      );
      alert("상태 변경 실패: " + (err as any).message);
    } finally {
      startFetching();
      setAlertToEdit(null);
    }
  };

  const sortAlerts = (alertsToSort: DetectionEvent[]) => {
      const statusOrder: StatusType[] = ["미처리", "처리중", "처리완료"];
       return [...alertsToSort].sort((a, b) => {
        const statusDiff = statusOrder.indexOf(a.MANAGE) - statusOrder.indexOf(b.MANAGE);
        if (statusDiff !== 0) return statusDiff;
        return (
            new Date(`${b.EVENT_DATE}T${b.EVENT_TIME}`).getTime() -
            new Date(`${a.EVENT_DATE}T${a.EVENT_TIME}`).getTime()
        );
      });
  }

  const filteredAlerts = sortAlerts(alerts.filter((alert) => {
      const firstItem = alert.ITEMS?.[0];
      if (!firstItem) return false;

      const matchLevel =
        filters.level.length === 0 ||
        filters.level.map((kor) => korToEngMap[kor] ?? kor).includes(firstItem.ITEM_TYPE);
      const matchLocation =
        filters.location.length === 0 || filters.location.includes(alert.LOCATION);
      const matchStatus =
        filters.status.length === 0 || filters.status.includes(alert.MANAGE);
      const matchDate = !filters.date || alert.EVENT_DATE.startsWith(filters.date);
      return matchLevel && matchLocation && matchStatus && matchDate;
    })
  );

  const renderAlertItem = (alert: DetectionEvent, index: number) => {
    const firstItem = alert.ITEMS?.[0] ?? { ITEM_TYPE: "알수없음", ITEM_COUNT: 0 };
    return (
       <div
            key={`${alert.EVENT_ID}-${index}`}
            onClick={() => setSelectedAlert(alert)}
            className={`flex items-center justify-between p-3 rounded-lg transition cursor-pointer hover:bg-gray-100 ${selectedAlert?.EVENT_ID === alert.EVENT_ID
                ? "bg-blue-100 border border-blue-500"
                : "bg-gray-50"
            }`}
        >
            <div className="flex gap-3 items-center">
                <div className="w-8 h-8 flex items-center justify-center">
                    <ItemTypeIcon type={convertItemType(firstItem.ITEM_TYPE)} />
                </div>
                <div className="text-sm leading-snug">
                    <div className="font-semibold">
                        탐지 유형: <span className="text-primary">{firstItem.ITEM_TYPE}</span> · 수량:{" "}
                        {firstItem.ITEM_COUNT}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        위치: <span className="text-blue-600">{`${alert.LOCATION} - ${alert.CCTV_ID}`}</span> · 일시:{" "}
                        {alert.EVENT_DATE} {alert.EVENT_TIME}
                    </div>
                </div>
            </div>
            <Badge
                onClick={(e) => handleStatusBadgeClick(e, alert)}
                className={`px-2 py-1 text-xs font-medium rounded-full cursor-pointer ${getStatusColor(
                    alert.MANAGE
                )}`}
            >
                {alert.MANAGE}
            </Badge>
        </div>
    );
  };


  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-[auto_1fr] gap-6">
      {/* 🔔 이상물체 탐지 알림 내역 */}
      <Card className="lg:row-span-2 bg-white rounded-xl shadow-md border border-border">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>이상물체 탐지 알림 내역</CardTitle>
            <Button
              onClick={() => setShowFilter(true)}
              variant="outline"
              size="sm"
              className="h-8 gap-1"
            >
              <Filter className="w-4 h-4" />
              필터
            </Button>
          </div>
        </CardHeader>
        <CardContent className="max-h-[calc(100vh-100px)] overflow-y-auto pr-1 space-y-3 pb-0">
          {filteredAlerts.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground">
              조건에 맞는 알림이 없습니다.
            </div>
          ) : (
            filteredAlerts.map((alert, index) => renderAlertItem(alert, index))
          )}
        </CardContent>
      </Card>

      {/* 🖼 CCTV 이미지 */}
      <Card className="lg:col-span-2 self-center bg-white rounded-xl shadow-md border border-border">
        <CardHeader>
            <CardTitle>
            {selectedAlert
                ? `${selectedAlert.LOCATION} - ${selectedAlert.CCTV_ID}`
                : "탐지 정보 없음"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
            {selectedAlert && selectedAlert.ITEMS.length > 0
                ? `탐지된 물체: ${convertItemType(selectedAlert.ITEMS[0].ITEM_TYPE)} · 수량: ${selectedAlert.ITEMS[0].ITEM_COUNT}건`
                : "탐지 정보 없음"}
            </p>
        </CardHeader>
        <CardContent className="h-[300px] bg-gray-100 rounded-md flex items-center justify-center">
            <div className="w-full h-full flex items-center justify-center">
            {selectedAlert ? (
                selectedAlert.IMG_PATH ? (
                (() => {
                    const imageSrc = selectedAlert.IMG_PATH.startsWith("https")
                        ? selectedAlert.IMG_PATH
                        : selectedAlert.IMG_PATH.startsWith("/")
                        ? `/ai/get_image?path=${encodeURIComponent(selectedAlert.IMG_PATH)}`
                        : `/ai/get_image?path=${encodeURIComponent(selectedAlert.IMG_PATH.slice(2))}`;
                    return (
                    <img
                        src={imageSrc}
                        alt="이상물체 이미지"
                        className="object-contain max-h-full max-w-full"
                    />
                    );
                })()
                ) : (
                <img
                    src="/ai/get_image?path=5ded778b-0d02-4805-9c63-0235043231bc.png"
                    alt="기본 이미지"
                    className="w-[120px] h-[120px] object-contain"
                />
                )
            ) : (
                <div className="text-muted text-sm">탐지 정보 없음</div>
            )}
            </div>
        </CardContent>
      </Card>


      {/* 📺 실시간 영상 */}
      <Card className="lg:col-span-2 bg-white rounded-xl shadow-md border border-border">
        <CardHeader>
            <CardTitle>실시간 CCTV 영상</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
            <div className="w-[960px] h-[540px] bg-black rounded-md overflow-hidden shadow-md">
            <img
                src="/ai/video_feed?cctv_id=101"
                alt="CCTV 영상"
                className="w-full h-full object-cover"
            />
            </div>
        </CardContent>
      </Card>

      {/* 📋 필터 패널 */}
      {showFilter && (
        <AlertFilterPanel
          currentFilters={filters}
          onApply={(newFilters) => {
            setFilters(newFilters);
            setShowFilter(false);
          }}
          onClose={() => setShowFilter(false)}
        />
      )}

      {/* 📋 상태 변경 모달 */}
      {isModalOpen && alertToEdit && (
        <StatusUpdateModal
            alert={alertToEdit}
            onClose={() => setIsModalOpen(false)}
            onUpdate={handleUpdateStatus}
        />
      )}
    </div>
  );
}