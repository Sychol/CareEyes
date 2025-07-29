import { useState } from "react";
import { X } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface AlertFilterPanelProps {
  currentFilters: {
    level: string[];
    location: string[];
    status: string[];
    date: string | null;
  };
  onApply: (filters: {
    level: string[];
    location: string[];
    status: string[];
    date: string | null;
  }) => void;
  onClose: () => void;
}

const levelOptions = ["차량", "조류", "동물", "사람"];
const locationOptions = [
  "활주로 동 1 - CCTV 1",
  "활주로 동 1 - CCTV 2",
  "활주로 동 1 - CCTV 3",
  "활주로 서 1 - CCTV 1",
];
const statusOptions = ["처리완료", "처리중", "미처리"];

export function AlertFilterPanel({ currentFilters, onApply, onClose }: AlertFilterPanelProps) {
  const [level, setLevel] = useState<string[]>(currentFilters.level || []);
  const [location, setLocation] = useState<string[]>(currentFilters.location || []);
  const [status, setStatus] = useState<string[]>(currentFilters.status || []);
  const [date, setDate] = useState<Date | null>(
    currentFilters.date ? new Date(currentFilters.date) : null
  );

  const toggleItem = (item: string, list: string[], setter: (list: string[]) => void) => {
    setter(list.includes(item) ? list.filter((v) => v !== item) : [...list, item]);
  };

  const applyFilters = () => {
    onApply({
      level,
      location,
      status,
      date: date ? date.toISOString().split("T")[0] : null,
    });
  };

  const resetFilters = () => {
    setLevel([]);
    setLocation([]);
    setStatus([]);
    setDate(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg w-[600px] p-6 relative space-y-6">
        <button className="absolute top-4 right-4" onClick={onClose}>
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold">필터 선택</h2>

        {/* 탐지 유형 */}
        <div>
          <h3 className="font-medium mb-2">탐지 유형</h3>
          <div className="flex flex-wrap gap-2">
            {levelOptions.map((item) => (
              <button
                key={item}
                onClick={() => toggleItem(item, level, setLevel)}
                className={`px-3 py-1 rounded-full border text-sm ${
                  level.includes(item) ? "bg-blue-500 text-white" : "bg-gray-100"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* 위치 */}
        <div>
          <h3 className="font-medium mb-2">위치</h3>
          <div className="flex flex-wrap gap-2">
            {locationOptions.map((item) => (
              <button
                key={item}
                onClick={() => toggleItem(item, location, setLocation)}
                className={`px-3 py-1 rounded-full border text-sm ${
                  location.includes(item) ? "bg-blue-500 text-white" : "bg-gray-100"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* 상태 */}
        <div>
          <h3 className="font-medium mb-2">상태</h3>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((item) => (
              <button
                key={item}
                onClick={() => toggleItem(item, status, setStatus)}
                className={`px-3 py-1 rounded-full border text-sm ${
                  status.includes(item) ? "bg-blue-500 text-white" : "bg-gray-100"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* 날짜 */}
        <div>
          <h3 className="font-medium mb-2">탐지 날짜</h3>
          <DatePicker
            selected={date}
            onChange={(date: Date | null) => setDate(date)}
            className="border px-3 py-1 rounded text-sm w-full"
            placeholderText="날짜 선택"
            dateFormat="yyyy-MM-dd"
            maxDate={new Date()}
          />
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-2 pt-4">
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm rounded border border-gray-400 text-gray-700"
          >
            초기화
          </button>
          <button
            onClick={applyFilters}
            className="px-4 py-2 text-sm rounded bg-blue-600 text-white"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}