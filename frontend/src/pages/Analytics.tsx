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
    case 'bird': return '조류';
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
  
  // 전역 필터 상태
  const [globalFilter, setGlobalFilter] = useState({
    dateRange: "오늘",
    customDateRange: { start: "", end: "" }
  });
  
  // 유형별 필터 상태 추가
  const [itemTypeFilters, setItemTypeFilters] = useState({
    bird: true,      // 조류
    mammal: true,    // 포유류
    person: true,    // 사람
    vehicle: true    // 차량
  });
  
  // 캘린더 표시 상태
  const [showCalendar, setShowCalendar] = useState(false);
  
  // 필터 드롭다운 표시 상태
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

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

  const dateRangeOptions = useMemo(
    () => ["오늘", "이번 주", "한 달"],
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
      case "이번 주":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 6); // 6일 전부터 오늘까지
        return eventDate >= weekStart && eventDate <= today;
      case "한 달":
        return eventDate.getMonth() === today.getMonth() && eventDate.getFullYear() === today.getFullYear();
      case "오늘":
        return eventDate.toDateString() === today.toDateString();
      case "이번 주":
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

  const getFilteredEvents = () => {
    return events.filter(
      (ev) => getDateRangeFilter(ev, globalFilter.dateRange, globalFilter.customDateRange) &&
              getItemTypeFilter(ev)
    );
  };

  // 유형별 필터 함수 추가
  const getItemTypeFilter = (event: EventItem) => {
    return itemTypeFilters[event.itemType as keyof typeof itemTypeFilters] || false;
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
    } else if (dateRange === '이번 주') {
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
    } else if (dateRange === '한 달') {
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
    } else if (dateRange === '사용자 지정') {
      // 사용자 지정 날짜 범위에 따른 동적 x축 조정
      const { customDateRange } = globalFilter;
      if (customDateRange.start && customDateRange.end) {
        const startDate = new Date(customDateRange.start);
        const endDate = new Date(customDateRange.end);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // 포함된 날짜 수
        
        if (diffDays === 1) {
          // 1일: 시간별로 분할 (오늘과 동일)
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
        } else if (diffDays <= 7) {
          // 7일 이하: 일별로 분할 (이번주와 동일)
          const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
          const dates = [];
          
          for (let i = 0; i < diffDays; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            dates.push(date);
          }
          
          labels = dates.map(date => {
            const dayName = dayNames[date.getDay()];
            const month = date.getMonth() + 1;
            const day = date.getDate();
            return `${month}/${day} ${dayName}`;
          });
          
          dataGenerationLogic = (itemType: string, dayIndex: number) => {
            const targetDate = dates[dayIndex];
            const targetDateStr = targetDate.toISOString().split('T')[0];
            
            return list.filter(e => {
              return e.eventDate === targetDateStr && e.itemType === itemType;
            }).length;
          };
        } else if (diffDays <= 30) {
          // 30일 이하: 4일씩 구분 (한달과 동일)
          const segments = Math.ceil(diffDays / 4);
          labels = [];
          
          for (let i = 0; i < segments; i++) {
            const startDay = i * 4 + 1;
            const endDay = Math.min((i + 1) * 4, diffDays);
            labels.push(`${startDay}일~${endDay}일`);
          }
          
          dataGenerationLogic = (itemType: string, segmentIndex: number) => {
            const startDay = segmentIndex * 4 + 1;
            const endDay = Math.min((segmentIndex + 1) * 4, diffDays);
            
            return list.filter(e => {
              try {
                const eventDate = new Date(e.eventDate);
                const startDateObj = new Date(startDate);
                const daysDiff = Math.floor((eventDate.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
                const adjustedDay = daysDiff + 1; // 1부터 시작
                return adjustedDay >= startDay && adjustedDay <= endDay && e.itemType === itemType;
              } catch (error) {
                console.error('날짜 파싱 오류:', e.eventDate, error);
                return false;
              }
            }).length;
          };
        } else {
          // 30일 초과: 적절한 세그먼트로 분할 (최대 8개 세그먼트)
          const maxSegments = 8;
          const segments = Math.min(maxSegments, Math.ceil(diffDays / 7)); // 주 단위로 분할하되 최대 8개
          const daysPerSegment = Math.ceil(diffDays / segments);
          
          labels = [];
          for (let i = 0; i < segments; i++) {
            const startDay = i * daysPerSegment + 1;
            const endDay = Math.min((i + 1) * daysPerSegment, diffDays);
            labels.push(`${startDay}일~${endDay}일`);
          }
          
          dataGenerationLogic = (itemType: string, segmentIndex: number) => {
            const startDay = segmentIndex * daysPerSegment + 1;
            const endDay = Math.min((segmentIndex + 1) * daysPerSegment, diffDays);
            
            return list.filter(e => {
              try {
                const eventDate = new Date(e.eventDate);
                const startDateObj = new Date(startDate);
                const daysDiff = Math.floor((eventDate.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
                const adjustedDay = daysDiff + 1; // 1부터 시작
                return adjustedDay >= startDay && adjustedDay <= endDay && e.itemType === itemType;
              } catch (error) {
                console.error('날짜 파싱 오류:', e.eventDate, error);
                return false;
              }
            }).length;
          };
        }
      } else {
        // 사용자 지정 날짜가 설정되지 않은 경우 기본값
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
    } else if (dateRange === '이번 주') {
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
    } else if (dateRange === '한 달') {
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
    } else if (dateRange === '사용자 지정') {
      // 사용자 지정 날짜 범위에 따른 동적 x축 조정
      const { customDateRange } = globalFilter;
      if (customDateRange.start && customDateRange.end) {
        const startDate = new Date(customDateRange.start);
        const endDate = new Date(customDateRange.end);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // 포함된 날짜 수
        
        if (diffDays === 1) {
          // 1일: 시간별로 분할 (오늘과 동일)
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
        } else if (diffDays <= 7) {
          // 7일 이하: 일별로 분할 (이번주와 동일)
          const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
          const dates = [];
          
          for (let i = 0; i < diffDays; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            dates.push(date);
          }
          
          labels = dates.map(date => {
            const dayName = dayNames[date.getDay()];
            const month = date.getMonth() + 1;
            const day = date.getDate();
            return `${month}/${day} ${dayName}`;
          });
          
          dataGenerationLogic = (location: string, dayIndex: number) => {
            const targetDate = dates[dayIndex];
            const targetDateStr = targetDate.toISOString().split('T')[0];
            
            return list.filter(e => {
              return e.eventDate === targetDateStr && e.location === location;
            }).length;
          };
        } else if (diffDays <= 30) {
          // 30일 이하: 4일씩 구분 (한달과 동일)
          const segments = Math.ceil(diffDays / 4);
          labels = [];
          
          for (let i = 0; i < segments; i++) {
            const startDay = i * 4 + 1;
            const endDay = Math.min((i + 1) * 4, diffDays);
            labels.push(`${startDay}일~${endDay}일`);
          }
          
          dataGenerationLogic = (location: string, segmentIndex: number) => {
            const startDay = segmentIndex * 4 + 1;
            const endDay = Math.min((segmentIndex + 1) * 4, diffDays);
            
            return list.filter(e => {
              try {
                const eventDate = new Date(e.eventDate);
                const startDateObj = new Date(startDate);
                const daysDiff = Math.floor((eventDate.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
                const adjustedDay = daysDiff + 1; // 1부터 시작
                return adjustedDay >= startDay && adjustedDay <= endDay && e.location === location;
              } catch (error) {
                console.error('날짜 파싱 오류:', e.eventDate, error);
                return false;
              }
            }).length;
          };
        } else {
          // 30일 초과: 적절한 세그먼트로 분할 (최대 8개 세그먼트)
          const maxSegments = 8;
          const segments = Math.min(maxSegments, Math.ceil(diffDays / 7)); // 주 단위로 분할하되 최대 8개
          const daysPerSegment = Math.ceil(diffDays / segments);
          
          labels = [];
          for (let i = 0; i < segments; i++) {
            const startDay = i * daysPerSegment + 1;
            const endDay = Math.min((i + 1) * daysPerSegment, diffDays);
            labels.push(`${startDay}일~${endDay}일`);
          }
          
          dataGenerationLogic = (location: string, segmentIndex: number) => {
            const startDay = segmentIndex * daysPerSegment + 1;
            const endDay = Math.min((segmentIndex + 1) * daysPerSegment, diffDays);
            
            return list.filter(e => {
              try {
                const eventDate = new Date(e.eventDate);
                const startDateObj = new Date(startDate);
                const daysDiff = Math.floor((eventDate.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
                const adjustedDay = daysDiff + 1; // 1부터 시작
                return adjustedDay >= startDay && adjustedDay <= endDay && e.location === location;
              } catch (error) {
                console.error('날짜 파싱 오류:', e.eventDate, error);
                return false;
              }
            }).length;
          };
        }
      } else {
        // 사용자 지정 날짜가 설정되지 않은 경우 기본값
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
    } else if (dateRange === '이번 주') {
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
    } else if (dateRange === '한 달') {
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
    } else if (dateRange === '사용자 지정') {
      // 사용자 지정 날짜 범위에 따른 동적 x축 조정
      const { customDateRange } = globalFilter;
      if (customDateRange.start && customDateRange.end) {
        const startDate = new Date(customDateRange.start);
        const endDate = new Date(customDateRange.end);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // 포함된 날짜 수
        
        if (diffDays === 1) {
          // 1일: 시간별로 분할 (오늘과 동일)
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
        } else if (diffDays <= 7) {
          // 7일 이하: 일별로 분할 (이번주와 동일)
          const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
          const dates = [];
          
          for (let i = 0; i < diffDays; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            dates.push(date);
          }
          
          labels = dates.map(date => {
            const dayName = dayNames[date.getDay()];
            const month = date.getMonth() + 1;
            const day = date.getDate();
            return `${month}/${day} ${dayName}`;
          });
          
          dataGenerationLogic = (location: string, itemType: string, dayIndex: number) => {
            const targetDate = dates[dayIndex];
            const targetDateStr = targetDate.toISOString().split('T')[0];
            
            return list.filter(e => {
              return e.eventDate === targetDateStr && e.location === location && e.itemType === itemType;
            }).length;
          };
        } else if (diffDays <= 30) {
          // 30일 이하: 4일씩 구분 (한달과 동일)
          const segments = Math.ceil(diffDays / 4);
          labels = [];
          
          for (let i = 0; i < segments; i++) {
            const startDay = i * 4 + 1;
            const endDay = Math.min((i + 1) * 4, diffDays);
            labels.push(`${startDay}일~${endDay}일`);
          }
          
          dataGenerationLogic = (location: string, itemType: string, segmentIndex: number) => {
            const startDay = segmentIndex * 4 + 1;
            const endDay = Math.min((segmentIndex + 1) * 4, diffDays);
            
            return list.filter(e => {
              try {
                const eventDate = new Date(e.eventDate);
                const startDateObj = new Date(startDate);
                const daysDiff = Math.floor((eventDate.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
                const adjustedDay = daysDiff + 1; // 1부터 시작
                return adjustedDay >= startDay && adjustedDay <= endDay && e.location === location && e.itemType === itemType;
              } catch (error) {
                console.error('날짜 파싱 오류:', e.eventDate, error);
                return false;
              }
            }).length;
          };
        } else {
          // 30일 초과: 적절한 세그먼트로 분할 (최대 8개 세그먼트)
          const maxSegments = 8;
          const segments = Math.min(maxSegments, Math.ceil(diffDays / 7)); // 주 단위로 분할하되 최대 8개
          const daysPerSegment = Math.ceil(diffDays / segments);
          
          labels = [];
          for (let i = 0; i < segments; i++) {
            const startDay = i * daysPerSegment + 1;
            const endDay = Math.min((i + 1) * daysPerSegment, diffDays);
            labels.push(`${startDay}일~${endDay}일`);
          }
          
          dataGenerationLogic = (location: string, itemType: string, segmentIndex: number) => {
            const startDay = segmentIndex * daysPerSegment + 1;
            const endDay = Math.min((segmentIndex + 1) * daysPerSegment, diffDays);
            
            return list.filter(e => {
              try {
                const eventDate = new Date(e.eventDate);
                const startDateObj = new Date(startDate);
                const daysDiff = Math.floor((eventDate.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
                const adjustedDay = daysDiff + 1; // 1부터 시작
                return adjustedDay >= startDay && adjustedDay <= endDay && e.location === location && e.itemType === itemType;
              } catch (error) {
                console.error('날짜 파싱 오류:', e.eventDate, error);
                return false;
              }
            }).length;
          };
        }
      } else {
        // 사용자 지정 날짜가 설정되지 않은 경우 기본값
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
      {/* 전역 필터 섹션 */}
      <Card className="bg-white rounded-xl shadow-md border border-border">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-16">
              {/* 유형별 필터 */}
              <div className="flex items-center gap-8">
                <span className="text-2xl font-bold">유형별 필터</span>
                <div className="flex gap-10">
                  {Object.entries(itemTypeFilters).map(([key, value]) => {
                    const label = key === 'bird' ? '조류' : 
                                 key === 'mammal' ? '포유류' : 
                                 key === 'person' ? '사람' : 
                                 key === 'vehicle' ? '차량' : key;
                    
                    return (
                      <button
                        key={key}
                        className={`px-3 py-1 rounded-full text-sm border transition ${
                          value
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-800 border-gray-300"
                        }`}
                        onClick={() => setItemTypeFilters(prev => ({
                          ...prev,
                          [key]: !prev[key as keyof typeof itemTypeFilters]
                        }))}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* 필터 설정 */}
              <CardTitle className="text-2xl font-bold"></CardTitle>
            </div>
            
            <div className="flex gap-6 items-center">
              {/* 날짜 범위 필터 */}
              <div className="relative">
              <span className="text-2xl font-bold mr-4">기간별 필터</span>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setShowFilterDropdown(!showFilterDropdown);
                    setShowCalendar(false);
                  }}
                >
                  
                  <Filter className="w-4 h-4" />
                  {globalFilter.dateRange}
                  <ChevronDown className="w-4 h-4" />
                  
                  </Button>
                  
                
                {showFilterDropdown && (
                  <div className="absolute top-full left-0 z-10 mt-2 bg-white border rounded-md shadow-lg w-48">
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-500 mb-1">날짜 범위</div>
                      {dateRangeOptions.map((dateRange) => (
                        <button
                          key={dateRange}
                          className={`w-full px-2 py-1 text-left text-sm hover:bg-gray-100 rounded ${
                            globalFilter.dateRange === dateRange ? "bg-blue-100 text-blue-600" : ""
                          }`}
                          onClick={() => {
                            setGlobalFilter(prev => ({ ...prev, dateRange: dateRange }));
                            setShowFilterDropdown(false);
                          }}
                        >
                          {dateRange}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 캘린더 버튼 */}
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setShowCalendar(!showCalendar);
                  setShowFilterDropdown(false);
                }}
              >
                <Calendar className="w-4 h-4" />
                기간 설정
              </Button>

              {/* 캘린더 입력 필드 */}
              {showCalendar && (
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={globalFilter.customDateRange.start}
                    onChange={(e) => setGlobalFilter(prev => ({
                      ...prev,
                      customDateRange: { ...prev.customDateRange, start: e.target.value }
                    }))}
                    className="px-3 py-2 border rounded-md text-sm"
                    min={dateRange.min}
                    max={dateRange.max}
                  />
                  <span className="text-gray-500">~</span>
                  <input
                    type="date"
                    value={globalFilter.customDateRange.end}
                    onChange={(e) => setGlobalFilter(prev => ({
                      ...prev,
                      customDateRange: { ...prev.customDateRange, end: e.target.value }
                    }))}
                    className="px-3 py-2 border rounded-md text-sm"
                    min={dateRange.min}
                    max={dateRange.max}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (globalFilter.customDateRange.start && globalFilter.customDateRange.end) {
                        setGlobalFilter(prev => ({ ...prev, dateRange: "사용자 지정" }));
                      }
                    }}
                  >
                    적용
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 5개 차트 그리드 - Figma 디자인 기반 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 유형별 탐지 비율 차트 */}
        <Card className="bg-white rounded-xl shadow-md border border-border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>유형별 탐지 비율</CardTitle>
                <div className="text-4xl font-bold text-blue-600">
                  {getFilteredEvents().length}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex">
              <div className="flex-1 h-80">
                <Pie
                  data={getItemTypeRatioChartData(getFilteredEvents())}
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
                  const filteredEvents = getFilteredEvents();
                  const itemTypes = Array.from(new Set(filteredEvents.map(e => e.itemType)));
                  const colors = ['#7987FF', '#E697FF', '#FFA5CB', '#FF6B6B', '#4ECDC4'];
                  const total = filteredEvents.length;
                  
                  const itemTypeData = itemTypes.map(itemType => {
                    const count = filteredEvents.filter(e => e.itemType === itemType).length;
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    return { itemType, count, percentage };
                  });
                  
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
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line
                data={getItemTypeTrendChartData(getFilteredEvents(), globalFilter.dateRange)}
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
                      labels: {
                        font: {
                          size: 16,
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: globalFilter.dateRange,
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
                  {getFilteredEvents().length}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex">
              <div className="flex-1 h-80">
                <Pie
                  data={getCctvRatioChartData(getFilteredEvents())}
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
                  const filteredEvents = getFilteredEvents();
                  const locations = Array.from(new Set(filteredEvents.map(e => e.location)));
                  const colors = ['#7987FF', '#FFA5CB'];
                  const total = filteredEvents.length;
                  
                  const locationData = locations.map(location => {
                    const count = filteredEvents.filter(e => e.location === location).length;
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    return { location, count, percentage };
                  });
                  
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
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line
                data={getCctvTrendChartData(getFilteredEvents(), globalFilter.dateRange)}
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
                      labels: {
                        font: {
                          size: 16,
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: globalFilter.dateRange,
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
                <CardTitle>CCTV/유형별 탐지 빈도 그래프</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar
                data={getDetectionFrequencyChartData(getFilteredEvents(), globalFilter.dateRange)}
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
                      labels: {
                        font: {
                          size: 16,
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: globalFilter.dateRange,
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
