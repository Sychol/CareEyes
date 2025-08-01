import { AlertTable } from "@/pages/AlertTable";
import CurrentWorkers from "@/pages/CurrentWorkers";
import Schedule from "@/pages/Schedule";


const WorkPage = () => {
  return (
    <div className="flex flex-col gap-10 p-8 text-[17px] leading-relaxed">
      {/* 제목 */}
      <h1 className="text-4xl font-bold text-foreground">작업자 관리 내역</h1>

      {/* 메인 그리드 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* 왼쪽: 알림 테이블 */}
        <div className="xl:col-span-2">
          <AlertTable />
        </div>

        {/* 오른쪽: 근무자 + 스케줄 */}
        <div className="flex flex-col gap-6">
          <CurrentWorkers />
          <Schedule />
        </div>
      </div>
    </div>
  );
};

export default WorkPage;
