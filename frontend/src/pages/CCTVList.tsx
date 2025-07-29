import { useEffect, useState } from "react";
import axios from "axios";
import { Filter, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import runwayView from "@/assets/runway-view.jpg";

interface CctvInfo {
  id: string;
  location: string;
  lastDetection: string;
  detectedObject: string;
  manage: string;
}

interface DetectionBox {
  top: string;
  left: string;
  width: string;
  height: string;
  label: string;
}

interface CctvFeed {
  title: string;
  subtitle: string;
  image?: string;
  youtubeUrl?: string;
  detections?: DetectionBox[];
}

export default function CCTVList() {
  const [cctvData, setCctvData] = useState<CctvInfo[]>([]);
  const [cctvFeeds, setCctvFeeds] = useState<CctvFeed[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>("전체");
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    axios
      .get("/mockData.json")
      .then((res) => {
        const { list, feeds } = res.data;
        setCctvData(list);
        setCctvFeeds(feeds);
        if (list.length > 0) {
          setSelectedId(list[0].id);
        }
      })
      .catch((err) => {
        console.error("❌ CCTV 데이터 로드 실패:", err);
        setError(true);
      });
  }, []);
  // 변경함! 07/29
  useEffect(() => {
  if (filteredData.length > 0) {
    setSelectedId(filteredData[0].id); // 필터에 해당하는 첫 CCTV 자동 선택
  } else {
    setSelectedId(null);
  }
}, [selectedLocation, cctvData]); // 의존성: 필터 변경 시 실행

  const locations = ["전체", ...Array.from(new Set(cctvData.map((cctv) => cctv.location)))];
  const filteredData = selectedLocation === "전체"
    ? cctvData
    : cctvData.filter((cctv) => cctv.location === selectedLocation);
  const selectedFeed = cctvFeeds.find((feed) => feed.title === selectedId) || null;

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
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                          selectedLocation === loc ? "bg-gray-100 font-semibold" : ""
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
                    key={cctv.id}
                    onClick={() => setSelectedId(cctv.id)}
                    className={`p-4 bg-background rounded-lg border cursor-pointer transition-all ${
                      selectedId === cctv.id ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm">{cctv.id}</h3>
                      <Badge
                        className={`text-white text-xs ${
                          cctv.manage === "미처리" ? "bg-destructive" : "bg-success"
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
                          {cctv.detectedObject}
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
        <Card className="lg:col-span-2 bg-gradient-card border-0 shadow-lg">
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
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-sm text-muted-foreground">Live</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-lg overflow-hidden">
              {selectedFeed?.youtubeUrl ? (
                <iframe
                  className="w-full h-96 rounded-lg"
                  src={
                    selectedFeed.youtubeUrl.replace("watch?v=", "embed/") +
                    "?autoplay=1&mute=1"
                  }
                  title="CCTV 영상"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              ) : (
                <img
                  src={selectedFeed?.image || runwayView}
                  alt={selectedFeed?.title || "Main CCTV Feed"}
                  className="w-full h-96 object-cover"
                />
              )}

              {!selectedFeed?.youtubeUrl &&
                selectedFeed?.detections?.map((box, idx) => (
                  <div
                    key={idx}
                    className="absolute border-2 border-destructive bg-destructive/20 rounded text-[10px] text-white"
                    style={{
                      top: box.top,
                      left: box.left,
                      width: box.width,
                      height: box.height,
                      padding: "2px",
                    }}
                  >
                    {box.label}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 기타 CCTV 피드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cctvFeeds
          .filter((feed) => feed.title !== selectedId)
          .map((feed, idx) => (
            <Card key={idx} className="bg-gradient-card border-0 shadow-lg">
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
                <div className="relative rounded-lg overflow-hidden">
                  {feed.youtubeUrl ? (
                    <iframe
                      className="w-full h-48 rounded-lg"
                      src={
                        feed.youtubeUrl.replace("watch?v=", "embed/") +
                        "?autoplay=1&mute=1"
                      }
                      title={`CCTV 영상 - ${feed.title}`}
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  ) : (
                    <img
                      src={feed.image || runwayView}
                      alt={feed.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
