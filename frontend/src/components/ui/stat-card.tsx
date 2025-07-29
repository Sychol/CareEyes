// "총 탐지 수", "차량 탐지", "사람 탐지" 같은 통계를 보여줄 때 쓰는 깔끔한 카드
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  iconBg: string;
  trend?: {
    value: string;
    type: "increase" | "decrease";
  };
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  iconBg, 
  trend, 
  className 
}: StatCardProps) {
  return (
    <Card className={cn("bg-gradient-card border-0 shadow-lg", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
            <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center mt-2">
                <span className="text-xs text-muted-foreground">전일 대비</span>
                <span className={cn(
                  "ml-2 text-xs font-medium",
                  trend.type === "increase" ? "text-success" : "text-destructive"
                )}>
                  {trend.type === "increase" ? "+" : "-"}{trend.value}
                </span>
              </div>
            )}
          </div>
          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", iconBg)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}