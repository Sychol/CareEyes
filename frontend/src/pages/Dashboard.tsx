import { useState, useEffect,useRef  } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import airportGroundMap from "@/components/airport-ground-map.png";
import newCctvIcon from "@/components/cctv-default.png"; // 검정색 아이콘


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

export default function Dashboard() {
  const [alertHistory, setAlertHistory] = useState<AlertEvent[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Worker[]>([]);
  const [cctvs, setCctvs] = useState<Cctv[]>([]);
  const [selectedAlertImage, setSelectedAlertImage] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("전체");
  const [highlightedCctvId, setHighlightedCctvId] = useState<number | null>(null);
  const alertListRef = useRef<HTMLDivElement>(null);
  const [activeCctvs, setActiveCctvs] = useState<{ [key: string]: number | null }>({
    EAST: null,
    WEST: null,
  });

  useEffect(() => {
    axios.get("/api/eventlist")
      .then((res) => setAlertHistory(res.data))
      .catch((err) => console.error("❌ eventlist 에러:", err));

    axios.get("/api/member/workerlist")
      .then((res) => setRecentAlerts(res.data))
      .catch((err) => console.error("❌ workerlist 에러:", err));

    fetch("/cctvs.json")
      .then((res) => res.json())
      .then((data) => setCctvs(data))
      .catch((err) => console.error("❌ cctvs.json 에러:", err));
  }, []);

  const getStatusText = (manage: number | string): "미처리" | "처리중" | "처리완료" | "미상" => {
  const parsed = Number(manage);
  switch (parsed) {
    case 0: return "미처리";
    case 1: return "처리중";
    case 2: return "처리완료";
    default: return "미상";
  }
};




  const getStatusColor = (status: string) => {
    switch (status) {
      case "미처리": return "bg-red-500 text-white";
      case "처리중": return "bg-yellow-400 text-black";
      case "처리완료": return "bg-green-500 text-white";
      default: return "bg-gray-300 text-black";
    }
  };

  const handleCctvClick = (id: number) => {
    const clicked = cctvs.find((c) => c.id === id);
    if (!clicked) return;

    const matchedAlert = alertHistory.find(
      (alert) => alert.cctvId === clicked.id && alert.location === clicked.location
    );

    if (matchedAlert) {
      setSelectedAlertImage(matchedAlert.imgPath);
    } else if (alertHistory.length > 0) {
      setSelectedAlertImage(alertHistory[0].imgPath);
    }

    setActiveCctvs((prev) => ({
      ...prev,
      [clicked.location]: id,
      [clicked.location === "EAST" ? "WEST" : "EAST"]: null,
    }));

    setHighlightedCctvId(id);
  };

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-6 space-y-6">
      {/* 상단 통계 카드 */}
      <div className="bg-[#5F69C7] rounded-2xl px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-5">
            <div className="text-sm text-muted-foreground">이상물체 탐지 수 (일)</div>
            <div className="text-2xl font-bold mt-2">{alertHistory.length}건</div>
            <div className="text-xs text-green-600 mt-1">전일 대비 +20%</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5">
            <div className="text-sm text-muted-foreground">실시간 CCTV 수</div>
            <div className="text-2xl font-bold mt-2">{cctvs.length}대</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5">
            <div className="text-sm text-muted-foreground">최근 탐지 내역</div>
            {alertHistory[0] ? (
              <>
                <div className="text-lg font-semibold mt-2">{alertHistory[0].location} - CCTV {alertHistory[0].cctvId}</div>
                <div className="text-xs text-muted-foreground">{alertHistory[0].eventDate} {alertHistory[0].eventTime}</div>
              </>
            ) : (
              <div className="text-sm mt-2 text-muted-foreground">데이터 없음</div>
            )}
          </div>
          <div className="bg-white rounded-xl shadow-md p-5">
            <div className="text-sm text-muted-foreground">최다 탐지 유형</div>
            <div className="text-lg font-semibold mt-2 text-red-600">조류</div>
            <div className="text-xs text-red-500">지난 주 23건</div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 활주로 현황 */}
        <Card className="lg:col-span-2 bg-white rounded-xl shadow-md border border-border">
          <CardHeader>
            <CardTitle>활주로 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full h-[250px] bg-white rounded-lg overflow-hidden">
              <img src={airportGroundMap} alt="공항 지도" className="object-contain w-full h-full" />
              {cctvs.map((cctv) => {
                const isActive = activeCctvs[cctv.location] === cctv.id;
                const isSelected = highlightedCctvId === cctv.id;

                // ✅ 콘솔로 alert 비교 시도 로그 찍기
                const matchedAlert = alertHistory.find((alert) => {
                  const match = Number(alert.cctvId) === Number(cctv.id) && alert.location === cctv.location;
                  console.log(
                    `🔍 비교중 → alert.cctvId: ${alert.cctvId}, alert.location: ${alert.location} |`,
                    `cctv.id: ${cctv.id}, cctv.location: ${cctv.location} |`,
                    `matched: ${match}`
                  );
                  return match;
                });

                const statusText = matchedAlert ? getStatusText(Number(matchedAlert.manage)) : "미상";

                const statusBorderColor =
                  statusText === "처리완료"
                    ? "border-green-500"
                    : statusText === "처리중"
                      ? "border-yellow-400"
                      : statusText === "미처리"
                        ? "border-red-500"
                        : "border-black";

                // ✅ 상태 확인 최종 로그
                console.log("🟢 CCTV:", cctv.id, "statusText:", statusText, "color:", statusBorderColor);

                return (
                  <div key={cctv.id} className="absolute" style={{ top: cctv.top, left: cctv.left }}>
                    {isActive && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl text-red-600 drop-shadow-lg animate-bounce">⬇</div>
                    )}
                    <button
                      onClick={() => handleCctvClick(cctv.id)}
                      className={`w-10 h-10 p-1 rounded-full border-4 flex items-center justify-center
          ${statusBorderColor} 
          ${isSelected ? "ring-4 ring-black/30" : ""}
          bg-white`}
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

        {/* CCTV 영상 */}
        <Card className="bg-white rounded-xl shadow-md border border-border">
          <CardHeader>
            <CardTitle>CCTV 영상</CardTitle>
            <p className="text-sm text-muted-foreground">탐지된 물체 영상</p>
          </CardHeader>
          <CardContent>
            <div className="relative w-full h-[300px] rounded-lg overflow-hidden bg-gray-100">
              {selectedAlertImage ? (
                <img
                  src={`${selectedAlertImage.startsWith("/") ? selectedAlertImage : `/${selectedAlertImage}`}`}
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

      {/* 알림 내역 + 근무자 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white rounded-xl shadow-md border border-border">
          <CardHeader>
  <div className="flex items-center justify-between">
    <CardTitle>이상물체 탐지 알림 내역</CardTitle>
    <div className="flex gap-2">
    {["전체", "미처리", "처리중", "처리완료"].map((status) => (
  <button
    key={status}
    className={`px-3 py-1 rounded-full text-sm border transition ${
      selectedStatus === status
        ? "bg-blue-600 text-white"
        : "bg-white text-gray-800 border-gray-300"
    }`}
    onClick={() => {
      setSelectedStatus(status);
      setSelectedAlertImage(null);
      setHighlightedCctvId(null);
      setActiveCctvs({ EAST: null, WEST: null });

      // ✅ 스크롤 맨 위로
      if (alertListRef.current) {
        alertListRef.current.scrollTop = 0;
      }
    }}
  >
    {status}
  </button>
))}

    </div>
  </div>
</CardHeader>

         <CardContent>
  <div
    ref={alertListRef} // ✅ 요기만 추가하면 됨
    className="max-h-[320px] overflow-y-auto pr-1 space-y-3"
  >

             {[...alertHistory]
  .filter((alert: AlertEvent) => {
    const manageStatus = getStatusText(alert.manage);
    console.log(
      "🧪 필터링 테스트 →",
      "selectedStatus:", selectedStatus,
      "| alert.manage:", alert.manage,
      "| 변환값:", manageStatus
    );
   return selectedStatus === "전체" || getStatusText(alert.manage) === selectedStatus;

  })
  .sort((a, b) => {
    return (
      new Date(`${b.eventDate}T${b.eventTime}`).getTime() -
      new Date(`${a.eventDate}T${a.eventTime}`).getTime()
    );
  })
  .map((alert) => (
    <div
      key={alert.eventId}
      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:shadow transition cursor-pointer"
      onClick={() => {
        setSelectedAlertImage(alert.imgPath);

        const targetCctvs = cctvs.filter((c) => c.location === alert.location);
        if (targetCctvs.length > 0) {
          const randomCctv = targetCctvs[Math.floor(Math.random() * targetCctvs.length)];

          setActiveCctvs({
            EAST: alert.location === "EAST" ? randomCctv.id : null,
            WEST: alert.location === "WEST" ? randomCctv.id : null,
          });

          setHighlightedCctvId(randomCctv.id);
        }
      }}
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">📦</div>
        <div>
          <div className="text-sm font-semibold">
            탐지 유형: <span className="text-primary">{alert.itemType}</span> · 수량: <span>{alert.itemCount}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            위치: <span className="text-blue-600 font-medium">{alert.location}</span> · 일시: {alert.eventDate} {alert.eventTime}
          </div>
        </div>
      </div>
      <Badge className={`px-3 py-1 text-sm rounded-full font-semibold ${getStatusColor(getStatusText(alert.manage))}`}>
        {getStatusText(alert.manage)}
      </Badge>
    </div>
  ))}

            </div>
          </CardContent>
        </Card>

        {/* 현재 근무자 */}
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
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
