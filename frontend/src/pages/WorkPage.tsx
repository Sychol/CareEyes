import { AlertTable } from "@/pages/AlertTable";

const WorkPage = () => {
  return (
    <div className="flex flex-col gap-10 p-8 text-[17px] leading-relaxed">
      {/* 제목 */}
      <h1 className="text-4xl font-bold text-foreground">작업자 관리 내역</h1>

      {/* 메인 Flex 3단 구성 */}
      <div className="flex flex-row gap-4 w-full">
        <AlertTable />
      </div>
    </div>
  );
};

export default WorkPage;