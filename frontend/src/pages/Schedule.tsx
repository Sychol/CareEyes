import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

const scheduleData = [
  {
    category: "출근",
    description: "공장초입대 • 한국일보",
    count: "4명"
  },
  {
    category: "퇴근",
    description: "공장초입대 • 한국일보",
    count: "1명"
  },
  {
    category: "미출근",
    description: "공장 • 한국일보",
    count: "1명"
  },
  {
    category: "휴가",
    description: "수업 • 한국일보",
    count: "2명"
  },
];

export const Schedule = () => {
  return (
    <Card className="h-fit">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">스케줄표</h3>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="h-3 w-3 mr-1" />
              전체
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
          {scheduleData.map((item, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium text-foreground text-sm">{item.category}</div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </div>
              <div className="text-sm font-semibold text-foreground">{item.count}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default Schedule;
