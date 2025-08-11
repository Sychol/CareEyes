import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  BellOff,
  Settings,
  Filter,
  Monitor,
  Car,
  User,
  Bird,
  Cat,
  XCircle,
  Plane,
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import profileMan1 from "@/assets/profile/man1.png";

// ==========================
// 타입/상수/유틸 - BEGIN
// ==========================
interface UserData {
  MEMBER_NAME: string;
  DEPARTMENT: string;
  MEMBER_ID?: string; // 로그인한 사용자의 ID
  ALERT_STATE?: 0 | 1; // 0: 일시정지, 1: 알림받기
  KAKAO_ID?: number; // 카카오 연동 ID (선택적)
}

type StatusType = "미처리" | "처리중" | "처리완료";

interface DetectionItem {
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
  ITEMS?: DetectionItem[];
  LOCATION?: string;
}

// itemType을 한국어로 변환하는 함수
const translateItemType = (itemType: string): string => {
  switch (itemType) {
    case "airplane":
      return "비행기";
    case "vehicle":
      return "자동차";
    case "bird":
      return "새";
    case "mammal":
      return "포유류";
    case "person":
      return "사람";
    default:
      return itemType;
  }
};

const DEFAULT_USER: UserData = {
  MEMBER_NAME: "한경찰",
  DEPARTMENT: "공항순찰대",
  ALERT_STATE: 1, // 기본은 알림받기 활성화
};

const STATUS_ENUM: StatusType[] = ["미처리", "처리중", "처리완료"];

const STATUS_STYLEMAP = [
  {
    bg: "bg-red-400",
    hover: "hover:bg-red-500",
    text: "text-white",
    border: "border-red-500",
  },
  {
    bg: "bg-yellow-400",
    hover: "hover:bg-yellow-500",
    text: "text-black",
    border: "border-orange-500",
  },
  {
    bg: "bg-green-400",
    hover: "hover:bg-green-500",
    text: "text-white",
    border: "border-green-500",
  },
];

const NOTIFICATION_TYPES = [
  {
    key: "general",
    label: "알림받기",
    bg: "bg-success",
    text: "text-success",
    icon: Bell,
  },
  {
    key: "emergency",
    label: "일시정지",
    bg: "bg-warning",
    text: "text-warning",
    icon: BellOff,
  },
];

const API_URL = "/api/eventlist";
const USER_INFO_API_URL = "/api/member/userinfo";

// API 이벤트 응답을 DetectionEvent 타입에 맞게 변환
const mapApiEvent = (apiEvent) => ({
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

const ItemTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "차량":
    case "vehicle":
      return <Car className="h-8 w-8 sm:h-10 sm:w-10 text-black" />;
    case "사람":
    case "person":
      return <User className="h-8 w-8 sm:h-10 sm:w-10 text-black" />;
    case "조류":
    case "bird":
      return <Bird className="h-8 w-8 sm:h-10 sm:w-10 text-black" />;
    case "포유류":
    case "mammal":
      return <Cat className="h-8 w-8 sm:h-10 sm:w-10 text-black" />;
    case "비행기":
    case "airplane":
      return <Plane className="h-8 w-8 sm:h-10 sm:w-10 text-black" />;
    default:
      return <XCircle className="h-8 w-8 sm:h-10 sm:w-10 text-black" />;
  }
};

const StatusBadge = ({
  manage,
  onClick,
}: {
  manage: StatusType;
  onClick: () => void;
}) => (
  <div
    className="inline-block cursor-pointer"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
  >
    <Badge
      className={
        manage === "미처리"
          ? "bg-red-400 text-white py-1.5 sm:py-2 px-2 w-16 sm:w-20 text-center whitespace-nowrap flex items-center justify-center text-xs sm:text-sm"
          : manage === "처리중"
          ? "bg-yellow-400 text-black py-1.5 sm:py-2 px-2 w-16 sm:w-20 text-center whitespace-nowrap flex items-center justify-center text-xs sm:text-sm"
          : manage === "처리완료"
          ? "bg-green-400 text-white py-1.5 sm:py-2 px-2 w-16 sm:w-20 text-center whitespace-nowrap flex items-center justify-center text-xs sm:text-sm"
          : ""
      }
    >
      {manage}
    </Badge>
  </div>
);

