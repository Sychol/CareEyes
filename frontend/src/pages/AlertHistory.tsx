import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertFilterPanel } from "./AlertFilterPanel";
import {
  Filter,
  Car,
  User,
  Bird,
  Cat,
  XCircle,
  Plane,
} from "lucide-react";

interface Event {
  eventId: number;
  eventDate: string;
  eventTime: string;
  cctvId: number;
  imgPath: string;
  manage: number;
  location: string;
  itemType: string;
  itemCount: number;
}

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

export default function AlertHistory() {
  const [alerts, setAlerts] = useState<Event[]>([]);
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
  const [selectedAlert, setSelectedAlert] = useState<Event | null>(null);

  useEffect(() => {
    const fetchAlerts = () => {
      fetch("/api/eventlist")
        .then((res) => res.json())
        .then((data) => {
          console.log("✅ eventlist 갱신", data);
          setAlerts(data);
        })
        .catch((err) => console.error("Error fetching alerts:", err));
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusText = (manage: number) => {
    switch (manage) {
      case 0:
        return "미처리";
      case 1:
        return "처리중";
      case 2:
        return "처리완료";
      default:
        return "알수없음";
    }
  };

  const getStatusColor = (manage: number) => {
    switch (manage) {
      case 0:
        return "bg-red-500 text-white";
      case 1:
        return "bg-yellow-400 text-black";
      case 2:
        return "bg-green-500 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  const statusOrder = [0, 1, 2];

  const filteredAlerts = alerts
    .filter((alert) => {
      const matchLevel =
        filters.level.length === 0 ||
        filters.level.map((kor) => korToEngMap[kor] ?? kor).includes(alert.itemType);
      const matchLocation =
        filters.location.length === 0 || filters.location.includes(alert.location);
      const matchStatus =
        filters.status.length === 0 || filters.status.includes(getStatusText(alert.manage));
      const matchDate = !filters.date || alert.eventDate.startsWith(filters.date);
      return matchLevel && matchLocation && matchStatus && matchDate;
    })
    .sort((a, b) => {
      const statusDiff = statusOrder.indexOf(a.manage) - statusOrder.indexOf(b.manage);
      if (statusDiff !== 0) return statusDiff;
      return (
        new Date(`${b.eventDate}T${b.eventTime}`).getTime() -
        new Date(`${a.eventDate}T${a.eventTime}`).getTime()
      );
    });

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
            filteredAlerts.map((alert, index) => (
              <div
                key={`${alert.eventId}-${index}`}
                onClick={() => setSelectedAlert(alert)}
                className={`flex items-center justify-between p-3 rounded-lg transition cursor-pointer hover:bg-gray-100 ${selectedAlert?.eventId === alert.eventId
                  ? "bg-blue-100 border border-blue-500"
                  : "bg-gray-50"
                  }`}
              >
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <ItemTypeIcon type={convertItemType(alert.itemType)} />
                  </div>
                  <div className="text-sm leading-snug">
                    <div className="font-semibold">
                      탐지 유형: <span className="text-primary">{alert.itemType}</span> · 수량:{" "}
                      {alert.itemCount}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      위치: <span className="text-blue-600">{`${alert.location} - CCTV ${alert.cctvId}`}</span> · 일시:{" "}
                      {alert.eventDate} {alert.eventTime}
                    </div>
                  </div>
                </div>

                <Badge
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    alert.manage
                  )}`}
                >
                  {getStatusText(alert.manage)}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 🖼 CCTV 이미지 */}
      <Card className="lg:col-span-2 self-center bg-white rounded-xl shadow-md border border-border">

        <CardHeader>
          <CardTitle>
            {selectedAlert
              ? `${selectedAlert.location} - CCTV ${selectedAlert.cctvId}`
              : "탐지 정보 없음"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {selectedAlert
              ? `탐지된 물체: ${convertItemType(selectedAlert.itemType)} · 수량: ${selectedAlert.itemCount}건`
              : "탐지 정보 없음"}
          </p>
        </CardHeader>
        <CardContent className="h-[300px] bg-gray-100 rounded-md flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center">
            {selectedAlert ? (
              selectedAlert.imgPath ? (
                <img
                  src={`/ai/get_image?path=${encodeURIComponent(
                    selectedAlert.imgPath.startsWith("./")
                      ? selectedAlert.imgPath.slice(2)
                      : selectedAlert.imgPath
                  )}`}
                  alt="이상물체 이미지"
                  className="object-contain max-h-full max-w-full"
                />
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
        src="/ai/video_feed?url=https://www.youtube.com/watch?v=91PfFoqvuUk&cctv_id=101"
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
    </div>
  );
}
