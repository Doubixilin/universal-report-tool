import { Typography } from "antd";
import ReportGenerator from "@/components/report/ReportGenerator";
import type { ReportGenerationResult } from "@/types";

const { Title } = Typography;

export default function ReportPage() {
  const handleGenerateComplete = (result: ReportGenerationResult) => {
    if (result.success) {
      console.log("报告生成成功:", result.outputPath);
    } else {
      console.error("报告生成失败:", result.error);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          报告生成
        </Title>
      </div>

      <ReportGenerator onGenerateComplete={handleGenerateComplete} />
    </div>
  );
}
