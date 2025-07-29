import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import airportGroundMap from "@/components/airport-ground-map.png";

// 타입 정의
interface AlertEvent {
  eventId: number;
  eventDate: string;
  eventTime: string;
  cctvId: number;
  imgPath: string;
  manage: number;
  objects: any;
  location: string;
  itemType: string;
  itemCount: number;
}

interface Worker {
  memberName: string;
  company: string;
  department: string;
  alertState: number; // 0: 위험, 1: 정상
}

interface Cctv {
  id: number;
  top: string;
  left: string;
  detected: boolean;
}

export default function Dashboard() {
  const [activeCctv, setActiveCctv] = useState<number | null>(null);
  const [alertHistory, setAlertHistory] = useState<AlertEvent[]>([]);
  const [cctvs, setCctvs] = useState<Cctv[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Worker[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("전체");

  useEffect(() => {
    console.log("🚀 Dashboard useEffect 실행됨");

    axios
      .get("http://223.130.130.196:8090/api/eventlist")
      .then((res) => {
        console.log("✅ eventlist 불러옴", res.data);
        setAlertHistory(res.data);
      })
      .catch((err) => console.error("❌ eventlist 에러:", err));

    axios
      .get("http://223.130.130.196:8090/api/member/workerlist")
      .then((res) => {
        console.log("✅ workerlist 불러옴", res.data);
        setRecentAlerts(res.data);
      })
      .catch((err) => console.error("❌ workerlist 에러:", err));

    fetch("/cctvs.json")
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ cctvs.json 불러옴", data);
        setCctvs(data);
      })
      .catch((err) => console.error("❌ cctvs.json 에러:", err));
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
        return "미상";
    }
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

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-6 space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white rounded-xl shadow-md border border-border">
          <CardHeader>
            <CardTitle>활주로 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full h-[250px] bg-white rounded-lg overflow-hidden">
              <img src={airportGroundMap} alt="공항 지도" className="object-contain w-full h-full" />
              {cctvs.map((cctv) => (
                <button
                  key={cctv.id}
                  className={`absolute rounded-full w-10 h-10 flex items-center justify-center text-white text-lg shadow transition-colors ${cctv.detected ? "bg-red-600" : "bg-green-600"}`}
                  style={{ top: cctv.top, left: cctv.left }}
                  onClick={() => setActiveCctv((prev) => (prev === cctv.id ? null : cctv.id))}
                >
                  {activeCctv === cctv.id ? "↑" : "📷"}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-md border border-border">
          <CardHeader>
            <CardTitle>CCTV 영상</CardTitle>
            <p className="text-sm text-muted-foreground">탐지된 물체 영상 스트리밍</p>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-lg overflow-hidden">
              {activeCctv === 3 ? (
                <video autoPlay muted playsInline controls className="w-full h-48 object-cover rounded-md">
                  <source src="/KakaoTalk_20250716_101715778.mp4" type="video/mp4" />
                  브라우저가 비디오를 지원하지 않습니다.
                </video>
              ) : activeCctv === 2 ? (
                <iframe
                  src="https://www.youtube.com/embed/MjD3gnNFYUo?autoplay=1&mute=1"
                  title="YouTube video player"
                  className="w-full h-48 rounded-md"
                  frameBorder="0"
                  allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  CCTV를 선택하세요
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
              <select
                className="border rounded-md text-sm px-2 py-1"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="전체">전체</option>
                <option value="처리완료">처리완료</option>
                <option value="미처리">미처리</option>
                <option value="처리중">처리중</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[320px] overflow-y-auto pr-1 space-y-3">
              {alertHistory
                .filter((alert) => selectedStatus === "전체" || getStatusText(alert.manage) === selectedStatus)
                .map((alert) => (
                  <div
                    key={alert.eventId}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:shadow transition"
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

        <Card className="bg-white rounded-xl shadow-md border border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold">현재 근무자</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAlerts.map((person, index) => {
                if (!person || !person.memberName) return null;

                return (
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
                    <div className={`w-3 h-3 rounded-full ${person.alertState === 0 ? "bg-destructive" : "bg-green-500"}`} />
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
