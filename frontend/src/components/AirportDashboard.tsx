import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bell, BellOff, Settings, Filter, Monitor,
  AlertTriangle, Car, User, Bird, Cat, XCircle, Plane,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import profileMan1 from "@/assets/profile/man1.png";

// ==========================
// 타입/상수/유틸 - BEGIN
// ==========================
interface UserData { 
  MEMBER_NAME: string; 
  DEPARTMENT: string; 
  MEMBER_ID?: string; // 로그인한 사용자의 ID (백엔드에서 받아올 예정)
}
type StatusType = "미처리" | "처리중" | "처리완료";
interface DetectionItem { ITEM_TYPE: string; ITEM_COUNT: number; }
interface DetectionEvent {
  EVENT_ID: string; EVENT_DATE: string; EVENT_TIME: string; CCTV_ID: string;
  IMG_PATH: string; MANAGE: StatusType; ITEMS?: DetectionItem[]; LOCATION?: string;
}

const DEFAULT_USER: UserData = { MEMBER_NAME: "한경찰", DEPARTMENT: "공항순찰대" };
const STATUS_ENUM: StatusType[] = ["미처리", "처리중", "처리완료"];
const STATUS_BADGE: Record<StatusType, string> = {
  미처리: "bg-red-500 text-white",
  처리중: "bg-orange-500 text-white",
  처리완료: "bg-success text-success-foreground"
};

const STATUS_STYLEMAP = [
  { bg: "bg-red-500", hover: "hover:bg-red-600", text: "text-white", border: "border-red-500" },
  { bg: "bg-orange-500", hover: "hover:bg-orange-600", text: "text-white", border: "border-orange-500" },
  { bg: "bg-green-600", hover: "hover:bg-green-700", text: "text-white", border: "border-green-600" },
];

const NOTIFICATION_TYPES = [
  { key: "general", label: "알림받기", bg: "bg-success", text: "text-success", icon: Bell },
  { key: "emergency", label: "일시정지", bg: "bg-warning", text: "text-warning", icon: BellOff }
];

const API_URL = "http://223.130.130.196:8090/api/eventlist";
const MEMBER_API_URL = "http://223.130.130.196:8090/api/member/workerlist";
// 로그인한 사용자 정보를 가져오는 샘플 API (백엔드 개발팀과 협의 후 실제 주소로 변경)
const USER_INFO_API_URL = "http://223.130.130.196:8090/api/member/user-info";

// ========== 유틸 ==========
const mapApiEvent = apiEvent => ({
  EVENT_ID: String(apiEvent.eventId ?? apiEvent.EVENT_ID),
  EVENT_DATE: apiEvent.eventDate ?? apiEvent.EVENT_DATE,
  EVENT_TIME: apiEvent.eventTime ?? apiEvent.EVENT_TIME,
  CCTV_ID: apiEvent.cctvId !== undefined
    ? (typeof apiEvent.cctvId === "number" ? `CCTV${apiEvent.cctvId}` : apiEvent.cctvId)
    : (apiEvent.CCTV_ID ?? ""),
  IMG_PATH: apiEvent.imgPath ?? apiEvent.IMG_PATH,
  MANAGE: typeof apiEvent.manage === "number"
    ? (apiEvent.manage === 0 ? "미처리" : apiEvent.manage === 1 ? "처리중" : "처리완료")
    : (apiEvent.MANAGE ?? "미처리"),
  ITEMS: apiEvent.itemType
    ? [{ ITEM_TYPE: apiEvent.itemType, ITEM_COUNT: apiEvent.itemCount }]
    : (apiEvent.ITEMS ?? []),
  LOCATION: apiEvent.location ?? apiEvent.LOCATION
});

const ItemTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "차량": case "vehicle": return <Car className="h-10 w-10 text-black" />;
    case "사람": case "person": return <User className="h-10 w-10 text-black" />;
    case "조류": case "bird": return <Bird className="h-10 w-10 text-black" />;
    case "포유류": case "mammal": return <Cat className="h-10 w-10 text-black" />;
    case "비행기": case "airplane": return <Plane className="h-10 w-10 text-black" />;
    default: return <XCircle className="h-10 w-10 text-black" />;
  }
};

const StatusBadge = ({ manage, onClick }: { manage: StatusType; onClick: () => void; }) => (
  <div className="inline-block cursor-pointer" onClick={e => { e.stopPropagation(); onClick(); }}>
    <Badge className={`STATUS_BADGE[manage] px-1.5 py-1.5`}>{manage}</Badge>
  </div>
);

