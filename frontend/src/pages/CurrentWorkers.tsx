import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";

// ✅ 1단계: 첫 번째 파일에서 이미지 관련 로직을 그대로 가져옴
// =======================================================

// 이미지 자동 import
const profileImages = import.meta.glob("@/assets/profile/*.png", {
  eager: true,
}) as Record<string, { default: string }>;

// 이름 → 파일명 매핑
const nameToFile: Record<string, string> = {
  "최동혁": "man1.png",
  "조동수": "man2.png",
  "양정민": "man3.png",
  "황상제": "man4.png",
  "김순찰": "man5.png",
  "이홍진": "man6.png",
  "정민양": "man7.png",
  "Mr.test": "man8.png", 
  "z151515": "man9.png"  
};


const getProfileImage = (name: string): string | null => {
  const filename = nameToFile[name];
  if (!filename) return null;

  const entry = Object.entries(profileImages).find(([path]) =>
    path.endsWith(`/profile/${filename}`)
  );
  return entry?.[1].default || null;
};


interface Person {
  memberName: string;
  company?: string;
  department?: string;
  alertState: number;
}

interface AlertCardProps {
  title: string;
  people: Person[]; 
}

export function AlertControlCard({ title, people }: AlertCardProps) {
  return (
    <Card className="bg-white rounded-xl shadow-md border border-border">
      <CardHeader>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {people
            .filter((person) => person.alertState !== 0)
            .map((person, index) => {
              
              const profileImg = getProfileImage(person.memberName);

              return (
                <div
                  key={index}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      
                      <AvatarImage src={profileImg || ""} alt={person.memberName} />
                      
                      <AvatarFallback className="bg-muted text-base">
                        {person.memberName.slice(0, 1)}
                      </AvatarFallback>

                    </Avatar>
                    <div>
                      <div className="text-base font-semibold">
                        {person.memberName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {person.company || "-"} · {person.department || "-"}
                      </div>
                    </div>
                  </div>
                  <Bell className="w-6 h-6 text-green-500" />
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}