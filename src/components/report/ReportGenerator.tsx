import { useState, useEffect } from "react";
import {
  Steps,
  Card,
  Button,
  Table,
  Select,
  Typography,
  message,
  Tag,
  Space,
  Alert,
  Result,
  Spin,
  Collapse,
} from "antd";
import {
  FileTextOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { parsePlaceholders } from "@/utils/templateMigrator";
import { generateReport, selectTemplateFile, selectOutputPath } from "@/services/reportGenerator";
import { useTemplateStore } from "@/stores/templateStore";
import { useDataStore } from "@/stores/dataStore";
import { useChartStore } from "@/stores/chartStore";
import { useProjectStore } from "@/stores/projectStore";
import { getChartConfigs } from "@/services/chartConfigService";
import type {
  ParsedPlaceholder,
  TemplateBindings,
  ReportGenerationResult,
} from "@/types";

const { Title, Text } = Typography;
const { Option } = Select;

interface ReportGeneratorProps {
  onGenerateComplete?: (result: ReportGenerationResult) => void;
}

export default function ReportGenerator({ onGenerateComplete }: ReportGeneratorProps) {
  const { currentProject } = useProjectStore();
  const { templates, setCurrentTemplate } = useTemplateStore();
  const { datasets } = useDataStore();
  const { chartConfigs } = useChartStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplatePath, setSelectedTemplatePath] = useState<string>("");
  const [placeholders, setPlaceholders] = useState<ParsedPlaceholder[]>([]);
  const [bindings, setBindings] = useState<TemplateBindings>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<ReportGenerationResult | null>(null);
  const [parsedFields, setParsedFields] = useState<Record<string, string[]>>({});

  // 启动时从 SQLite 加载图表配置到 chartStore
  useEffect(() => {
    (async () => {
      try {
        const configs = await getChartConfigs("default-project");
        useChartStore.getState().setChartConfigs(
          configs.map((c) => ({
            id: c.id,
            datasetId: c.datasetId,
            title: c.name,
            chartType: c.chartType,
            xAxisField: "",
            yAxisFields: [],
            seriesNames: c.configJson.series.map((s) => s.name),
            colors: c.configJson.series.map((s) => s.color ?? "").filter(Boolean),
            createdAt: new Date(c.createdAt).getTime(),
            updatedAt: new Date(c.updatedAt).getTime(),
          }))
        );
      } catch {
        // 静默失败，chartConfigs 为空时下拉框为空
      }
    })();
  }, []);

  const steps = [
    { title: "选择模板", description: "选择Word报告模板" },
    { title: "数据绑定", description: "绑定占位符到数据源" },
    { title: "预览检查", description: "确认绑定关系" },
    { title: "生成报告", description: "导出Word文件" },
  ];

  // ========== Step 0: 选择模板 ==========
  const handleSelectTemplate = async () => {
    const path = await selectTemplateFile();
    if (!path) return;

    const finalPath = path.endsWith(".docx") ? path : `${path}.docx`;
    setSelectedTemplatePath(finalPath);

    // 解析占位符
    try {
      const found = await parsePlaceholders(finalPath);
      setPlaceholders(found);

      // 初始化绑定
      const initialBindings: TemplateBindings = {};
      for (const ph of found) {
        initialBindings[ph.name] = {};
      }
      setBindings(initialBindings);

      // 从数据集提取可用字段
      const fields: Record<string, string[]> = {};
      for (const ds of datasets) {
        fields[ds.id] = ds.schema.fields.map((f) => f.name);
      }
      setParsedFields(fields);

      message.success(`模板已加载，共找到 ${found.length} 个占位符`);
      setCurrentStep(1);
    } catch (error) {
      message.error(`占位符解析失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // ========== Step 1: 数据绑定 ==========
  const handleBindingChange = (placeholderName: string, bindingType: string, value: string) => {
    setBindings((prev) => {
      const existing = prev[placeholderName] || {};
      const updated = { ...existing };

      if (bindingType === "chart") {
        updated.chartId = value;
        delete updated.datasetId;
        delete updated.field;
        delete updated.loopDatasetId;
      } else if (bindingType === "loop") {
        updated.loopDatasetId = value;
        delete updated.chartId;
        delete updated.field;
      } else if (bindingType === "dataset") {
        updated.datasetId = value;
        delete updated.chartId;
        delete updated.loopDatasetId;
        // 如果之前选了字段但换了数据集，清除字段
        if (!datasets.find((d) => d.id === value)?.schema.fields.find((f) => f.name === updated.field)) {
          delete updated.field;
        }
      } else if (bindingType === "field") {
        updated.field = value;
      }

      return { ...prev, [placeholderName]: updated };
    });
  };

  const columns: ColumnsType<ParsedPlaceholder> = [
    {
      title: "占位符",
      dataIndex: "name",
      key: "name",
      width: 180,
      render: (name: string, record: ParsedPlaceholder) => (
        <Space>
          <Text code>{`{${record.isOpener ? "#" : record.isCloser ? "/" : ""}${name}}`}</Text>
        </Space>
      ),
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          text: "blue",
          chart: "green",
          loop: "orange",
          condition: "purple",
          image: "magenta",
        };
        const labelMap: Record<string, string> = {
          text: "文本",
          chart: "图表",
          loop: "循环",
          condition: "条件",
          image: "图片",
        };
        return <Tag color={colorMap[type] || "default"}>{labelMap[type] || type}</Tag>;
      },
    },
    {
      title: "绑定",
      key: "binding",
      render: (_, record: ParsedPlaceholder) => {
        const binding = bindings[record.name] || {};
        const type = record.type;

        if (type === "chart") {
          return (
            <Select
              style={{ width: "100%" }}
              placeholder="选择图表配置"
              value={binding.chartId}
              onChange={(val) => handleBindingChange(record.name, "chart", val)}
            >
              {chartConfigs.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.title} ({c.chartType})
                </Option>
              ))}
            </Select>
          );
        }

        if (type === "loop") {
          return (
            <Select
              style={{ width: "100%" }}
              placeholder="选择循环数据集"
              value={binding.loopDatasetId}
              onChange={(val) => handleBindingChange(record.name, "loop", val)}
            >
              {datasets.map((ds) => (
                <Option key={ds.id} value={ds.id}>
                  {ds.name} ({ds.rowCount} 行)
                </Option>
              ))}
            </Select>
          );
        }

        if (type === "condition") {
          return <Tag color="purple">自动（默认 true）</Tag>;
        }

        if (type === "image") {
          return <Tag>跳过（暂不支持）</Tag>;
        }

        // Text 类型：数据集 + 字段
        return (
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <Select
              style={{ width: "100%" }}
              placeholder="选择数据集"
              value={binding.datasetId}
              onChange={(val) => handleBindingChange(record.name, "dataset", val)}
            >
              {datasets.map((ds) => (
                <Option key={ds.id} value={ds.id}>
                  {ds.name}
                </Option>
              ))}
            </Select>
            {binding.datasetId && (
              <Select
                style={{ width: "100%" }}
                placeholder="选择字段"
                value={binding.field}
                onChange={(val) => handleBindingChange(record.name, "field", val)}
              >
                {(parsedFields[binding.datasetId] || []).map((f) => (
                  <Option key={f} value={f}>
                    {f}
                  </Option>
                ))}
              </Select>
            )}
          </Space>
        );
      },
    },
  ];

  // ========== Step 2: 预览检查 ==========
  const unboundPlaceholders = placeholders.filter((ph) => {
    // image 类型暂不支持，不计入未绑定
    if (ph.type === "image") return false;
    const binding = bindings[ph.name];
    if (!binding) return true;
    if (ph.type === "chart" && !binding.chartId) return true;
    if (ph.type === "text" && (!binding.datasetId || !binding.field)) return true;
    if (ph.type === "loop" && !binding.loopDatasetId) return true;
    return false;
  });

  // ========== Step 3: 生成报告 ==========
  const handleGenerate = async () => {
    if (!selectedTemplatePath) {
      message.error("未选择模板文件");
      return;
    }

    const outputPath = await selectOutputPath("report.docx");
    if (!outputPath) return;
    const finalPath = outputPath.endsWith(".docx") ? outputPath : `${outputPath}.docx`;

    setIsGenerating(true);
    try {
      const result = await generateReport({
        templatePath: selectedTemplatePath,
        outputPath: finalPath,
        bindings,
        datasets,
        chartConfigs,
      });

      setGenerateResult(result);
      if (result.success) {
        message.success(`报告已生成: ${result.outputPath}`);
      } else {
        message.error(result.error);
      }
      onGenerateComplete?.(result);
    } catch (error) {
      const errResult: ReportGenerationResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        placeholdersReplaced: 0,
        chartsUpdated: 0,
      };
      setGenerateResult(errResult);
      message.error(errResult.error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!currentProject) {
    return <Alert message="请先选择一个项目" type="warning" icon={<WarningOutlined />} />;
  }

  return (
    <div>
      <Steps
        current={currentStep}
        style={{ marginBottom: 32 }}
        items={steps.map((s) => ({ title: s.title, description: s.description }))}
      />

      <Card>
        {/* Step 0: 选择模板 */}
        {currentStep === 0 && (
          <div>
            <Title level={5}>选择Word报告模板</Title>
            <p>从本地选择已编辑好的 .docx 模板文件，系统会自动识别其中的占位符并引导你完成数据绑定。</p>

            {/* 占位符语法指南 */}
            <Collapse
              style={{ marginBottom: 24 }}
              items={[{
                key: "guide",
                label: (
                  <span>
                    <QuestionCircleOutlined style={{ marginRight: 8 }} />
                    占位符语法指南 — 如何编写 Word 模板？
                  </span>
                ),
                children: (
                  <div style={{ fontSize: 13, lineHeight: 2 }}>
                    <p><Text strong>在 Word 文档中插入以下格式的占位符，系统会自动识别并替换为实际数据：</Text></p>
                    <Table
                      size="small"
                      pagination={false}
                      dataSource={[
                        { type: "文本替换", syntax: "{变量名}", example: "{公司名称}", desc: "替换为数据集中对应字段的值" },
                        { type: "图表插入", syntax: "{图表名}", example: "{销售趋势图}", desc: "在该位置插入已绑定的图表（图片形式）" },
                        { type: "循环表格", syntax: "{#表名}{列1}{列2}{/表名}", example: "{#明细}{部门}{金额}{/明细}", desc: "循环数据集的每一行，生成表格行" },
                        { type: "条件显示", syntax: "{#条件}内容{/条件}", example: "{#显示备注}备注：...{/显示备注}", desc: "根据条件决定是否显示内容（默认显示）" },
                      ]}
                      columns={[
                        { title: "类型", dataIndex: "type", width: 100, render: (t: string) => <Tag>{t}</Tag> },
                        { title: "语法格式", dataIndex: "syntax", width: 260, render: (t: string) => <Text code>{t}</Text> },
                        { title: "示例", dataIndex: "example", width: 260, render: (t: string) => <Text code>{t}</Text> },
                        { title: "说明", dataIndex: "desc" },
                      ]}
                    />
                    <Alert
                      style={{ marginTop: 12 }}
                      type="info"
                      showIcon
                      message="操作步骤：① 在 Word 中写好占位符 → ② 保存为 .docx → ③ 点下方按钮选择该文件 → ④ 在下一步绑定数据源"
                    />
                  </div>
                ),
              }]}
            />

            {templates.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>已保存的模板：</Text>
                <Select
                  style={{ width: 300, marginLeft: 8 }}
                  placeholder="选择已保存的模板"
                  onChange={(val) => {
                    const tpl = templates.find((t) => t.id === val);
                    if (tpl) {
                      setSelectedTemplatePath(tpl.filePath);
                      setCurrentTemplate(tpl);
                    }
                  }}
                >
                  {templates.map((tpl) => (
                    <Option key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </Option>
                  ))}
                </Select>
              </div>
            )}

            <Button
              type="primary"
              icon={<FileTextOutlined />}
              onClick={handleSelectTemplate}
              size="large"
            >
              从文件选择模板
            </Button>

            <div style={{ marginTop: 24 }}>
              <Text type="secondary">
                提示：在 Word 中插入空白图表后，将图表标题设为 {`{chartTag}`} 即可绑定图表数据。
              </Text>
            </div>
          </div>
        )}

        {/* Step 1: 数据绑定 */}
        {currentStep === 1 && (
          <div>
            <Title level={5}>数据绑定</Title>
            <p>
              模板共检测到 {placeholders.length} 个占位符，请为每个占位符绑定数据源。
            </p>

            <Table<ParsedPlaceholder>
              columns={columns}
              dataSource={placeholders}
              rowKey={(record) => `${record.name}_${record.location.paragraph}`}
              pagination={false}
              size="small"
            />

            <div style={{ marginTop: 16 }}>
              <Button onClick={() => setCurrentStep(0)}>上一步</Button>
              <Button
                type="primary"
                style={{ marginLeft: 8 }}
                onClick={() => setCurrentStep(2)}
              >
                下一步
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: 预览检查 */}
        {currentStep === 2 && (
          <div>
            <Title level={5}>绑定预览与检查</Title>

            {unboundPlaceholders.length > 0 && (
              <Alert
                message={`有 ${unboundPlaceholders.length} 个占位符未绑定数据`}
                description={unboundPlaceholders
                  .map((ph) => `{${ph.name}}`)
                  .join("、")}
                type="warning"
                icon={<WarningOutlined />}
                style={{ marginBottom: 16 }}
              />
            )}

            <Table<ParsedPlaceholder>
              columns={[
                {
                  title: "占位符",
                  dataIndex: "name",
                  key: "name",
                  width: 180,
                  render: (name: string, record: ParsedPlaceholder) => (
                    <Text code>{`{${record.isOpener ? "#" : record.isCloser ? "/" : ""}${name}}`}</Text>
                  ),
                },
                {
                  title: "类型",
                  dataIndex: "type",
                  key: "type",
                  width: 80,
                  render: (type: string) => (
                    <Tag color={type === "chart" ? "green" : "blue"}>{type}</Tag>
                  ),
                },
                {
                  title: "已绑定",
                  key: "status",
                  width: 100,
                  render: (_, record: ParsedPlaceholder) => {
                    const binding = bindings[record.name];
                    const isBound =
                      binding &&
                      (binding.chartId || binding.datasetId || binding.loopDatasetId);
                    return isBound ? (
                      <Tag color="success" icon={<CheckCircleOutlined />}>
                        已绑定
                      </Tag>
                    ) : (
                      <Tag color="error">未绑定</Tag>
                    );
                  },
                },
              ]}
              dataSource={placeholders}
              rowKey={(record) => `${record.name}_${record.location.paragraph}`}
              pagination={false}
              size="small"
            />

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

        {/* Step 3: 生成报告 */}
        {currentStep === 3 && (
          <div>
            <Title level={5}>生成报告</Title>

            {isGenerating ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <Spin size="large" />
                <p style={{ marginTop: 16 }}>正在生成报告，请稍候...</p>
              </div>
            ) : generateResult ? (
              generateResult.success ? (
                <Result
                  status="success"
                  title="报告生成成功"
                  subTitle={`输出路径: ${generateResult.outputPath}`}
                  extra={
                    <Space>
                      <Tag color="blue">
                        替换 {generateResult.placeholdersReplaced} 个占位符
                      </Tag>
                      {generateResult.chartsUpdated > 0 && (
                        <Tag color="green">
                          更新 {generateResult.chartsUpdated} 个图表
                        </Tag>
                      )}
                    </Space>
                  }
                />
              ) : (
                <Result
                  status="error"
                  title="报告生成失败"
                  subTitle={generateResult.error}
                />
              )
            ) : (
              <div>
                <p>配置已完成，点击生成按钮导出 Word 报告。</p>
                <Alert
                  message="即将使用的配置"
                  description={
                    <div>
                      <p>模板: {selectedTemplatePath}</p>
                      <p>数据集: {datasets.length} 个</p>
                      <p>图表配置: {chartConfigs.length} 个</p>
                      <p>已绑定: {Object.keys(bindings).length} 个占位符</p>
                    </div>
                  }
                  type="info"
                  style={{ marginBottom: 16 }}
                />
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <Button onClick={() => setCurrentStep(2)} disabled={isGenerating}>
                上一步
              </Button>
              {!generateResult && (
                <Button
                  type="primary"
                  icon={<LinkOutlined />}
                  onClick={handleGenerate}
                  loading={isGenerating}
                  style={{ marginLeft: 8 }}
                  disabled={unboundPlaceholders.length > 0}
                >
                  生成报告
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
