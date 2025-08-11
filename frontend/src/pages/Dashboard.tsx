import { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import airportGroundMap from "@/components/airport-ground-map.png";
import newCctvIcon from "@/components/cctv-default.png";
import { Bell } from "lucide-react";
import { Car, User, Bird, Cat, XCircle, Plane } from "lucide-react";

// --- 인터페이스 정의 (기존과 동일) ---
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
  memberId: number;
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
  location:string;
}

// ✅ 1. 이미지 파일들을 순서대로 불러와서 배열에 담아둠
const profileImagePaths = Object.values(
  import.meta.glob("@/assets/profile/man*.png", { eager: true, as: "url" })
);


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
  const [selectedAlertImage, setSelectedAlertImage] = useState<string | null>(
    null
  );
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
  const normalizeItemType = (type: string) => {
    switch (type.toLowerCase()) {
      case "vehicle":
      case "차량":
        return "차량";
      case "person":
      case "사람":
        return "사람";
      case "bird":
      case "조류":
        return "조류";
      case "mammal":
      case "포유류":
        return "포유류";
      case "airplane":
      case "비행기":
        return "비행기";
      default:
        return type;
    }
  };

  const topStats = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayString = `${year}-${month}-${day}`;
    const todayAlerts = alertHistory.filter(
      (alert) => alert.eventDate === todayString
    );

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const lastWeekAlerts = alertHistory.filter((alert) => {
      const alertDate = new Date(alert.eventDate);
      return alertDate >= sevenDaysAgo;
    });

    const lastWeekCounts: Record<string, number> = {};
    lastWeekAlerts.forEach((alert) => {
      const normalizedType = normalizeItemType(alert.itemType);
      lastWeekCounts[normalizedType] =
        (lastWeekCounts[normalizedType] || 0) + 1;
    });

    const mostTypeLastWeek =
      Object.entries(lastWeekCounts).sort((a, b) => b[1] - a[1])[0] || [
        "없음",
        0,
      ];

    const sortedAlerts = [...alertHistory].sort(
      (a, b) =>
        new Date(`${b.eventDate}T${b.eventTime}`).getTime() -
        new Date(`${a.eventDate}T${a.eventTime}`).getTime()
    );

    const latest = sortedAlerts[0] || null;

    return {
      alertCount: todayAlerts.length,
      cctvCount: cctvs.length,
      latestDetection: latest,
      mostDetectedType: mostTypeLastWeek,
    };
  }, [alertHistory, cctvs]);

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

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 10000);

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
  const [activeCctvs, setActiveCctvs] = useState<{
    [key: string]: number | null;
  }>({
    EAST: null,
    WEST: null,
  });

  const handleCctvClick = (id: number) => {
    const clicked = cctvs.find((c) => c.id === id);
    if (!clicked) return;

    const matchedAlerts = alertHistory.filter(
      (alert) => String(alert.cctvId) === String(id)
    );

    const latestAlert = matchedAlerts.sort(
      (a, b) =>
        new Date(`${b.eventDate}T${b.eventTime}`).getTime() -
        new Date(`${a.eventDate}T${a.eventTime}`).getTime()
    )[0];

    if (latestAlert?.imgPath) {
      setSelectedAlertImage(latestAlert.imgPath);
    } else {
      setSelectedAlertImage(null);
    }

    setActiveCctvs({
      EAST: clicked.location === "EAST" ? id : null,
      WEST: clicked.location === "WEST" ? id : null,
    });
    setHighlightedCctvId(id);
  };

  const filteredAlerts = alertHistory
    .filter((alert) => {
      const manageNum = Number(alert.manage);
      return (
        (filters.status.length === 0 ||
          filters.status.includes(manageNum)) &&
        (filters.location.length === 0 ||
          filters.location.includes(alert.location)) &&
        (filters.itemType.length === 0 ||
          filters.itemType.includes(alert.itemType)) &&
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
            <div className="text-sm text-muted-foreground">
              이상물체 탐지 수 (일)
            </div>
            <div className="text-2xl font-bold mt-2">
              {topStats.alertCount}건
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5">
            <div className="text-sm text-muted-foreground">
              실시간 CCTV 수
            </div>
            <div className="text-2xl font-bold mt-2">
              {topStats.cctvCount}대
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5">
            <div className="text-sm text-muted-foreground">최근 탐지 내역</div>
            {topStats.latestDetection ? (
              <>
                <div className="text-lg font-semibold mt-2">
                  {topStats.latestDetection.location} - CCTV{" "}
                  {topStats.latestDetection.cctvId}
                </div>
                <div className="text-xs text-muted-foreground">
                  {topStats.latestDetection.eventDate}{" "}
                  {topStats.latestDetection.eventTime}
                </div>
              </>
            ) : (
              <div className="text-sm mt-2 text-muted-foreground">
                데이터 없음
              </div>
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
                  (alert) => alert.cctvId === cctv.id
                );

                const hasUnprocessed = matchedAlerts.some(
                  (alert) => alert.manage === 0
                );
                const hasProcessing = matchedAlerts.some(
                  (alert) => alert.manage === 1
                );
                const hasCompleted = matchedAlerts.some(
                  (alert) => alert.manage === 2
                );

                let statusBorderColor = "border-black";

                if (hasUnprocessed) {
                  statusBorderColor = "border-red-500";
                } else if (hasProcessing) {
                  statusBorderColor = "border-yellow-400";
                } else if (hasCompleted) {
                  statusBorderColor = "border-green-500";
                }

                return (
                  <div
                    key={cctv.id}
                    className="absolute"
                    style={{ top: cctv.top, left: cctv.left }}
                  >
                    {isActive && (
                      <div className="absolute -top-8 left-1 -translate-x-1/2 text-4xl text-red-600 drop-shadow-lg animate-bounce">
                        ⬇
                      </div>
                    )}
                    <button
                      onClick={() => handleCctvClick(cctv.id)}
                      className={`w-10 h-10 p-1 rounded-full border-4 flex items-center justify-center ${statusBorderColor} ${
                        isSelected ? "ring-4 ring-black/30" : ""
                      } bg-white`}
                    >
                      <img
                        src={newCctvIcon}
                        alt="CCTV"
                        className={`w-full h-full object-contain rounded-full p-0.5 ${
                          cctv.location === "EAST" ? "scale-x-[-1]" : ""
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
                      : `/ai/get_image?path=${encodeURIComponent(
                          selectedAlertImage
                        )}`
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
                      className={`px-3 py-1 rounded-full text-sm border transition ${
                        isSelected
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
                        if (alertListRef.current)
                          alertListRef.current.scrollTop = 0;
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
                      ${
                        isSelected
                          ? "bg-blue-100 border border-blue-400 shadow"
                          : "bg-gray-50 hover:bg-gray-100 hover:shadow"
                      }`}
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
                          EAST:
                            alert.location === "EAST" ? matchedCctv.id : null,
                          WEST:
                            alert.location === "WEST" ? matchedCctv.id : null,
                        });
                        setHighlightedCctvId(matchedCctv.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <ItemTypeIcon type={alert.itemType} />
                      <div>
                        <div className="text-sm font-semibold">
                          탐지 유형:{" "}
                          <span className="text-primary">{alert.itemType}</span>{" "}
                          · 수량: <span>{alert.itemCount}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          위치:{" "}
                          <span className="text-blue-600 font-medium">{`${alert.location}-CCTV ${alert.cctvId}`}</span>{" "}
                          · 일시: {alert.eventDate} {alert.eventTime}
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

        {/* ✅ '현재 근무자' 카드 */}
        <Card className="bg-white rounded-xl shadow-md border border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold">현재 근무자</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAlerts
                .filter((person) => person.alertState !== 0)
                .map((person, index) => { // ✅ map에서 index를 받아옴
                  
                  // ✅ 2. index를 사용해서 순서대로 이미지를 할당
                  const profileImg = profileImagePaths[index];
                  
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={profileImg || ""} alt={person.memberName} />
                          <AvatarFallback className="bg-muted text-base">
                            {person.memberName.slice(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-base font-semibold">
                            {person.memberName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {person.company || "-"} ·{" "}
                            {person.department || "-"}
                          </div>
                        </div>
                      </div>
                      <Bell className="w-6 h-6 text-green-500" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}