const StatusChangePopup = ({
  visible,
  targetEvent,
  currentStatusIdx,
  onChange,
  onClose,
}: {
  visible: boolean;
  targetEvent: DetectionEvent | null;
  currentStatusIdx: number;
  onChange: (num: number) => void;
  onClose: () => void;
}) => {
  if (!visible || !targetEvent) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-all p-4">
      <div
        className="bg-white rounded-xl shadow-2xl border-2 border-primary/60 p-4 sm:p-6 w-full max-w-[280px] sm:min-w-[240px] transition-all duration-200"
        style={{
          boxShadow:
            "0 8px 24px rgba(60,60,100,0.18), 0 1.5px 6px rgba(70,120,180,0.10)",
        }}
      >
        <div className="font-bold mb-3 text-black border-b pb-2 border-border/40 text-sm sm:text-base">
          작업 상태 변경
        </div>
        {STATUS_ENUM.map((label, idx) => {
          const isCurrent = currentStatusIdx === idx;
          const style = STATUS_STYLEMAP[idx];
          return (
            <button
              key={label}
              className={`block w-full rounded-lg px-3 sm:px-4 py-2 mb-2 text-left border-2 transition-all duration-150 text-sm sm:text-base
                ${
                  isCurrent
                    ? `${style.bg} text-black font-bold ${style.border}`
                    : `bg-white text-black border-gray-200 ${style.hover}`
                }`}
              onClick={() => onChange(idx)}
              disabled={isCurrent}
              style={{
                cursor: isCurrent ? "not-allowed" : "pointer",
                opacity: isCurrent ? 0.7 : 1,
              }}
            >
              {label}
            </button>
          );
        })}
        <button
          className="mt-2 w-full text-gray-400 hover:text-primary font-medium rounded-lg transition text-sm sm:text-base"
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
  const navigate = useNavigate();
  const cctvSectionRef = useRef<HTMLDivElement>(null);

  const [userData, setUserData] = useState<UserData>(DEFAULT_USER);
  const [events, setEvents] = useState<DetectionEvent[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<
    "general" | "emergency" | "none"
  >("general");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<DetectionEvent | null>(
    null
  );

  const [statusPopupTarget, setStatusPopupTarget] =
    useState<DetectionEvent | null>(null);
  const [showPausePopup, setShowPausePopup] = useState(false);

  // 1. 로그인한 사용자 정보 가져오기 + ALERT_STATE 처리
  useEffect(() => {
    axios
      .get(USER_INFO_API_URL, { 
        withCredentials: true,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        params: {
          _t: Date.now()
        }
      })
      .then((res) => {
        const userInfo = res.data;
        if (userInfo && userInfo.memberName) {
          setUserData({
            MEMBER_NAME: userInfo.memberName,
            DEPARTMENT: userInfo.department,
            MEMBER_ID: userInfo.memberId,
            ALERT_STATE: userInfo.alertState, // 0/1 서버값 그대로
            KAKAO_ID: userInfo.kakaoId, // 카카오 연동 ID
          });
          setSelectedNotification(
            userInfo.alertState === 1 ? "general" : "emergency"
          );
          toast({
            title: "로그인 성공",
            description: `${userInfo.memberName}님 환영합니다.`,
            className: `
              fixed top-6 left-1/2 -translate-x-1/2 z-[9999]
              min-w-[280px] max-w-[380px] w-[80vw]
              rounded-xl shadow-2xl px-4 py-3
              bg-white border-2 border-primary/60
              text-black
            `,
            duration: 1500,
          });
        } else {
          setUserData(DEFAULT_USER);
          setSelectedNotification("general");
          toast({
            title: "사용자 정보 없음",
            description: "기본 사용자로 표기합니다.",
            variant: "destructive",
            className: `
              fixed top-6 left-1/2 -translate-x-1/2 z-[9999]
              min-w-[280px] max-w-[380px] w-[80vw]
              rounded-xl shadow-2xl px-4 py-3
              bg-white border-2 border-primary/60
              text-black
            `,
            duration: 1500,
          });
        }
      })
      .catch((error) => {
        console.error("사용자 정보 가져오기 실패:", error);
        setUserData(DEFAULT_USER);
        setSelectedNotification("general");
        toast({
          title: "유저 정보 불러오기 실패",
          description: "기본 사용자로 표기합니다.",
          variant: "destructive",
          className: `
            fixed top-6 left-1/2 -translate-x-1/2 z-[9999]
            min-w-[280px] max-w-[380px] w-[80vw]
            rounded-xl shadow-2xl px-4 py-3
            bg-white border-2 border-primary/60
            text-black
          `,
          duration: 1500,
        });
      });
  }, [toast]);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.filter-container')) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 사용자 정보 갱신 함수
  const fetchUserInfo = () => {
    const axiosInstance = axios.create({
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'If-Modified-Since': '0',
        'If-None-Match': '0',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    // 항상 userinfo API를 사용하여 현재 사용자의 최신 상태를 가져옴
    axiosInstance
      .get("/api/member/userinfo", { 
        withCredentials: true,
        // URL에 타임스탬프와 랜덤 값 추가하여 캐시 무효화
        params: {
          _t: Date.now(),
          _v: Math.random().toString(36).substring(7),
          _r: Math.random().toString(36).substring(7)
        }
      })
      .then((res) => {
        const userInfo = res.data;
        if (userInfo && userInfo.memberName) {
          const newAlertState = userInfo.alertState;
          console.log("서버에서 받은 alertState:", newAlertState);
          console.log("현재 로컬 alertState:", userData.ALERT_STATE);
          
          // 상태가 실제로 변경되었는지 확인
          if (Number(userData.ALERT_STATE) !== newAlertState) {
            console.log("alertState 변경 감지:", userData.ALERT_STATE, "->", newAlertState);
            setUserData({
              MEMBER_NAME: userInfo.memberName,
              DEPARTMENT: userInfo.department,
              MEMBER_ID: userInfo.memberId,
              ALERT_STATE: newAlertState,
              KAKAO_ID: userInfo.kakaoId,
            });
            // alertState에 따라 알림 상태 설정
            setSelectedNotification(newAlertState === 1 ? "general" : "emergency");
          } else {
            console.log("alertState 변경 없음:", newAlertState);
          }
        }
      })
      .catch((error) => {
        console.error("사용자 정보 갱신 실패:", error);
        // 에러 발생 시 현재 상태 유지
      });
  };

  // 2. 이벤트 리스트 불러오기 (10초마다 갱신)
  useEffect(() => {
    const fetchEvents = () => {
      axios
        .get(API_URL, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        .then((res) => {
          if (Array.isArray(res.data)) {
            setEvents(res.data.map(mapApiEvent));
          } else if (Array.isArray(res.data.data)) {
            setEvents(res.data.data.map(mapApiEvent));
          }
        })
        .catch(() => {
          toast({
            title: "이벤트 데이터 불러오기 실패",
            description: "서버 또는 네트워크 오류 발생",
            variant: "destructive",
            className: `
              fixed top-6 left-1/2 -translate-x-1/2 z-[9999]
              min-w-[280px] max-w-[380px] w-[80vw]
              rounded-xl shadow-2xl px-4 py-3
              bg-white border-2 border-primary/60
              text-black
            `,
            duration: 1500,
          });
        });
    };

    // 초기 로드
    fetchEvents();
    fetchUserInfo();

    // 5초마다 갱신 (더 빠른 동기화)
    const interval = setInterval(() => {
      fetchEvents();
      fetchUserInfo();
    }, 5000);

    // 컴포넌트 언마운트 시 인터벌 정리
    return () => clearInterval(interval);
  }, [toast]);

  // 필터+정렬된 이벤트 리스트
  const filteredEvents = (
    filterStatus === "all"
      ? events
      : events.filter((ev) => ev.MANAGE === filterStatus)
  ).sort((a, b) => {
    const dateTimeA = `${a.EVENT_DATE} ${a.EVENT_TIME}`;
    const dateTimeB = `${b.EVENT_DATE} ${b.EVENT_TIME}`;
    return new Date(dateTimeB).getTime() - new Date(dateTimeA).getTime();
  });

  // 상태 변경 함수 (이상물체 처리 상태)
  const handleStatusChange = async (event: DetectionEvent, num: number) => {
    try {
      await axios.patch(`/api/event/${event.EVENT_ID}/status`, { status: num }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      setEvents((prev) =>
        prev.map((ev) =>
          ev.EVENT_ID === event.EVENT_ID
            ? { ...ev, MANAGE: STATUS_ENUM[num] as StatusType }
            : ev
        )
      );
      toast({
        title: "상태 변경 성공",
        description: `"${STATUS_ENUM[num]}"로 변경됨`,
        className: `
          fixed top-6 left-1/2 -translate-x-1/2 z-[9999]
          min-w-[280px] max-w-[380px] w-[80vw]
          rounded-xl shadow-2xl px-4 py-3
          bg-white border-2 border-primary/60
          text-black
        `,
        duration: 1500,
      });
      setStatusPopupTarget(null);
    } catch {
      toast({
        title: "상태 변경 실패",
        description: "서버 또는 네트워크 오류",
        className: `
          fixed top-6 left-1/2 -translate-x-1/2 z-[9999]
          min-w-[280px] max-w-[380px] w-[80vw]
          rounded-xl shadow-2xl px-4 py-3
          bg-white border-2 border-primary/60
          text-black
        `,
        duration: 1500,
      });
    }
  };

  // 이벤트 클릭 시 CCTV 이미지 영역으로 스크롤
  const handleEventSelect = (event: DetectionEvent) => {
    setSelectedEvent(event);
    setTimeout(() => {
      cctvSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // 알림 상태 변경 시 서버 동기화 함수
  const handleNotificationChange = async (newKey: "general" | "emergency") => {
    try {
      if (!userData.MEMBER_ID) throw new Error("사용자 ID가 없습니다.");

      console.log("알림 상태 변경 요청 시작 - 현재 alertState:", userData.ALERT_STATE, "새로운 상태:", newKey);

      let response;
      if (newKey === "general") {
        // 알림받기 활성화
        response = await axios.post(`/api/member/resume-alert`, {
          memberId: userData.MEMBER_ID,
        }, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      } else {
        // 일시정지 설정
        response = await axios.post(`/api/member/pause-alert`, {
          memberId: userData.MEMBER_ID,
          alertState: 0, // 일시정지 상태
        }, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      }

      // 서버 응답 확인 후 상태 업데이트
      if (response.data && response.data.success !== false) {
        console.log("알림 상태 변경 API 응답 성공:", response.data);
        
        // 로컬 상태 즉시 업데이트
        setSelectedNotification(newKey);
        setUserData((prev) => {
          if (prev) {
            const newAlertState = newKey === "general" ? 1 : 0;
            console.log("로컬 상태 업데이트:", prev.ALERT_STATE, "->", newAlertState);
            return { ...prev, ALERT_STATE: newAlertState };
          }
          return prev;
        });
        setShowPausePopup(false);

        // 즉시 서버에서 최신 상태 확인 (여러 번 시도)
        console.log("fetchUserInfo 호출 시작");
        fetchUserInfo();
        
        // 추가로 1초 후에도 한 번 더 확인
        setTimeout(() => {
          console.log("1초 후 추가 fetchUserInfo 호출");
          fetchUserInfo();
        }, 1000);

        toast({
          title: `알림 상태 변경됨`,
          description:
            newKey === "general"
              ? "알림받기가 활성화되었습니다."
              : "일시정지가 설정되었습니다.",
          className: `
            fixed top-6 left-1/2 -translate-x-1/2 z-[9999]
            min-w-[280px] max-w-[380px] w-[80vw]
            rounded-xl shadow-2xl px-4 py-3
            bg-white border-2 border-primary/60
            text-black
          `,
          duration: 1500,
        });
      } else {
        throw new Error("서버에서 상태 변경을 거부했습니다.");
      }
    } catch (err) {
      console.error("알림 상태 변경 실패:", err);
      toast({
        title: "알림 상태 변경 실패",
        description: "서버 오류 또는 네트워크 문제입니다.",
        variant: "destructive",
        className: `
          fixed top-6 left-1/2 -translate-x-1/2 z-[9999]
          min-w-[280px] max-w-[380px] w-[80vw]
          rounded-xl shadow-2xl px-4 py-3
          bg-white border-2 border-primary/60
          text-black
        `,
        duration: 1500,
      });
    }
  };

  // 일시정지 시간 설정 함수
  const handlePauseAlert = async (minutes: number) => {
    try {
      if (!userData.MEMBER_ID) throw new Error("사용자 ID가 없습니다.");

      console.log("일시정지 요청 시작 - 현재 alertState:", userData.ALERT_STATE);

      const response = await axios.post(`/api/member/pause-alert`, {
        memberId: userData.MEMBER_ID,
        alertState: 0, // 일시정지 상태
        pauseMinutes: minutes,
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      // 서버 응답 확인 후 상태 업데이트
      if (response.data && response.data.success !== false) {
        console.log("일시정지 API 응답 성공:", response.data);
        
        // 로컬 상태 즉시 업데이트
        setSelectedNotification("emergency");
        setUserData((prev) => {
          if (prev) {
            console.log("로컬 상태 업데이트:", prev.ALERT_STATE, "->", 0);
            return { ...prev, ALERT_STATE: 0 };
          }
          return prev;
        });
        setShowPausePopup(false);

        // 즉시 서버에서 최신 상태 확인 (여러 번 시도)
        console.log("fetchUserInfo 호출 시작");
        fetchUserInfo();
        
        // 추가로 1초 후에도 한 번 더 확인
        setTimeout(() => {
          console.log("1초 후 추가 fetchUserInfo 호출");
          fetchUserInfo();
        }, 1000);

        toast({
          title: "일시정지 설정 완료",
          description:
            minutes >= 60
              ? `${Math.floor(minutes / 60)}시간 동안 알림이 일시정지됩니다.`
              : `${minutes}분 동안 알림이 일시정지됩니다.`,
          className: `
      fixed top-6 left-1/2 -translate-x-1/2 z-[9999]
      min-w-[280px] max-w-[380px] w-[80vw]
      rounded-xl shadow-2xl px-4 py-3
      bg-white border-2 border-primary/60
      text-black
    `,
          duration: 1500,
        });
      } else {
        throw new Error("서버에서 일시정지 설정을 거부했습니다.");
      }
    } catch (error) {
      console.error("일시정지 설정 오류:", error);
      toast({
        title: "일시정지 설정 실패",
        description: "서버 또는 네트워크 오류가 발생했습니다.",
        variant: "destructive",
        className: `
          fixed top-6 left-1/2 -translate-x-1/2 z-[9999]
          min-w-[280px] max-w-[380px] w-[80vw]
          rounded-xl shadow-2xl px-4 py-3
          bg-white border-2 border-primary/60
          text-black
        `,
        duration: 1500,
      });
    }
  };

  // 로그아웃 함수
  const handleSignOut = () => {
    axios
      .post("/api/member/logout", {}, { 
        withCredentials: true,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      .then(() => {
        console.log("로그아웃 성공");
        navigate("/login"); // 로그인 페이지로 이동
      })
      .catch((error) => {
        console.error("로그아웃 실패:", error);
      });
  };

  // =================== UI ===================
  return (
    <div className="h-screen overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5 flex justify-center">
      <div className="w-full max-w-[430px] min-h-[932px] p-3 sm:p-4 space-y-3 sm:space-y-2">
        {/* 프로필/환경설정 */}
        <div className="shadow-soft border-0 bg-card/50 backdrop-blur-sm rounded-xl pt-8 pb-4 px-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-primary/20 flex-shrink-0">
                <AvatarImage src={profileMan1} />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm sm:text-base">
                  {userData.MEMBER_NAME
                    ? userData.MEMBER_NAME.slice(0, 2)
                    : "한경"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 ml-2">
                <h1 className="text-base sm:text-lg font-bold text-foreground truncate">
                  {userData.MEMBER_NAME}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {userData.DEPARTMENT}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 ml-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full shadow-soft h-9 w-9 sm:h-10 sm:w-10"
                  >
                    <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  className="w-40 sm:w-48 bg-white shadow-md rounded-md"
                  align="end"
                  forceMount
                >
                  <DropdownMenuItem
                    onClick={() => navigate("/profile")}
                    className="hover:bg-primary/20 cursor-pointer transition-colors duration-150 rounded-md flex items-center text-sm"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="hover:bg-primary/20 cursor-pointer transition-colors duration-150 rounded-md flex items-center text-sm"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* 알림 설정 카드 */}
        <Card className="shadow-soft border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span>알림 설정</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {NOTIFICATION_TYPES.map(
                ({ key, label, bg, text, icon: Icon }) => {
                  const selected = selectedNotification === key;
                  return (
                    <div
                      key={key}
                      className={`flex flex-col items-center space-y-2 p-3 sm:p-4 rounded-xl cursor-pointer transition-all
                        ${
                          selected
                            ? `${bg} text-white border-2 border-[${bg.replace(
                                "bg-",
                                ""
                              )}]`
                            : `${bg}/10 border border-[${bg.replace(
                                "bg-",
                                ""
                              )}]/20 hover:${bg}/20`
                        }`}
                      onClick={() => {
                        if (key === "emergency") {
                          setSelectedNotification("emergency");
                          setShowPausePopup(true);
                        } else {
                          handleNotificationChange(
                            key as "general" | "emergency"
                          );
                        }
                      }}
                    >
                      <Icon
                        className={`h-6 w-6 sm:h-8 sm:w-8 ${selected ? "text-white" : text}`}
                      />
                      <span
                        className={`text-xs sm:text-sm font-medium ${
                          selected ? "text-white" : text
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </CardContent>
        </Card>

        {/* 이상물체 탐지 알림 내역 */}
        <Card className="shadow-soft border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                <span>이상물체 탐지 알림 내역</span>
              </CardTitle>
              <div className="relative filter-container">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setShowFilterDropdown((prev) => !prev)}
                >
                  <Filter className="w-4 h-4" />
                  {filterStatus === "all" ? "전체" : filterStatus}
                  <ChevronDown className="w-4 h-4" />
                </Button>
                {showFilterDropdown && (
                  <div className="absolute right-0 z-10 mt-2 bg-white border rounded-md shadow-lg w-56">
                    <button
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                        filterStatus === "all" ? "bg-gray-100 font-semibold" : ""
                      }`}
                      onClick={() => {
                        setFilterStatus("all");
                        setShowFilterDropdown(false);
                      }}
                    >
                      전체
                    </button>
                    {STATUS_ENUM.map((status) => (
                      <button
                        key={status}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                          filterStatus === status ? "bg-gray-100 font-semibold" : ""
                        }`}
                        onClick={() => {
                          setFilterStatus(status);
                          setShowFilterDropdown(false);
                        }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 sm:space-y-3 max-h-[265px] overflow-y-auto">
              {filteredEvents.map((ev, index) => {
                const firstItemType = ev.ITEMS?.[0]?.ITEM_TYPE;
                return (
                  <div
                    key={`${ev.EVENT_ID}-${firstItemType}-${index}`}
                    className={[
                      "flex items-center p-3 sm:p-4 rounded-xl border cursor-pointer transition-colors h-16 sm:h-20",
                      selectedEvent?.EVENT_ID === ev.EVENT_ID
                        ? "bg-primary/10 border-primary/30"
                        : "bg-background/50 border-border/50 hover:bg-accent/50",
                    ].join(" ")}
                    onClick={() => handleEventSelect(ev)}
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 w-full h-full">
                      <div className="flex-shrink-0">
                        {firstItemType && <ItemTypeIcon type={firstItemType} />}
                      </div>
                      <div className="flex-1 min-w-0 h-full flex items-center">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                              위치: {ev.LOCATION} - {ev.CCTV_ID}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              일시: {ev.EVENT_DATE} {ev.EVENT_TIME}
                            </p>
                          </div>
                          <div className="flex-shrink-0 ml-2 sm:ml-4">
                            <StatusBadge
                              manage={ev.MANAGE}
                              onClick={() => setStatusPopupTarget(ev)}
                            />
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
          currentStatusIdx={
            statusPopupTarget
              ? STATUS_ENUM.indexOf(statusPopupTarget.MANAGE)
              : 0
          }
          onChange={(num) =>
            statusPopupTarget && handleStatusChange(statusPopupTarget, num)
          }
          onClose={() => setStatusPopupTarget(null)}
        />

        {/* 일시정지 팝업 */}
        {showPausePopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-all p-4">
            <div className="bg-white rounded-xl shadow-2xl border-2 border-primary/60 p-4 sm:p-6 w-full max-w-[320px] sm:min-w-[280px] transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="font-bold text-base sm:text-lg text-black">
                  일시정지 시간 선택
                </div>
                <button
                  className="text-gray-400 hover:text-gray-800 text-xl"
                  onClick={() => setShowPausePopup(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {[
                  { label: "10분", minutes: 10 },
                  { label: "30분", minutes: 30 },
                  { label: "1시간", minutes: 60 },
                  { label: "4시간", minutes: 240 },
                  { label: "24시간", minutes: 1440 },
                ].map(({ label, minutes }) => (
                  <button
                    key={minutes}
                    className="block w-full rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-left border-2 transition-all duration-150 bg-white text-black border-gray-200 hover:bg-primary/10 hover:border-primary/30"
                    onClick={() => handlePauseAlert(minutes)}
                  >
                    <div className="font-medium text-sm sm:text-base">{label}</div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      알림이 일시정지됩니다
                    </div>
                  </button>
                ))}
              </div>
              <button
                className="mt-3 sm:mt-4 w-full text-gray-400 hover:text-primary font-medium rounded-lg transition py-2 text-sm sm:text-base"
                onClick={() => setShowPausePopup(false)}
                style={{ background: "none", border: "none" }}
              >
                닫기
              </button>
            </div>
          </div>
        )}

        {/* CCTV 모니터링 및 상세 ITEMS */}
        <Card
          ref={cctvSectionRef}
          className="shadow-soft border-0 bg-card/50 backdrop-blur-sm"
        >
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Monitor className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span>
                {selectedEvent
                  ? `${
                      selectedEvent.LOCATION
                        ? selectedEvent.LOCATION + " - "
                        : ""
                    }${selectedEvent.CCTV_ID}`
                  : "이상물체 탐지현황"}
              </span>
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {selectedEvent
                ? ""
                : "알림 선택시 이상물체 탐지 이미지를 볼 수 있습니다"}
            </p>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-xl overflow-hidden bg-black/5 border border-border/50">
              {selectedEvent ? (
                <>
                  <img
                    src={
                      selectedEvent.IMG_PATH.startsWith("https")
                        ? selectedEvent.IMG_PATH
                        : selectedEvent.IMG_PATH.startsWith("/")
                        ? `/ai/get_image?path=${encodeURIComponent(
                            selectedEvent.IMG_PATH
                          )}`
                        : `/ai/get_image?path=${encodeURIComponent(
                            selectedEvent.IMG_PATH.slice(2)
                          )}`
                    }
                    alt={`${selectedEvent.CCTV_ID} 이미지`}
                    className="rounded-xl w-full h-48 sm:h-64 object-cover bg-black"
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
                        fontSize: "clamp(16px, 4vw, 20px)",
                        textShadow: "0 0 5px rgba(0,0,0,0.85)",
                        backgroundColor: "transparent",
                        borderRadius: 0,
                      }}
                    >
                      탐지된 물체 :{" "}
                      {selectedEvent.ITEMS.map(
                        (item) =>
                          `${translateItemType(item.ITEM_TYPE)} ${
                            item.ITEM_COUNT
                          }`
                      ).join(", ")}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-48 sm:h-64 flex items-center justify-center bg-muted/20">
                  <p className="text-xs sm:text-sm text-muted-foreground text-center px-4">
                    목록 선택시 이미지 표시 가능합니다
                  </p>
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
