import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Filter, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CctvFeed {
  title: string;
  cctvId: number;
  youtubeUrl: string;
}

interface MergedCCTV {
  title: string;
  subtitle: string;
  youtubeUrl: string;
  location: string;
  lastDetection: string;
  manage: string;
}

export default function CCTVList() {
  const [mergedFeeds, setMergedFeeds] = useState<MergedCCTV[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>("전체");
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const typeMap: Record<string, string> = {
      airplane: "비행기",
      bird: "조류",
      vehicle: "차량",
      mammal: "동물",
      person: "사람",
    };

    axios
      .get("/api/eventlist")
      .then((res) => {
        const events = res.data;

        const latestEvents: Record<number, any> = {};
        events.forEach((event: any) => {
          const timeKey = `${event.eventDate} ${event.eventTime}`;
          if (
            !latestEvents[event.cctvId] ||
            timeKey > `${latestEvents[event.cctvId].eventDate} ${latestEvents[event.cctvId].eventTime}`
          ) {
            latestEvents[event.cctvId] = event;
          }
        });

        axios.get("/mockData.json").then((mockRes) => {
          const feeds: CctvFeed[] = mockRes.data.feeds;

          const merged: MergedCCTV[] = Object.entries(latestEvents)
  .map(([_, event]: any) => {
    const feed = feeds.find((f) => Number(f.cctvId) === Number(event.cctvId));
    if (!feed) return null; // 🔥 mockData에 없는 CCTV는 제외

    return {
      title: feed.title,
      subtitle: `${typeMap[event.itemType] || event.itemType} (${event.itemCount})`,
      youtubeUrl: feed.youtubeUrl,
      location: event.location,
      lastDetection: `${event.eventDate} ${event.eventTime}`,
      manage:
        event.manage === 0
          ? "미처리"
          : event.manage === 1
          ? "처리중"
          : "처리완료",
    };
  })
  .filter(Boolean); // 🔥 null 제거

          setMergedFeeds(merged);
          if (merged.length > 0) setSelectedId(merged[0].title);
        });
      })
      .catch((err) => {
        console.error("❌ CCTV 데이터 로드 실패:", err);
        setError(true);
      });
  }, []);

  const locations = ["전체", ...Array.from(new Set(mergedFeeds.map((cctv) => cctv.location)))];

  const filteredData =
    selectedLocation === "전체"
      ? mergedFeeds
      : mergedFeeds.filter((cctv) => cctv.location === selectedLocation);

  const selectedFeed = mergedFeeds.find((feed) => feed.title === selectedId) || null;

  useEffect(() => {
    if (filteredData.length > 0) {
      setSelectedId(filteredData[0].title);
    } else {
      setSelectedId(null);
    }
  }, [selectedLocation, mergedFeeds]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedId]);

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CCTV 목록 */}
        <Card className="lg:col-span-1 bg-gradient-card border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between relative">
              <CardTitle>CCTV 목록</CardTitle>
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setShowDropdown((prev) => !prev)}
                >
                  <Filter className="w-4 h-4" />
                  {selectedLocation}
                  <ChevronDown className="w-4 h-4" />
                </Button>
                {showDropdown && (
                  <div className="absolute right-0 z-10 mt-2 bg-white border rounded-md shadow-lg w-56">
                    {locations.map((loc) => (
                      <button
                        key={loc}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${selectedLocation === loc ? "bg-gray-100 font-semibold" : ""
                          }`}
                        onClick={() => {
                          setSelectedLocation(loc);
                          setShowDropdown(false);
                        }}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="text-sm text-destructive">데이터 로드 실패</p>
            ) : filteredData.length === 0 ? (
              <p className="text-sm text-muted-foreground">CCTV 정보가 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {filteredData.map((cctv) => (
                  <div
                    key={cctv.title}
                    onClick={() => setSelectedId(cctv.title)}
                    className={`p-4 bg-background rounded-lg border cursor-pointer transition-all ${selectedId === cctv.title ? "ring-2 ring-primary" : ""
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm">{cctv.title}</h3>
                      <Badge
                        className={`text-white text-xs ${cctv.manage === "미처리"
                            ? "bg-red-500"
                            : cctv.manage === "처리중"
                              ? "bg-yellow-400"
                              : "bg-green-500"
                          }`}
                      >
                        {cctv.manage}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>마지막 탐지 :</span>
                        <span>{cctv.lastDetection}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>탐지물체 :</span>
                        <span className="text-foreground font-medium">
                          {cctv.subtitle.replace(" 탐지", "")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 선택된 CCTV 피드 */}
        <Card ref={videoRef} className="lg:col-span-2 w-full bg-gradient-card border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {selectedFeed?.title || "선택된 CCTV"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedFeed?.subtitle || "탐지된 물체 정보 없음"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full" />
                <span className="text-sm text-muted-foreground">Live</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative w-full aspect-video rounded-lg overflow-hidden">
              <img
                src={selectedFeed?.youtubeUrl}
                className="w-full h-full object-cover"
                alt="CCTV 영상"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 기타 CCTV 피드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {mergedFeeds
          .filter((feed) => feed.title !== selectedId)
          .slice(0, 3)
          .map((feed, idx) => (
            <Card key={idx} className="bg-gradient-card border-0 shadow-lg w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{feed.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{feed.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full" />
                    <span className="text-sm text-muted-foreground">Live</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                  <img
                    className="w-full h-full object-cover"
                    src={feed.youtubeUrl}
                    alt={`CCTV 영상 - ${feed.title}`}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
