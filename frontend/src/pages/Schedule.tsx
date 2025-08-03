import { useEffect, useState } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

interface Worker {
  memberName: string;
  company: string;
  department: string;
  alertState: number;
}

type AlertCategory = "알림 설정" | "미설정";

interface AlertStatusItem {
  category: AlertCategory;
  description: string;
  count: number;
}

const allCategories: AlertCategory[] = ["알림 설정", "미설정"];

export const Schedule = () => {
  const [alertStatus, setAlertStatus] = useState<AlertStatusItem[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<AlertCategory[]>([...allCategories]);

  const toggleCategory = (category: AlertCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  useEffect(() => {
    axios
      .get("/api/member/workerlist")
      .then((res) => {
        const workers: Worker[] = res.data;

        const categoryMap: Record<AlertCategory, AlertStatusItem> = {
          "알림 설정": { category: "알림 설정", description: "알림 수신 설정됨", count: 0 },
          "미설정": { category: "미설정", description: "알림 수신되지 않음", count: 0 },
        };

        workers.forEach((worker) => {
          switch (worker.alertState) {
            case 1:
              categoryMap["알림 설정"].count += 1;
              break;
            case 2:
              categoryMap["미설정"].count += 1;
              break;
          }
        });

        setAlertStatus(Object.values(categoryMap));
      })
      .catch((err) => {
        console.error("스케줄 데이터 불러오기 실패:", err);
      });
  }, []);

  return (
    <Card className="h-fit">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">알림 설정 현황</h3>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Filter className="h-3 w-3 mr-1" />
                필터
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-3 space-y-2">
              {allCategories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => toggleCategory(category)}
                  />
                  <label htmlFor={category} className="text-sm font-medium">
                    {category}
                  </label>
                </div>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-4">
          {alertStatus
            .filter((item) => selectedCategories.includes(item.category))
            .map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium text-base text-foreground">{item.category}</div>
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                </div>
                <div className="text-base font-semibold text-foreground">{item.count}명</div>
              </div>
            ))}
        </div>
      </div>
    </Card>
  );
};

export default Schedule;
