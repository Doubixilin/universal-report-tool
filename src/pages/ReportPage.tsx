import { useState } from "react";
import { Card, Button, Select, Steps, Empty, Typography } from "antd";
import { PlayCircleOutlined } from "@ant-design/icons";
import { useProjectStore } from "@/stores/projectStore";
import { useDataStore } from "@/stores/dataStore";

const { Title } = Typography;
const { Option } = Select;
const { Step } = Steps;

export default function ReportPage() {
  const { currentProject } = useProjectStore();
  const { datasets } = useDataStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);

  const steps = [
    { title: "选择模板", description: "选择Word报告模板" },
    { title: "配置数据", description: "选择数据集和图表" },
    { title: "检查映射", description: "确认占位符绑定" },
    { title: "生成报告", description: "导出最终Word文件" },
  ];

  const handleGenerate = () => {
    // TODO: 调用报告生成器
    console.log("生成报告...");
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
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={handleGenerate}
          disabled={currentStep < 3}
        >
          生成报告
        </Button>
      </div>

      <Steps current={currentStep} style={{ marginBottom: 32 }}>
        {steps.map((s) => (
          <Step key={s.title} title={s.title} description={s.description} />
        ))}
      </Steps>

      {!currentProject ? (
        <Empty description="请先选择一个项目" />
      ) : (
        <Card>
          {currentStep === 0 && (
            <div>
              <p style={{ marginBottom: 16 }}>选择一个Word模板文件：</p>
              <Select
                style={{ width: 300 }}
                placeholder="选择模板"
                value={selectedTemplate || undefined}
                onChange={(val) => {
                  setSelectedTemplate(val);
                  setCurrentStep(1);
                }}
              >
                <Option value="template1">月度经营分析报告模板</Option>
              </Select>
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <p style={{ marginBottom: 16 }}>选择要使用的数据集：</p>
              <Select
                mode="multiple"
                style={{ width: "100%" }}
                placeholder="选择数据集"
                value={selectedDatasets}
                onChange={setSelectedDatasets}
              >
                {datasets.map((ds) => (
                  <Option key={ds.id} value={ds.id}>
                    {ds.name}
                  </Option>
                ))}
              </Select>
              <div style={{ marginTop: 16 }}>
                <Button onClick={() => setCurrentStep(0)}>上一步</Button>
                <Button
                  type="primary"
                  style={{ marginLeft: 8 }}
                  onClick={() => setCurrentStep(2)}
                  disabled={selectedDatasets.length === 0}
                >
                  下一步
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <p>占位符绑定检查（待实现）</p>
              <div style={{ marginTop: 16 }}>
                <Button onClick={() => setCurrentStep(1)}>上一步</Button>
                <Button
                  type="primary"
                  style={{ marginLeft: 8 }}
                  onClick={() => setCurrentStep(3)}
                >
                  下一步
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <p>报告生成配置完成，点击右上角"生成报告"按钮导出Word文件。</p>
              <div style={{ marginTop: 16 }}>
                <Button onClick={() => setCurrentStep(2)}>上一步</Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
