// Dashboard.tsx

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import airportGroundMap from "@/components/airport-ground-map.png";
import newCctvIcon from "@/components/cctv-default.png";
import { Bell } from "lucide-react";

import { Car, User, Bird, Cat, XCircle, Plane } from "lucide-react";
import { useMemo } from "react";

interface AlertEvent {
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

interface Worker {
  memberName: string;
  company: string;
  department: string;
  alertState: number;
}

interface Cctv {
  id: number;
  top: string;
  left: string;
  detected: boolean;
  location: string;
}


const ItemTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
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
    case "mammal":
      return <Cat className="h-10 w-10 text-black" />;
    case "비행기":
    case "airplane":
      return <Plane className="h-10 w-10 text-black" />;
    default:
      return <XCircle className="h-10 w-10 text-black" />;
  }
};

export default function Dashboard() {
  const alertListRef = useRef<HTMLDivElement>(null);
  const [alertHistory, setAlertHistory] = useState<AlertEvent[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Worker[]>([]);
  const [cctvs, setCctvs] = useState<Cctv[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
  const [selectedAlertImage, setSelectedAlertImage] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    status: number[];
    location: string[];
    itemType: string[];
    date: string | null;
  }>({
    status: [],
    location: [],
    itemType: [],
    date: null,
  });
  const topStats = useMemo(() => {
    const sortedAlerts = [...alertHistory].sort(
      (a, b) =>
        new Date(`${b.eventDate}T${b.eventTime}`).getTime() -
        new Date(`${a.eventDate}T${a.eventTime}`).getTime()
    );

    const latest = sortedAlerts[0] || null;

    const counts: Record<string, number> = {};
    alertHistory.forEach((alert) => {
      counts[alert.itemType] = (counts[alert.itemType] || 0) + 1;
    });

    const mostType = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || ["없음", 0];

    return {
      alertCount: alertHistory.length,
      cctvCount: cctvs.length,
      latestDetection: latest,
      mostDetectedType: mostType,
    };
  }, [alertHistory, cctvs]);

  // 데이터 fetch 함수 분리
  const fetchData = () => {
    axios
      .get("/api/eventlist")
      .then((res) => {
        const uniqueAlerts = res.data.filter(
          (item: AlertEvent, index: number, self: AlertEvent[]) =>
            index === self.findIndex((t) => t.eventId === item.eventId)
        );
        setAlertHistory(uniqueAlerts);
      })
      .catch((err) => console.error("❌ eventlist 에러:", err));

    axios
      .get("/api/member/workerlist")
      .then((res) => setRecentAlerts(res.data))
      .catch((err) => console.error("❌ workerlist 에러:", err));

    fetch("/cctvs.json")
      .then((res) => res.json())
      .then((data) => setCctvs(data))
      .catch((err) => console.error("❌ cctvs.json 에러:", err));
  };

  // 초기 및 10초마다 데이터 갱신
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 10000); // 10초마다 호출

    return () => clearInterval(interval);
  }, []);

  const getStatusText = (
    manage: any
  ): "미처리" | "처리중" | "처리완료" | "미상" => {
    const m = Number(manage);
    if (m === 0) return "미처리";
    if (m === 1) return "처리중";
    if (m === 2) return "처리완료";
    return "미상";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "미처리":
        return "bg-red-500 text-white";
      case "처리중":
        return "bg-yellow-400 text-black";
      case "처리완료":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-300 text-black";
    }
  };

  const [highlightedCctvId, setHighlightedCctvId] = useState<number | null>(
    null
  );
  const [activeCctvs, setActiveCctvs] = useState<{ [key: string]: number | null }>(
    {
      EAST: null,
      WEST: null,
    }
  );

  const handleCctvClick = (id: number) => {
    const clicked = cctvs.find((c) => c.id === id);
    if (!clicked) return;

    const location = clicked.location;
    const cctvId = clicked.id;

    console.log("📌 클릭된 CCTV ID:", cctvId, "Location:", location);

    const matchedAlerts = alertHistory.filter(
      (alert) =>
        String(alert.cctvId) === String(cctvId) &&
        String(alert.location).trim().toUpperCase() === String(location).trim().toUpperCase()
    );

    console.log("🔍 해당 CCTV에 매칭되는 알림 수:", matchedAlerts.length);

    const latestAlert = matchedAlerts.sort(
      (a, b) =>
        new Date(`${b.eventDate}T${b.eventTime}`).getTime() -
        new Date(`${a.eventDate}T${a.eventTime}`).getTime()
    )[0];

    if (latestAlert?.imgPath) {
      const cleanPath = latestAlert.imgPath.replace(/^\.\//, "");
      console.log("📷 선택된 이미지 경로:", cleanPath);
      setSelectedAlertImage(cleanPath);
    } else {
      console.log("❌ 해당 CCTV의 최신 알림이 없습니다.");
      setSelectedAlertImage(null);
    }

    setActiveCctvs({
      EAST: location === "EAST" ? cctvId : null,
      WEST: location === "WEST" ? cctvId : null,
    });
    setHighlightedCctvId(cctvId);
  };






  const filteredAlerts = alertHistory
    .filter((alert) => {
      const manageNum = Number(alert.manage);
      return (
        (filters.status.length === 0 || filters.status.includes(manageNum)) &&
        (filters.location.length === 0 || filters.location.includes(alert.location)) &&
        (filters.itemType.length === 0 || filters.itemType.includes(alert.itemType)) &&
        (!filters.date || alert.eventDate === filters.date)
      );
    })
    .sort(
      (a, b) =>
        new Date(`${b.eventDate}T${b.eventTime}`).getTime() -
        new Date(`${a.eventDate}T${a.eventTime}`).getTime()
    );

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-6 space-y-6">
      <div className="bg-[#5F69C7] rounded-2xl px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-5">
            <div className="text-sm text-muted-foreground">이상물체 탐지 수 (일)</div>
            <div className="text-2xl font-bold mt-2">{topStats.alertCount}건</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5">
            <div className="text-sm text-muted-foreground">실시간 CCTV 수</div>
            <div className="text-2xl font-bold mt-2">{topStats.cctvCount}대</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5">
            <div className="text-sm text-muted-foreground">최근 탐지 내역</div>
            {topStats.latestDetection ? (
              <>
                <div className="text-lg font-semibold mt-2">
                  {topStats.latestDetection.location} - CCTV {topStats.latestDetection.cctvId}
                </div>
                <div className="text-xs text-muted-foreground">
                  {topStats.latestDetection.eventDate} {topStats.latestDetection.eventTime}
                </div>
              </>
            ) : (
              <div className="text-sm mt-2 text-muted-foreground">데이터 없음</div>
            )}

          </div>
          <div className="bg-white rounded-xl shadow-md p-5">
            <div className="text-sm text-muted-foreground">최다 탐지 유형</div>
            <div className="text-lg font-semibold mt-2 text-red-600">
              {topStats.mostDetectedType[0]}
            </div>
            <div className="text-xs text-red-500">
              지난 주 {topStats.mostDetectedType[1]}건
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white rounded-xl shadow-md border border-border">
          <CardHeader>
            <CardTitle>활주로 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full h-[250px] bg-white rounded-lg overflow-hidden">
              <img
                src={airportGroundMap}
                alt="공항 지도"
                className="object-contain w-full h-full"
              />
              {cctvs.map((cctv) => {
                const isActive = activeCctvs[cctv.location] === cctv.id;
                const isSelected = highlightedCctvId === cctv.id;

                const matchedAlerts = alertHistory.filter(
                  (alert) => alert.cctvId === cctv.id && alert.location === cctv.location
                );

                const hasUnprocessed = matchedAlerts.some(alert => alert.manage === 0);
                const hasProcessing = matchedAlerts.some(alert => alert.manage === 1);
                const hasCompleted = matchedAlerts.some(alert => alert.manage === 2);

                let statusBorderColor = "border-black";

                if (hasUnprocessed) {
                  statusBorderColor = "border-red-500";       // 🔴 미처리
                } else if (hasProcessing) {
                  statusBorderColor = "border-yellow-400";    // 🟡 처리중
                } else if (hasCompleted) {
                  statusBorderColor = "border-green-500";     // 🟢 처리완료
                }

                return (
                  <div
                    key={cctv.id}
                    className="absolute"
                    style={{ top: cctv.top, left: cctv.left }}
                  >
                    {isActive && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl text-red-600 drop-shadow-lg animate-bounce">
                        ⬇
                      </div>
                    )}
                    <button
                      onClick={() => handleCctvClick(cctv.id)}
                      className={`w-10 h-10 p-1 rounded-full border-4 flex items-center justify-center ${statusBorderColor} ${isSelected ? "ring-4 ring-black/30" : ""
                        } bg-white`}
                    >
                      <img
                        src={newCctvIcon}
                        alt="CCTV"
                        className={`w-full h-full object-contain rounded-full p-0.5 ${cctv.location === "EAST" ? "scale-x-[-1]" : ""
                          }`}
                      />
                    </button>
                  </div>
                );
              })}

            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-md border border-border">
          <CardHeader>
            <CardTitle>CCTV 이미지</CardTitle>
            <p className="text-sm text-muted-foreground">탐지된 물체 영상</p>
          </CardHeader>
          <CardContent>
            <div className="relative w-full h-[300px] rounded-lg overflow-hidden bg-gray-100">
              {selectedAlertImage ? (
                <img
                  src={
                    selectedAlertImage.startsWith("https")
                      ? selectedAlertImage
                      : selectedAlertImage.startsWith("/")
                        ? `/ai/get_image?path=${encodeURIComponent(selectedAlertImage)}`
                        : `/ai/get_image?path=${encodeURIComponent(selectedAlertImage.slice(2))}`
                  }

                  alt="이상물체 이미지"
                  className="w-full h-full object-cover rounded-md"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  알림을 선택하면 이미지가 표시됩니다
                </div>
              )}

            </div>
          </CardContent>
        </Card>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white rounded-xl shadow-md border border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>이상물체 탐지 알림 내역</CardTitle>
              <div className="flex gap-2">
                {["전체", "미처리", "처리중", "처리완료"].map((label, idx) => {
                  const manageValue = idx - 1;
                  const isSelected =
                    (filters.status.length === 0 && label === "전체") ||
                    filters.status.includes(manageValue);

                  return (
                    <button
                      key={label}
                      className={`px-3 py-1 rounded-full text-sm border transition ${isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-800 border-gray-300"
                        }`}
                      onClick={() => {
                        setFilters({
                          ...filters,
                          status: label === "전체" ? [] : [manageValue],
                        });
                        setSelectedAlertImage(null);
                        setHighlightedCctvId(null);
                        setActiveCctvs({ EAST: null, WEST: null });
                        if (alertListRef.current) alertListRef.current.scrollTop = 0;
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div
              ref={alertListRef}
              className="max-h-[320px] overflow-y-auto pr-1 space-y-3"
            >
              {filteredAlerts.map((alert) => {
                const isSelected = selectedAlertId === alert.eventId;

                return (
                  <div
                    key={alert.eventId}
                    className={`flex items-center justify-between p-4 rounded-lg transition cursor-pointer
        ${isSelected ? "bg-blue-100 border border-blue-400 shadow" : "bg-gray-50 hover:bg-gray-100 hover:shadow"}`}
                    onClick={() => {
                      setSelectedAlertId(alert.eventId);
                      setSelectedAlertImage(alert.imgPath);

                      const matchedCctv = cctvs.find(
                        (cctv) =>
                          String(cctv.id) === String(alert.cctvId) &&
                          cctv.location === alert.location
                      );

                      if (matchedCctv) {
                        setActiveCctvs({
                          EAST: alert.location === "EAST" ? matchedCctv.id : null,
                          WEST: alert.location === "WEST" ? matchedCctv.id : null,
                        });
                        setHighlightedCctvId(matchedCctv.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <ItemTypeIcon type={alert.itemType} />
                      <div>
                        <div className="text-sm font-semibold">
                          탐지 유형: <span className="text-primary">{alert.itemType}</span> · 수량:{" "}
                          <span>{alert.itemCount}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          위치: <span className="text-blue-600 font-medium">{`${alert.location}-CCTV ${alert.cctvId}`}</span> ·
                          일시: {alert.eventDate} {alert.eventTime}
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={`px-3 py-1 text-sm rounded-full font-semibold ${getStatusColor(
                        getStatusText(alert.manage)
                      )}`}
                    >
                      {getStatusText(alert.manage)}
                    </Badge>
                  </div>
                );
              })}

            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-md border border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold">현재 근무자</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAlerts
                .filter((person) => person.alertState !== 0)
                .map((person, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-muted text-base">
                          {person.memberName.slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-base font-semibold">{person.memberName}</div>
                        <div className="text-sm text-muted-foreground">
                          {person.company || "-"} · {person.department || "-"}
                        </div>
                      </div>
                    </div>
                    <Bell className="w-6 h-6 text-green-500" />

                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
