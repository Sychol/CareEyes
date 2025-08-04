import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Plugin,
} from "chart.js";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, ChevronDown, Calendar } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// 개선된 퍼센트 표시를 위한 커스텀 플러그인 - 10% 미만은 표시하지 않음
const improvedPercentagePlugin: Plugin<'pie'> = {
  id: 'improvedPercentagePlugin',
  afterDraw: (chart) => {
    const { ctx, data } = chart;
    const { datasets } = data;
    
    if (datasets.length > 0) {
      const dataset = datasets[0];
      const total = dataset.data.reduce((sum: number, value: number) => sum + value, 0);
      
      // 각 섹션의 누적 각도 계산
      let cumulativeAngle = 0;
      const angles = dataset.data.map((value: number) => {
        const percentage = total > 0 ? ((value / total) * 100) : 0;
        const angle = (percentage / 100) * 2 * Math.PI;
        const startAngle = cumulativeAngle;
        cumulativeAngle += angle;
        return { startAngle, endAngle: cumulativeAngle, percentage };
      });
      
      dataset.data.forEach((value: number, index: number) => {
        const percentage = total > 0 ? ((value / total) * 100) : 0;
        
        // 각 섹션의 중심점 계산
        const meta = chart.getDatasetMeta(0);
        const element = meta.data[index] as any;
        
        if (element && element.getCenterPoint) {
          const { x, y } = element.getCenterPoint();
          
          // 섹션의 중앙 각도 계산
          const angleInfo = angles[index];
          const centerAngle = (angleInfo.startAngle + angleInfo.endAngle) / 2;
          
          // 10% 이상인 값만 차트 내부에 표시
          if (percentage >= 10.0) {
            let fontSize = 24;
            let offsetX = 0;
            let offsetY = 0;
            
            const radius = 15;
            offsetX = Math.cos(centerAngle) * radius;
            offsetY = Math.sin(centerAngle) * radius;
            
            // 하얀색 텍스트로 퍼센트 표시
            ctx.save();
            ctx.fillStyle = 'white';
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${percentage.toFixed(1)}%`, x + offsetX, y + offsetY);
            ctx.restore();
          }
          // 10% 미만인 값들은 차트 내부에 표시하지 않음 (오른쪽 범례에서만 확인 가능)
        }
      });
    }
  }
};

// itemType을 한국어로 변환하는 함수
const translateItemType = (itemType: string): string => {
  switch (itemType) {
    case 'airplane': return '비행기';
    case 'vehicle': return '자동차';
    case 'bird': return '새';
    case 'mammal': return '포유류';
    case 'person': return '사람';
    default: return itemType;
  }
};

const API_URL = "/api/eventlist";

interface EventItem {
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

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
  }>;
}

export default function Analytics() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    itemTypeRatioChart: { dateRange: "오늘", customDateRange: { start: "", end: "" } },
    itemTypeTrendChart: { dateRange: "오늘", customDateRange: { start: "", end: "" } },
    cctvRatioChart: { dateRange: "오늘", customDateRange: { start: "", end: "" } },
    cctvTrendChart: { dateRange: "오늘", customDateRange: { start: "", end: "" } },
    detectionFrequencyChart: { dateRange: "오늘", customDateRange: { start: "", end: "" } },
  });

  // API 데이터에서 가장 빠른 날짜와 가장 늦은 날짜 계산
  const dateRange = useMemo(() => {
    if (!events.length) return { min: "", max: "" };
    
    const dates = events.map(e => new Date(e.eventDate));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    return {
      min: minDate.toISOString().split('T')[0],
      max: maxDate.toISOString().split('T')[0]
    };
  }, [events]);

  const [showDropdowns, setShowDropdowns] = useState({
    itemTypeRatioChart: false,
    itemTypeTrendChart: false,
    cctvRatioChart: false,
    cctvTrendChart: false,
    detectionFrequencyChart: false,
  });



  const fetchData = useCallback(() => {
    axios
      .get<EventItem[]>(API_URL)
      .then((res) => setEvents(res.data || []))
      .catch((error) => {
        console.error("API 에러:", error);
        setEvents([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const manageOptions = useMemo(
    () => ["전체", "미처리", "처리중", "처리완료"],
    []
  );

  const dateRangeOptions = useMemo(
    () => ["오늘", "이번주", "한달"],
    []
  );

  const timeRangeOptions = useMemo(
    () => ["전체", "오전(06:00-12:00)", "오후(12:00-18:00)", "저녁(18:00-24:00)", "새벽(00:00-06:00)"],
    []
  );

  const getManageText = (manage: number) => {
    switch (manage) {
      case 0: return "미처리";
      case 1: return "처리중";
      case 2: return "처리완료";
      default: return "알수없음";
    }
  };

  const getDateRangeFilter = (event: EventItem, dateRange: string, customDateRange: { start: string; end: string }) => {
    if (dateRange === "전체") return true;
    
    const eventDate = new Date(event.eventDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    switch (dateRange) {
      case "오늘":
        return eventDate.toDateString() === today.toDateString();
      case "이번주":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 6); // 6일 전부터 오늘까지
        return eventDate >= weekStart && eventDate <= today;
      case "한달":
        return eventDate.getMonth() === today.getMonth() && eventDate.getFullYear() === today.getFullYear();
      case "오늘":
        return eventDate.toDateString() === today.toDateString();
      case "이번주":
        const weekStartOld = new Date(today);
        weekStartOld.setDate(today.getDate() - today.getDay());
        return eventDate >= weekStartOld;
      case "이번달":
        return eventDate.getMonth() === today.getMonth() && eventDate.getFullYear() === today.getFullYear();
      case "지난주":
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
        const lastWeekEnd = new Date(today);
        lastWeekEnd.setDate(today.getDate() - today.getDay());
        return eventDate >= lastWeekStart && eventDate < lastWeekEnd;
      
      case "사용자 지정":
        if (customDateRange.start && customDateRange.end) {
          const startDate = new Date(customDateRange.start);
          const endDate = new Date(customDateRange.end);
          return eventDate >= startDate && eventDate <= endDate;
        }
        return true;
      default:
        return true;
    }
  };

  const getTimeRangeFilter = (event: EventItem, timeRange: string) => {
    if (timeRange === "전체") return true;
    
    const hour = parseInt(event.eventTime.slice(0, 2));
    
    switch (timeRange) {
      case "오전(06:00-12:00)":
        return hour >= 6 && hour < 12;
      case "오후(12:00-18:00)":
        return hour >= 12 && hour < 18;
      case "저녁(18:00-24:00)":
        return hour >= 18 && hour < 24;
      case "새벽(00:00-06:00)":
        return hour >= 0 && hour < 6;
      default:
        return true;
    }
  };

  const getFilteredEvents = (chartFilter: { dateRange: string; customDateRange: { start: string; end: string } }) => {
    return events.filter(
      (ev) => getDateRangeFilter(ev, chartFilter.dateRange, chartFilter.customDateRange)
    );
  };

  // 유형별 탐지 비율 차트 데이터
  const getItemTypeRatioChartData = (list: EventItem[]): ChartData => {
    if (!list.length)
      return {
        labels: [],
        datasets: [],
      };
    
    const itemTypes = Array.from(new Set(list.map(e => e.itemType)));
    // 차트 색상 변경 위치 - 비행기, 자동차, 새, 포유류, 사람의 색상을 여기서 변경
    const colors = ['#7987FF', '#E697FF', '#FFA5CB', '#FF6B6B', '#4ECDC4'];
    
    // 총 개수 계산
    const total = list.length;
    
    // itemType별 퍼센트 계산 및 정렬
    const itemTypeData = itemTypes.map(itemType => {
      const count = list.filter(e => e.itemType === itemType).length;
      const percentage = total > 0 ? (count / total) * 100 : 0;
      return { itemType, count, percentage };
    });
    
    // 퍼센트 높은 순으로 내림차순 정렬
    itemTypeData.sort((a, b) => b.percentage - a.percentage);
    
    return {
      labels: itemTypeData.map(item => translateItemType(item.itemType)),
      datasets: [{
        label: '유형별 비율',
        data: itemTypeData.map(item => item.percentage),
        backgroundColor: itemTypeData.map((_, index) => colors[index % colors.length]),
        borderColor: itemTypeData.map((_, index) => colors[index % colors.length]),
        borderWidth: 1,
      }],
    };
  };

  // 유형별/시간별 탐지 추세 차트 데이터 (필터에 따라 x축 동적 변경)
  const getItemTypeTrendChartData = (list: EventItem[], dateRange: string): ChartData => {
    if (!list.length)
      return {
        labels: [],
        datasets: [],
      };
    
    const itemTypes = Array.from(new Set(list.map(e => e.itemType)));
    const colors = ['#7987FF', '#E697FF', '#FFA5CB', '#FF6B6B', '#4ECDC4'];
    
    // 필터에 따라 x축 라벨과 데이터 생성 로직 결정
    let labels: string[] = [];
    let dataGenerationLogic: (itemType: string, index: number) => number;
    
    if (dateRange === '오늘') {
      // Today: 00시 ~ 24시 (현재 그대로)
      labels = ['00시', '04시', '08시', '12시', '16시', '20시', '24시'];
      dataGenerationLogic = (itemType: string, timeIndex: number) => {
        const startHour = timeIndex * 4;
        const endHour = timeIndex === 6 ? 24 : (timeIndex + 1) * 4;
        
        return list.filter(e => {
          try {
            const timeParts = e.eventTime.split(':');
            const hour = parseInt(timeParts[0]);
            const adjustedHour = hour === 0 && timeIndex === 6 ? 24 : hour;
            return adjustedHour >= startHour && adjustedHour < endHour && e.itemType === itemType;
          } catch (error) {
            console.error('eventTime 파싱 오류:', e.eventTime, error);
            return false;
          }
        }).length;
      };
    } else if (dateRange === '이번주') {
      // This Week: 6일전부터 오늘까지 (오늘이 마지막)
      const today = new Date();
      const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
      
      // 6일전부터 오늘까지의 날짜들 생성
      const weekDates = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        weekDates.push(date);
      }
      
      labels = weekDates.map(date => {
        const dayName = dayNames[date.getDay()];
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}/${day} ${dayName}`;
      });
      
      dataGenerationLogic = (itemType: string, dayIndex: number) => {
        const targetDate = weekDates[dayIndex];
        const targetDateStr = targetDate.toISOString().split('T')[0];
        
        return list.filter(e => {
          return e.eventDate === targetDateStr && e.itemType === itemType;
        }).length;
      };
    } else if (dateRange === '한달') {
      // This Month: 이번달 일수를 4개씩 구분
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // 4개씩 구분하여 라벨 생성
      const segments = Math.ceil(daysInMonth / 4);
      labels = [];
      
      for (let i = 0; i < segments; i++) {
        const startDay = i * 4 + 1;
        const endDay = Math.min((i + 1) * 4, daysInMonth);
        labels.push(`${startDay}일~${endDay}일`);
      }
      
      dataGenerationLogic = (itemType: string, segmentIndex: number) => {
        const startDay = segmentIndex * 4 + 1;
        const endDay = Math.min((segmentIndex + 1) * 4, daysInMonth);
        
        return list.filter(e => {
          try {
            const eventDate = new Date(e.eventDate);
            const eventDay = eventDate.getDate();
            return eventDay >= startDay && eventDay <= endDay && e.itemType === itemType;
          } catch (error) {
            console.error('날짜 파싱 오류:', e.eventDate, error);
            return false;
          }
        }).length;
      };
    } else {
      // 기본값: Today와 동일
      labels = ['00시', '04시', '08시', '12시', '16시', '20시', '24시'];
      dataGenerationLogic = (itemType: string, timeIndex: number) => {
        const startHour = timeIndex * 4;
        const endHour = timeIndex === 6 ? 24 : (timeIndex + 1) * 4;
        
        return list.filter(e => {
          try {
            const timeParts = e.eventTime.split(':');
            const hour = parseInt(timeParts[0]);
            const adjustedHour = hour === 0 && timeIndex === 6 ? 24 : hour;
            return adjustedHour >= startHour && adjustedHour < endHour && e.itemType === itemType;
          } catch (error) {
            console.error('eventTime 파싱 오류:', e.eventTime, error);
            return false;
          }
        }).length;
      };
    }
    
    const datasets = itemTypes.map((itemType, index) => {
      const data = labels.map((_, labelIndex) => {
        return dataGenerationLogic(itemType, labelIndex);
      });
      
      return {
        label: translateItemType(itemType),
        data,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '20',
        fill: true,
        tension: 0.4,
      };
    });
    
    return {
      labels,
      datasets,
    };
  };

  // CCTV별 탐지 비율 차트 데이터
  const getCctvRatioChartData = (list: EventItem[]): ChartData => {
    if (!list.length)
      return {
        labels: [],
        datasets: [],
      };
    
    const locations = Array.from(new Set(list.map(e => e.location)));
    const colors = ['#7987FF', '#FFA5CB'];
    
    // 총 개수 계산
    const total = list.length;
    
    // location별 퍼센트 계산 및 정렬
    const locationData = locations.map(location => {
      const count = list.filter(e => e.location === location).length;
      const percentage = total > 0 ? (count / total) * 100 : 0;
      return { location, count, percentage };
    });
    
    // 퍼센트 높은 순으로 내림차순 정렬
    locationData.sort((a, b) => b.percentage - a.percentage);
    
    return {
      labels: locationData.map(item => item.location),
      datasets: [{
        label: '위치별 비율',
        data: locationData.map(item => item.percentage),
        backgroundColor: locationData.map((_, index) => colors[index % colors.length]),
        borderColor: locationData.map((_, index) => colors[index % colors.length]),
        borderWidth: 1,
      }],
    };
  };

  // 위치별/시간별 탐지 추세 차트 데이터 (필터에 따라 x축 동적 변경)
  const getCctvTrendChartData = (list: EventItem[], dateRange: string): ChartData => {
    if (!list.length)
      return {
        labels: [],
        datasets: [],
      };
    
    const locations = Array.from(new Set(list.map(e => e.location)));
    const colors = ['#7987FF', '#E697FF', '#FFA5CB', '#FF6B6B', '#4ECDC4'];
    
    // 필터에 따라 x축 라벨과 데이터 생성 로직 결정
    let labels: string[] = [];
    let dataGenerationLogic: (location: string, index: number) => number;
    
    if (dateRange === '오늘') {
      // Today: 00시 ~ 24시 (현재 그대로)
      labels = ['00시', '04시', '08시', '12시', '16시', '20시', '24시'];
      dataGenerationLogic = (location: string, timeIndex: number) => {
        const startHour = timeIndex * 4;
        const endHour = timeIndex === 6 ? 24 : (timeIndex + 1) * 4;
        
        return list.filter(e => {
          try {
            const timeParts = e.eventTime.split(':');
            const hour = parseInt(timeParts[0]);
            const adjustedHour = hour === 0 && timeIndex === 6 ? 24 : hour;
            return adjustedHour >= startHour && adjustedHour < endHour && e.location === location;
          } catch (error) {
            console.error('eventTime 파싱 오류:', e.eventTime, error);
            return false;
          }
        }).length;
      };
    } else if (dateRange === '이번주') {
      // This Week: 6일전부터 오늘까지 (오늘이 마지막)
      const today = new Date();
      const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
      
      // 6일전부터 오늘까지의 날짜들 생성
      const weekDates = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        weekDates.push(date);
      }
      
      labels = weekDates.map(date => {
        const dayName = dayNames[date.getDay()];
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}/${day} ${dayName}`;
      });
      
      dataGenerationLogic = (location: string, dayIndex: number) => {
        const targetDate = weekDates[dayIndex];
        const targetDateStr = targetDate.toISOString().split('T')[0];
        
        return list.filter(e => {
          return e.eventDate === targetDateStr && e.location === location;
        }).length;
      };
    } else if (dateRange === '한달') {
      // This Month: 이번달 일수를 4개씩 구분
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // 4개씩 구분하여 라벨 생성
      const segments = Math.ceil(daysInMonth / 4);
      labels = [];
      
      for (let i = 0; i < segments; i++) {
        const startDay = i * 4 + 1;
        const endDay = Math.min((i + 1) * 4, daysInMonth);
        labels.push(`${startDay}일~${endDay}일`);
      }
      
      dataGenerationLogic = (location: string, segmentIndex: number) => {
        const startDay = segmentIndex * 4 + 1;
        const endDay = Math.min((segmentIndex + 1) * 4, daysInMonth);
        
        return list.filter(e => {
          try {
            const eventDate = new Date(e.eventDate);
            const eventDay = eventDate.getDate();
            return eventDay >= startDay && eventDay <= endDay && e.location === location;
          } catch (error) {
            console.error('날짜 파싱 오류:', e.eventDate, error);
            return false;
          }
        }).length;
      };
    } else {
      // 기본값: Today와 동일
      labels = ['00시', '04시', '08시', '12시', '16시', '20시', '24시'];
      dataGenerationLogic = (location: string, timeIndex: number) => {
        const startHour = timeIndex * 4;
        const endHour = timeIndex === 6 ? 24 : (timeIndex + 1) * 4;
        
        return list.filter(e => {
          try {
            const timeParts = e.eventTime.split(':');
            const hour = parseInt(timeParts[0]);
            const adjustedHour = hour === 0 && timeIndex === 6 ? 24 : hour;
            return adjustedHour >= startHour && adjustedHour < endHour && e.location === location;
          } catch (error) {
            console.error('eventTime 파싱 오류:', e.eventTime, error);
            return false;
          }
        }).length;
      };
    }
    
    const datasets = locations.map((location, index) => {
      const data = labels.map((_, labelIndex) => {
        return dataGenerationLogic(location, labelIndex);
      });
      
      return {
        label: location,
        data,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '20',
        fill: true,
        tension: 0.4,
      };
    });
    
    return {
      labels,
      datasets,
    };
  };

  // CCTV/유형별 탐지 빈도 차트 데이터
  const getDetectionFrequencyChartData = (list: EventItem[], dateRange: string): ChartData => {
    if (!list.length)
      return {
        labels: [],
        datasets: [],
      };
    
    // API에서 받아온 실제 location들 사용
    const locations = Array.from(new Set(list.map(e => e.location)));
    const itemTypes = Array.from(new Set(list.map(e => e.itemType)));
    const colors = ['#7987FF', '#E697FF', '#FFA5CB', '#FF6B6B', '#4ECDC4'];
    
    // 필터에 따라 x축 라벨과 데이터 생성 로직 결정
    let labels: string[] = [];
    let dataGenerationLogic: (location: string, itemType: string, index: number) => number;
    
    if (dateRange === '오늘') {
      // Today: 00시 ~ 24시 (현재 그대로)
      labels = ['00시', '04시', '08시', '12시', '16시', '20시', '24시'];
      dataGenerationLogic = (location: string, itemType: string, timeIndex: number) => {
        const startHour = timeIndex * 4;
        const endHour = timeIndex === 6 ? 24 : (timeIndex + 1) * 4;
        
        return list.filter(e => {
          try {
            const timeParts = e.eventTime.split(':');
            const hour = parseInt(timeParts[0]);
            const adjustedHour = hour === 0 && timeIndex === 6 ? 24 : hour;
            return adjustedHour >= startHour && adjustedHour < endHour && e.location === location && e.itemType === itemType;
          } catch (error) {
            console.error('eventTime 파싱 오류:', e.eventTime, error);
            return false;
          }
        }).length;
      };
    } else if (dateRange === '이번주') {
      // This Week: 6일전부터 오늘까지 (오늘이 마지막)
      const today = new Date();
      const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
      
      // 6일전부터 오늘까지의 날짜들 생성
      const weekDates = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        weekDates.push(date);
      }
      
      labels = weekDates.map(date => {
        const dayName = dayNames[date.getDay()];
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}/${day} ${dayName}`;
      });
      
      dataGenerationLogic = (location: string, itemType: string, dayIndex: number) => {
        const targetDate = weekDates[dayIndex];
        const targetDateStr = targetDate.toISOString().split('T')[0];
        
        return list.filter(e => {
          return e.eventDate === targetDateStr && e.location === location && e.itemType === itemType;
        }).length;
      };
    } else if (dateRange === '한달') {
      // This Month: 이번달 일수를 4개씩 구분
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // 4개씩 구분하여 라벨 생성
      const segments = Math.ceil(daysInMonth / 4);
      labels = [];
      
      for (let i = 0; i < segments; i++) {
        const startDay = i * 4 + 1;
        const endDay = Math.min((i + 1) * 4, daysInMonth);
        labels.push(`${startDay}일~${endDay}일`);
      }
      
      dataGenerationLogic = (location: string, itemType: string, segmentIndex: number) => {
        const startDay = segmentIndex * 4 + 1;
        const endDay = Math.min((segmentIndex + 1) * 4, daysInMonth);
        
        return list.filter(e => {
          try {
            const eventDate = new Date(e.eventDate);
            const eventDay = eventDate.getDate();
            return eventDay >= startDay && eventDay <= endDay && e.location === location && e.itemType === itemType;
          } catch (error) {
            console.error('날짜 파싱 오류:', e.eventDate, error);
            return false;
          }
        }).length;
      };
    } else {
      // 기본값: Today와 동일
      labels = ['00시', '04시', '08시', '12시', '16시', '20시', '24시'];
      dataGenerationLogic = (location: string, itemType: string, timeIndex: number) => {
        const startHour = timeIndex * 4;
        const endHour = timeIndex === 6 ? 24 : (timeIndex + 1) * 4;
        
        return list.filter(e => {
          try {
            const timeParts = e.eventTime.split(':');
            const hour = parseInt(timeParts[0]);
            const adjustedHour = hour === 0 && timeIndex === 6 ? 24 : hour;
            return adjustedHour >= startHour && adjustedHour < endHour && e.location === location && e.itemType === itemType;
          } catch (error) {
            console.error('eventTime 파싱 오류:', e.eventTime, error);
            return false;
          }
        }).length;
      };
    }
    
    // Calculate total count for each itemType across all locations for sorting
    const itemTypeTotals = itemTypes.map(itemType => {
      const totalCount = list.filter(e => e.itemType === itemType).length;
      return { itemType, totalCount };
    });
    
    // Sort itemTypes by their total count in descending order
    itemTypeTotals.sort((a, b) => b.totalCount - a.totalCount);
    
    // Use the sorted itemTypes to create datasets
    const sortedItemTypes = itemTypeTotals.map(item => item.itemType);
    
    // 각 itemType별로 데이터셋 생성 (필터에 따른 라벨 순서로)
    const datasets = sortedItemTypes.map((itemType, index) => {
      const data = labels.map((_, labelIndex) => {
        return dataGenerationLogic(locations[0], itemType, labelIndex); // location은 고정하고 itemType별로 데이터 생성
      });
      
      return {
        label: translateItemType(itemType),
        data,
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length],
        borderWidth: 1,
      };
    });
    
    return {
      labels, // 필터에 따른 라벨을 X축에 표시
      datasets,
    };
  };



  if (loading)
    return (
      <div className="p-10 text-center text-gray-500 text-lg">로딩 중...</div>
    );

  return (
    <div className="p-6 grid grid-cols-1 gap-6 overflow-y-auto" style={{ height: "calc(100vh - 100px)" }}>
      {/* 5개 차트 그리드 - Figma 디자인 기반 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 유형별 탐지 비율 차트 */}
        <Card className="bg-white rounded-xl shadow-md border border-border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>유형별 탐지 비율</CardTitle>
                <div className="text-4xl font-bold text-blue-600">
                  {getFilteredEvents(filters.itemTypeRatioChart).length}
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setShowDropdowns((prev) => ({ ...prev, itemTypeRatioChart: !prev.itemTypeRatioChart }))}
                  >
                    <Filter className="w-4 h-4" />
                    {filters.itemTypeRatioChart.dateRange}
                    <ChevronDown className="w-4 h-4" />
                  </Button>

                  {showDropdowns.itemTypeRatioChart && (
                    <div className="absolute right-0 z-10 mt-2 bg-white border rounded-md shadow-lg w-48 max-h-64 overflow-y-auto">
                      <div className="p-2">
                        <div className="text-xs font-medium text-gray-500 mb-1">날짜 범위</div>
                        {dateRangeOptions.map((dateRange) => (
                          <button
                            key={dateRange}
                            className={`w-full px-2 py-1 text-left text-sm hover:bg-gray-100 rounded ${
                              filters.itemTypeRatioChart.dateRange === dateRange ? "bg-blue-100 text-blue-600" : ""
                            }`}
                            onClick={() => {
                              setFilters((f) => ({
                                ...f,
                                itemTypeRatioChart: { ...f.itemTypeRatioChart, dateRange: dateRange }
                              }));
                              setShowDropdowns((prev) => ({ ...prev, itemTypeRatioChart: false }));
                            }}
                          >
                            {dateRange}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex">
              <div className="flex-1 h-80">
                <Pie
                  data={getItemTypeRatioChartData(getFilteredEvents(filters.itemTypeRatioChart))}
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `${context.label}: ${context.parsed.toFixed(2)}%`;
                          }
                        }
                      }
                    }
                  }}
                  plugins={[improvedPercentagePlugin]}
                />
              </div>
                                             <div className="w-32 ml-4">
                  {(() => {
                    const filteredEvents = getFilteredEvents(filters.itemTypeRatioChart);
                    const itemTypes = Array.from(new Set(filteredEvents.map(e => e.itemType)));
                    // 범례 색상 변경 위치 - 비행기, 자동차, 새, 포유류, 사람의 색상을 여기서 변경
                    const colors = ['#7987FF', '#E697FF', '#FFA5CB', '#FF6B6B', '#4ECDC4'];
                    const total = filteredEvents.length;
                    
                    // itemType별 퍼센트 계산 및 정렬 (차트와 동일한 순서)
                    const itemTypeData = itemTypes.map(itemType => {
                      const count = filteredEvents.filter(e => e.itemType === itemType).length;
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      return { itemType, count, percentage };
                    });
                    
                    // 퍼센트 높은 순으로 내림차순 정렬 (차트와 동일한 순서)
                    itemTypeData.sort((a, b) => b.percentage - a.percentage);
                    
                    return itemTypeData.map((item, index) => {
                      return (
                        <div key={item.itemType} className="flex items-center mb-2">
                          <div 
                            className="w-4 h-4 rounded-full mr-2" 
                            style={{ backgroundColor: colors[index % colors.length] }}
                          />
                          <div className="text-base">
                            <div className="font-medium">{translateItemType(item.itemType)}</div>
                            <div className="text-gray-500">{item.percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
            </div>
          </CardContent>
        </Card>

        {/* 유형별/시간별 탐지 추세 차트 */}
        <Card className="bg-white rounded-xl shadow-md border border-border lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>유형별/시간별 탐지 추세 그래프</CardTitle>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setShowDropdowns((prev) => ({ ...prev, itemTypeTrendChart: !prev.itemTypeTrendChart }))}
                  >
                    <Filter className="w-4 h-4" />
                    {filters.itemTypeTrendChart.dateRange}
                    <ChevronDown className="w-4 h-4" />
                  </Button>

                  {showDropdowns.itemTypeTrendChart && (
                    <div className="absolute right-0 z-10 mt-2 bg-white border rounded-md shadow-lg w-48 max-h-64 overflow-y-auto">
                      <div className="p-2">
                        <div className="text-xs font-medium text-gray-500 mb-1">날짜 범위</div>
                        {dateRangeOptions.map((dateRange) => (
                          <button
                            key={dateRange}
                            className={`w-full px-2 py-1 text-left text-sm hover:bg-gray-100 rounded ${
                              filters.itemTypeTrendChart.dateRange === dateRange ? "bg-blue-100 text-blue-600" : ""
                            }`}
                            onClick={() => {
                              setFilters((f) => ({
                                ...f,
                                itemTypeTrendChart: { ...f.itemTypeTrendChart, dateRange: dateRange }
                              }));
                              setShowDropdowns((prev) => ({ ...prev, itemTypeTrendChart: false }));
                            }}
                          >
                            {dateRange}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line
                data={getItemTypeTrendChartData(getFilteredEvents(filters.itemTypeTrendChart), filters.itemTypeTrendChart.dateRange)}
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
                      labels: {
                        font: {
                          size: 16, // 범례 텍스트 크기 증가
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: filters.itemTypeTrendChart.dateRange,
                        font: {
                          size: 12,
                          weight: 'bold'
                        }
                      }
                    },
                    y: {
                      title: {
                        display: true,
                        text: '탐지 건수',
                        font: {
                          size: 12,
                          weight: 'bold'
                        }
                      },
                      beginAtZero: true,
                      // 데이터에 따라 최대값 자동 조정
                      ticks: {
                        callback: function(value) {
                          return value;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* CCTV별 탐지 비율 차트 */}
        <Card className="bg-white rounded-xl shadow-md border border-border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>CCTV별 탐지 비율</CardTitle>
                <div className="text-4xl font-bold text-blue-600">
                  {getFilteredEvents(filters.cctvRatioChart).length}
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setShowDropdowns((prev) => ({ ...prev, cctvRatioChart: !prev.cctvRatioChart }))}
                  >
                    <Filter className="w-4 h-4" />
                    {filters.cctvRatioChart.dateRange}
                    <ChevronDown className="w-4 h-4" />
                  </Button>

                  {showDropdowns.cctvRatioChart && (
                    <div className="absolute right-0 z-10 mt-2 bg-white border rounded-md shadow-lg w-48 max-h-64 overflow-y-auto">
                      <div className="p-2">
                        <div className="text-xs font-medium text-gray-500 mb-1">날짜 범위</div>
                        {dateRangeOptions.map((dateRange) => (
                          <button
                            key={dateRange}
                            className={`w-full px-2 py-1 text-left text-sm hover:bg-gray-100 rounded ${
                              filters.cctvRatioChart.dateRange === dateRange ? "bg-blue-100 text-blue-600" : ""
                            }`}
                            onClick={() => {
                              setFilters((f) => ({
                                ...f,
                                cctvRatioChart: { ...f.cctvRatioChart, dateRange: dateRange }
                              }));
                              setShowDropdowns((prev) => ({ ...prev, cctvRatioChart: false }));
                            }}
                          >
                            {dateRange}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex">
              <div className="flex-1 h-80">
                <Pie
                  data={getCctvRatioChartData(getFilteredEvents(filters.cctvRatioChart))}
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `${context.label}: ${context.parsed.toFixed(2)}%`;
                          }
                        }
                      }
                    }
                  }}
                  plugins={[improvedPercentagePlugin]}
                />
              </div>
              <div className="w-32 ml-4">
                {(() => {
                  const filteredEvents = getFilteredEvents(filters.cctvRatioChart);
                  const locations = Array.from(new Set(filteredEvents.map(e => e.location)));
                  const colors = ['#7987FF', '#FFA5CB'];
                  const total = filteredEvents.length;
                  
                  // location별 퍼센트 계산 및 정렬 (차트와 동일한 순서)
                  const locationData = locations.map(location => {
                    const count = filteredEvents.filter(e => e.location === location).length;
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    return { location, count, percentage };
                  });
                  
                  // 퍼센트 높은 순으로 내림차순 정렬 (차트와 동일한 순서)
                  locationData.sort((a, b) => b.percentage - a.percentage);
                  
                  return locationData.map((item, index) => {
                    return (
                      <div key={item.location} className="flex items-center mb-2">
                        <div 
                          className="w-4 h-4 rounded-full mr-2" 
                          style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <div className="text-base">
                          <div className="font-medium">{item.location}</div>
                          <div className="text-gray-500">{item.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CCTV별/시간별 탐지 추세 차트 */}
        <Card className="bg-white rounded-xl shadow-md border border-border lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>CCTV별/시간별 탐지 추세</CardTitle>
                {/* <div className="text-2xl font-bold text-blue-600">
                  {getFilteredEvents(filters.cctvTrendChart).length}
                </div> */}
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setShowDropdowns((prev) => ({ ...prev, cctvTrendChart: !prev.cctvTrendChart }))}
                  >
                    <Filter className="w-4 h-4" />
                    {filters.cctvTrendChart.dateRange}
                    <ChevronDown className="w-4 h-4" />
                  </Button>

                  {showDropdowns.cctvTrendChart && (
                    <div className="absolute right-0 z-10 mt-2 bg-white border rounded-md shadow-lg w-48 max-h-64 overflow-y-auto">
                      <div className="p-2">
                        <div className="text-xs font-medium text-gray-500 mb-1">날짜 범위</div>
                        {dateRangeOptions.map((dateRange) => (
                          <button
                            key={dateRange}
                            className={`w-full px-2 py-1 text-left text-sm hover:bg-gray-100 rounded ${
                              filters.cctvTrendChart.dateRange === dateRange ? "bg-blue-100 text-blue-600" : ""
                            }`}
                            onClick={() => {
                              setFilters((f) => ({
                                ...f,
                                cctvTrendChart: { ...f.cctvTrendChart, dateRange: dateRange }
                              }));
                              setShowDropdowns((prev) => ({ ...prev, cctvTrendChart: false }));
                            }}
                          >
                            {dateRange}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line
                data={getCctvTrendChartData(getFilteredEvents(filters.cctvTrendChart), filters.cctvTrendChart.dateRange)}
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
                      labels: {
                        font: {
                          size: 16, // 범례 텍스트 크기 증가
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: filters.cctvTrendChart.dateRange,
                        font: {
                          size: 12,
                          weight: 'bold'
                        }
                      }
                    },
                    y: {
                      title: {
                        display: true,
                        text: '탐지 건수',
                        font: {
                          size: 12,
                          weight: 'bold'
                        }
                      },
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* CCTV/유형별 탐지 빈도 차트 */}
        <Card className="bg-white rounded-xl shadow-md border border-border lg:col-span-3">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                {/* 탐지 객체 폰트 크기 변경 위치 - 유형별 탐지 비율과 동일하게 설정 */}
                <CardTitle>CCTV/유형별 탐지 빈도 그래프</CardTitle>
                {/* <div className="text-4xl font-bold text-blue-600">
                  {getFilteredEvents(filters.detectionFrequencyChart).length}
                </div> */}
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setShowDropdowns((prev) => ({ ...prev, detectionFrequencyChart: !prev.detectionFrequencyChart }))}
                  >
                    <Filter className="w-4 h-4" />
                    {filters.detectionFrequencyChart.dateRange}
                    <ChevronDown className="w-4 h-4" />
                  </Button>

                  {showDropdowns.detectionFrequencyChart && (
                    <div className="absolute right-0 z-10 mt-2 bg-white border rounded-md shadow-lg w-48 max-h-64 overflow-y-auto">
                      <div className="p-2">
                        <div className="text-xs font-medium text-gray-500 mb-1">날짜 범위</div>
                        {dateRangeOptions.map((dateRange) => (
                          <button
                            key={dateRange}
                            className={`w-full px-2 py-1 text-left text-sm hover:bg-gray-100 rounded ${
                              filters.detectionFrequencyChart.dateRange === dateRange ? "bg-blue-100 text-blue-600" : ""
                            }`}
                            onClick={() => {
                              setFilters((f) => ({
                                ...f,
                                detectionFrequencyChart: { ...f.detectionFrequencyChart, dateRange: dateRange }
                              }));
                              setShowDropdowns((prev) => ({ ...prev, detectionFrequencyChart: false }));
                            }}
                          >
                            {dateRange}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar
                data={getDetectionFrequencyChartData(getFilteredEvents(filters.detectionFrequencyChart), filters.detectionFrequencyChart.dateRange)}
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
                      labels: {
                        font: {
                          size: 16, // 범례 텍스트 크기 증가
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: filters.detectionFrequencyChart.dateRange,
                        font: {
                          size: 12,
                          weight: 'bold'
                        }
                      }
                    },
                    y: {
                      title: {
                        display: true,
                        text: '탐지 건수',
                        font: {
                          size: 12,
                          weight: 'bold'
                        }
                      },
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