const StatusChangePopup = ({
  visible, targetEvent, currentStatusIdx, onChange, onClose
}: {
  visible: boolean; targetEvent: DetectionEvent | null;
  currentStatusIdx: number; onChange: (num: number) => void;
  onClose: () => void;
}) => {
  if (!visible || !targetEvent) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-all">
      <div
        className="bg-white rounded-xl shadow-2xl border-2 border-primary/60 p-6 min-w-[240px] transition-all duration-200"
        style={{ boxShadow: "0 8px 24px rgba(60,60,100,0.18), 0 1.5px 6px rgba(70,120,180,0.10)" }}
      >
        <div className="font-bold mb-3 text-black border-b pb-2 border-border/40">작업 상태 변경</div>
        {STATUS_ENUM.map((label, idx) => {
          const isCurrent = currentStatusIdx === idx;
          const style = STATUS_STYLEMAP[idx];
          return (
            <button
              key={label}
              className={`block w-full rounded-lg px-4 py-2 mb-2 text-left border-2 transition-all duration-150
              ${isCurrent
                  ? `${style.bg} text-black font-bold ${style.border}`
                  : `bg-white text-black border-gray-200 ${style.hover}`
                }`}
              onClick={() => onChange(idx)}
              disabled={isCurrent}
              style={{ cursor: isCurrent ? "not-allowed" : "pointer", opacity: isCurrent ? 0.7 : 1 }}
            >
              {label}
            </button>
          );
        })}
        <button
          className="mt-2 w-full text-gray-400 hover:text-primary font-medium rounded-lg transition"
          onClick={onClose}
          style={{ background: "none", border: "none" }}
        >
          닫기
        </button>
      </div>
    </div>
  );
};
// ==========================
// 타입/상수/유틸 - END
// ==========================

