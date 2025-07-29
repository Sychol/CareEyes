import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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

  useEffect(() => {
    fetch("http://223.130.130.196:8090/api/eventlist")
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ eventlist 불러옴", data);
        setAlerts(data);
      })
      .catch((err) => console.error("Error fetching alerts:", err));
  }, []);

  const getStatusText = (manage: number) => {
    switch (manage) {
      case 0:
        return "미처리";
      case 1:
        return "처리완료";
      case 2:
        return "처리중";
      default:
        return "알수없음";
    }
  };

  const getStatusColor = (manage: number) => {
    switch (manage) {
      case 0:
        return "bg-red-500 text-white";
      case 1:
        return "bg-green-500 text-white";
      case 2:
        return "bg-yellow-400 text-black";
      default:
        return "bg-gray-400 text-white";
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchLevel = filters.level.length === 0 || filters.level.includes(alert.itemType);
    const matchLocation = filters.location.length === 0 || filters.location.includes(alert.location);
    const matchStatus = filters.status.length === 0 || filters.status.includes(getStatusText(alert.manage));
    const matchDate = !filters.date || alert.eventDate.startsWith(filters.date);
    return matchLevel && matchLocation && matchStatus && matchDate;
  });

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 🔔 이상물체 탐지 알림 내역 */}
      <Card className="lg:col-span-1 bg-white rounded-xl shadow-md border border-border">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>이상물체 탐지 알림 내역</CardTitle>
            <button
              onClick={() => setShowFilter(true)}
              className="border rounded-md text-sm px-2 py-1"
            >
              필터 👁‍🗨
            </button>
          </div>
        </CardHeader>
        <CardContent className="max-h-[320px] overflow-y-auto pr-1 space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground">조건에 맞는 알림이 없습니다.</div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.eventId}
                className="flex items-center justify-between p-3 rounded-lg transition cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex gap-3">
                  <div className="text-2xl">📦</div>
                  <div className="text-sm leading-snug">
                    <div className="font-semibold">
                      탐지 유형: <span className="text-primary">{alert.itemType}</span> · 수량: {alert.itemCount}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      위치: <span className="text-blue-600">{alert.location}</span> · 일시: {alert.eventDate} {alert.eventTime}
                    </div>
                  </div>
                </div>
                <Badge className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(alert.manage)}`}>
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

      {/* 📊 그래프 카드 */}
      <Card className="lg:col-span-2 bg-white rounded-xl shadow-md border border-border">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>활주로 서 1 - CCTV 1</CardTitle>
          <div className="flex gap-2">
            <button className="text-sm border px-2 py-1 rounded">시간별</button>
            <button className="text-sm border px-2 py-1 rounded">날짜별</button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            📊 그래프 데이터 준비 중...
          </div>
        </CardContent>
      </Card>

      {/* 필터 패널 */}
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
