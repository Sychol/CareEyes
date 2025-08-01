import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { AlertFilterPanel } from "./AlertFilterPanel";

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
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);

  useEffect(() => {
    const fetchAlerts = () => {
      fetch("http://223.130.130.196:8090/api/eventlist")
        .then((res) => res.json())
        .then((data) => {
          console.log("✅ eventlist 갱신", data);
          setAlerts(data);
        })
        .catch((err) => console.error("Error fetching alerts:", err));
    };

    fetchAlerts(); // 최초 호출
    const interval = setInterval(fetchAlerts, 10000); // 10초마다 갱신
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

  const statusOrder = [0, 1, 2]; // 미처리 → 처리중 → 처리완료

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
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-[auto_1fr] gap-6 h-[calc(100vh-100px)]">
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
        <CardContent className="h-[calc(100vh-180px)] overflow-y-auto pr-1 space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground">
              조건에 맞는 알림이 없습니다.
            </div>
          ) : (
            filteredAlerts.map((alert, index) => (
              <div
                key={`${alert.eventId}-${index}`}
                onClick={() => setSelectedAlertId(alert.eventId)}
                className={`flex items-center justify-between p-3 rounded-lg transition cursor-pointer hover:bg-gray-100 ${
                  selectedAlertId === alert.eventId
                    ? "bg-blue-100 border border-blue-500"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex gap-3">
                  <div className="text-2xl">📦</div>
                  <div className="text-sm leading-snug">
                    <div className="font-semibold">
                      탐지 유형:{" "}
                      <span className="text-primary">{alert.itemType}</span> · 수량:{" "}
                      {alert.itemCount}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      위치: <span className="text-blue-600">{alert.location}</span> · 일시:{" "}
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
      <Card className="lg:col-span-2 bg-white rounded-xl shadow-md border border-border">
        <CardHeader>
          <CardTitle>활주로 서 1 - CCTV 1</CardTitle>
          <p className="text-sm text-muted-foreground">탐지된 물체: 조류 · 수량: 4건</p>
        </CardHeader>
        <CardContent>
          <img
            src="/airplane.png"
            alt="CCTV 이미지"
            className="w-full h-[300px] object-contain rounded-md bg-gray-100"
          />
        </CardContent>
      </Card>

      {/* 📺 실시간 영상 */}
      <Card className="lg:col-span-2 bg-white rounded-xl shadow-md border border-border">
        <CardHeader>
          <CardTitle>실시간 CCTV 영상</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <iframe
            className="w-full h-[360px] rounded-md"
            src="https://www.youtube.com/embed/MjD3gnNFYUo?autoplay=1&mute=1"
            allow="autoplay; encrypted-media"
            allowFullScreen
          ></iframe>
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