const AirportDashboard = () => {
  const { toast } = useToast();
  const cctvSectionRef = useRef<HTMLDivElement>(null);

  const [userData, setUserData] = useState<UserData>(DEFAULT_USER);
  const [events, setEvents] = useState<DetectionEvent[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<'general' | 'emergency'>('general');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<DetectionEvent | null>(null);
  const [showSetting, setShowSetting] = useState(false);
  const [statusPopupTarget, setStatusPopupTarget] = useState<DetectionEvent | null>(null);
  const [showPausePopup, setShowPausePopup] = useState(false);

  // ⬇️ 로그인한 사용자 정보 가져오기
  useEffect(() => {
    // TODO: 백엔드 개발팀과 협의 후 실제 API 주소로 변경
    // 현재는 샘플 API 호출로 구현
    axios.get(USER_INFO_API_URL)
      .then(res => {
        // 백엔드에서 받아올 예상 데이터 구조:
        // { memberName: "사용자명", department: "부서명", memberId: "사용자ID" }
        const userInfo = res.data;
        if (userInfo && userInfo.memberName) {
          setUserData({
            MEMBER_NAME: userInfo.memberName,
            DEPARTMENT: userInfo.department,
            MEMBER_ID: userInfo.memberId // 백엔드에서 받아온 사용자 ID
          });
          toast({ title: "로그인 성공", description: `${userInfo.memberName}님 환영합니다.` });
        } else {
          setUserData(DEFAULT_USER);
          toast({ title: "사용자 정보 없음", description: "기본 사용자로 표기합니다.", variant: "destructive" });
        }
      })
      .catch((error) => {
        console.error('사용자 정보 가져오기 실패:', error);
        setUserData(DEFAULT_USER);
        toast({ title: "유저 정보 불러오기 실패", description: "기본 사용자로 표기합니다.", variant: "destructive" });
      });
  }, [toast]);

  // ⬇️ 이벤트 리스트
  useEffect(() => {
    axios.get(API_URL)
      .then(res => {
        if (Array.isArray(res.data)) {
          setEvents(res.data.map(mapApiEvent));
        } else if (Array.isArray(res.data.data)) {
          setEvents(res.data.data.map(mapApiEvent));
        }
      })
      .catch(() => {
        toast({ title: "이벤트 데이터 불러오기 실패", description: "서버 또는 네트워크 오류 발생", variant: "destructive" });
      });
  }, [toast]);

  const filteredEvents = (filterStatus === "all" ? events : events.filter(ev => ev.MANAGE === filterStatus))
    .sort((a, b) => {
      // EVENT_DATE와 EVENT_TIME을 결합하여 날짜시간 문자열 생성
      const dateTimeA = `${a.EVENT_DATE} ${a.EVENT_TIME}`;
      const dateTimeB = `${b.EVENT_DATE} ${b.EVENT_TIME}`;
      
      // 내림차순 정렬 (최신순)
      return new Date(dateTimeB).getTime() - new Date(dateTimeA).getTime();
    });

  const handleStatusChange = async (event: DetectionEvent, num: number) => {
    try {
      await axios.patch(`/api/event/${event.EVENT_ID}/status`, { status: num });
      setEvents(prev =>
        prev.map(ev =>
          ev.EVENT_ID === event.EVENT_ID
            ? { ...ev, MANAGE: STATUS_ENUM[num] as StatusType }
            : ev
        )
      );
      toast({ title: "상태 변경 성공", description: `"${STATUS_ENUM[num]}"로 변경됨` });
      setStatusPopupTarget(null);
    } catch {
      toast({ title: "상태 변경 실패", description: "서버 또는 네트워크 오류" });
    }
  };

  // 이벤트 선택 시 하단 CCTV 영역으로 스크롤
  const handleEventSelect = (event: DetectionEvent) => {
    setSelectedEvent(event);
    // 약간의 지연을 두어 상태 업데이트 후 스크롤 실행
    setTimeout(() => {
      cctvSectionRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  };

  // 일시정지 시간 설정 함수
  const handlePauseAlert = async (minutes: number) => {
    try {
      // 백엔드 API 요청 (샘플)
      // TODO: 백엔드 개발팀과 협의 후 실제 API 주소로 변경
      const response = await axios.post(`http://223.130.130.196:8090/api/member/pause-alert`, {
        memberId: userData.MEMBER_ID, // 로그인한 사용자의 MEMBER_ID
        alertState: 0, // 일시정지 상태 (0: 정지, 1: 활성화)
        pauseMinutes: minutes // 일시정지 시간 (분)
      });
      
      console.log('백엔드 응답:', response.data);
      
             toast({ 
         title: "일시정지 설정 완료", 
         description: `${minutes}분 동안 알림이 일시정지됩니다.` 
       });
       setShowPausePopup(false);
       // 일시정지 설정 후 선택 상태 유지 (색상 변화 유지)
    } catch (error) {
      console.error('일시정지 설정 오류:', error);
      toast({ 
        title: "일시정지 설정 실패", 
        description: "서버 또는 네트워크 오류가 발생했습니다.", 
        variant: "destructive" 
      });
    }
  };

  // =================== UI ===================
  return (
    <div className="h-screen overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5 flex justify-center">
      <div className="w-full max-w-[430px] min-h-[932px] p-4 space-y-6">

        {/* 프로필/환경설정 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={profileMan1} />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {userData.MEMBER_NAME ? userData.MEMBER_NAME.slice(0, 2) : "한경"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold text-foreground">{userData.MEMBER_NAME}</h1>
              <p className="text-sm text-muted-foreground">{userData.DEPARTMENT}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full shadow-soft"
            onClick={() => setShowSetting(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        {showSetting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" style={{ backdropFilter: "blur(2px)" }}>
            <div className="bg-white rounded-xl p-6 relative shadow-lg min-w-[320px] max-w-[90vw] mx-2">
              <button
                className="absolute top-3 right-4 text-xl text-gray-400 hover:text-gray-800"
                onClick={() => setShowSetting(false)}
                aria-label="닫기"
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, lineHeight: 1 }}>
                ×
              </button>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 mr-1" />
                환경설정
              </h2>
              <div className="space-y-2">
                <p>✏️ <b>추가할 기능</b>을 이 영역에 자유롭게 삽입하세요.</p>
              </div>
            </div>
          </div>
        )}

        {/* 알림 설정 카드 */}
        <Card className="shadow-soft border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Bell className="h-5 w-5 text-primary" />
              <span>알림 설정</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
                         <div className="grid grid-cols-2 gap-4">
               {NOTIFICATION_TYPES.map(({ key, label, bg, text, icon: Icon }) => {
                 const selected = selectedNotification === key;
                 return (
                   <div
                     key={key}
                     className={`flex flex-col items-center space-y-2 p-4 rounded-xl cursor-pointer transition-all
                       ${selected
                         ? `${bg} text-white border-2 border-[${bg.replace("bg-", "")}]`
                         : `${bg}/10 border border-[${bg.replace("bg-", "")}]/20 hover:${bg}/20`
                       }`}
                                           onClick={() => {
                        if (key === 'emergency') {
                          setSelectedNotification('emergency');
                          setShowPausePopup(true);
                        } else {
                          setSelectedNotification(key as any);
                        }
                      }}
                   >
                     <Icon className={`h-8 w-8 ${selected ? "text-white" : text}`} />
                     <span className={`text-sm font-medium ${selected ? "text-white" : text}`}>{label}</span>
                   </div>
                 );
               })}
             </div>
          </CardContent>
        </Card>

        {/* 이상물체 탐지 알림 내역 */}
        <Card className="shadow-soft border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2 text-lg">
                {/* <AlertTriangle className="h-5 w-5 text-warning" /> */}
                <span>이상물체 탐지 알림 내역</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="text-sm border rounded-md px-2 py-1 bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="all">전체</option>
                  {STATUS_ENUM.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[504px] overflow-y-auto">
              {filteredEvents.map((ev, index) => {
                const firstItemType = ev.ITEMS?.[0]?.ITEM_TYPE;
                return (
                  <div
                    key={`${ev.EVENT_ID}-${firstItemType}-${index}`}
                    className={[
                      "flex flex-col space-y-2 p-4 rounded-xl border cursor-pointer transition-colors",
                      selectedEvent?.EVENT_ID === ev.EVENT_ID
                        ? "bg-primary/10 border-primary/30"
                        : "bg-background/50 border-border/50 hover:bg-accent/50"
                    ].join(" ")}
                    onClick={() => handleEventSelect(ev)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">{firstItemType && <ItemTypeIcon type={firstItemType} />}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">위치: {ev.LOCATION} - {ev.CCTV_ID}</p>
                            <p className="text-xs text-muted-foreground mt-1">일시: {ev.EVENT_DATE} {ev.EVENT_TIME}</p>
                          </div>
                          <div className="text-right">
                            <StatusBadge manage={ev.MANAGE} onClick={() => setStatusPopupTarget(ev)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

                 {/* 상태변경 팝업 */}
         <StatusChangePopup
           visible={!!statusPopupTarget}
           targetEvent={statusPopupTarget}
           currentStatusIdx={statusPopupTarget ? STATUS_ENUM.indexOf(statusPopupTarget.MANAGE) : 0}
           onChange={num => statusPopupTarget && handleStatusChange(statusPopupTarget, num)}
           onClose={() => setStatusPopupTarget(null)}
         />

         {/* 일시정지 팝업 */}
         {showPausePopup && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-all">
             <div className="bg-white rounded-xl shadow-2xl border-2 border-primary/60 p-6 min-w-[280px] transition-all duration-200">
               <div className="flex items-center justify-between mb-4">
                 <div className="font-bold text-lg text-black">일시정지 시간 선택</div>
                 <button
                   className="text-gray-400 hover:text-gray-800 text-xl"
                   onClick={() => setShowPausePopup(false)}
                   style={{ background: "none", border: "none", cursor: "pointer" }}
                 >
                   ×
                 </button>
               </div>
               <div className="space-y-3">
                 {[
                   { label: "10분", minutes: 10 },
                   { label: "30분", minutes: 30 },
                   { label: "1시간", minutes: 60 },
                   { label: "4시간", minutes: 240 },
                   { label: "24시간", minutes: 1440 }
                 ].map(({ label, minutes }) => (
                   <button
                     key={minutes}
                     className="block w-full rounded-lg px-4 py-3 text-left border-2 transition-all duration-150 bg-white text-black border-gray-200 hover:bg-primary/10 hover:border-primary/30"
                     onClick={() => handlePauseAlert(minutes)}
                   >
                     <div className="font-medium">{label}</div>
                     <div className="text-sm text-gray-500">알림이 일시정지됩니다</div>
                   </button>
                 ))}
               </div>
               <button
                 className="mt-4 w-full text-gray-400 hover:text-primary font-medium rounded-lg transition py-2"
                 onClick={() => setShowPausePopup(false)}
                 style={{ background: "none", border: "none" }}
               >
                 닫기
               </button>
             </div>
           </div>
         )}

        {/* CCTV 모니터링 및 상세 ITEMS */}
        <Card ref={cctvSectionRef} className="shadow-soft border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Monitor className="h-5 w-5 text-primary" />
              <span>
                {selectedEvent
                  ? `${selectedEvent.LOCATION ? selectedEvent.LOCATION + " - " : ""}${selectedEvent.CCTV_ID}`
                  : "이상물체 탐지현황"}
              </span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {selectedEvent ? "" : "알림 선택시 이상물체 탐지 이미지를 볼 수 있습니다"}
            </p>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-xl overflow-hidden bg-black/5 border border-border/50">
              {selectedEvent ? (
                <>
                  <img
                    src={selectedEvent.IMG_PATH}
                    alt={`${selectedEvent.CCTV_ID} 이미지`}
                    className="rounded-xl w-full h-64 object-cover bg-black"
                  />
                  {selectedEvent.ITEMS?.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 10,
                        width: "100%",
                        color: "white",
                        paddingLeft: 12,
                        paddingRight: 12,
                        fontSize: 20,
                        textShadow: "0 0 5px rgba(0,0,0,0.85)",
                        backgroundColor: "transparent",
                        borderRadius: 0
                      }}
                    >
                      탐지된 물체 :{" "}
                      {selectedEvent.ITEMS.map(item => `${item.ITEM_TYPE} ${item.ITEM_COUNT}`).join(", ")}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-64 flex items-center justify-center bg-muted/20">
                  <p className="text-muted-foreground">목록 선택시 이미지 표시 가능합니다</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AirportDashboard;
