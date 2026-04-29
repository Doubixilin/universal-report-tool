import { useState, useRef, useEffect } from "react";
import { Card, Switch, Button, Typography, Row, Col, message, Select } from "antd";
import { SaveOutlined, SkinOutlined } from "@ant-design/icons";
import * as echarts from "echarts";
import { useDataStore } from "@/stores/dataStore";
import { useChartStore } from "@/stores/chartStore";
import { invoke } from "@tauri-apps/api/core";
import type { ChartGenerationResponse } from "@/types/chart";
import { CHART_GENERATORS, EXPORTABLE_CHARTS } from "@/components/chart/chartConfigs/chartTypeToGenerator";
import ChartTypeSelector from "@/components/chart/ChartTypeSelector";
import ExportButton from "@/components/chart/ExportButton";
import ThemeSelector from "@/components/chart/ThemeSelector";
import AnnotationPanel from "@/components/chart/AnnotationPanel";
import { themeManager } from "@/themes";
import {
  createChartConfig,
  getChartConfigs,
  updateChartConfig,
  deleteChartConfig,
  type ChartConfigRecord,
} from "@/services/chartConfigService";
import { getDatabase } from "@/database";

const { Title } = Typography;
const { Option } = Select;

// 数据源类型选项
const DATA_SOURCE_OPTIONS = [
  { value: "sample", label: "示例数据" },
  { value: "dataset", label: "已导入数据集" },
];

export default function ChartDesignerPage() {
  const { datasets, setDatasets } = useDataStore();
  const {
    title, chartType, categories, series,
    xAxisTitle, yAxisTitle, theme, annotations,
    setTitle, setChartType, setCategories, setSeries,
    setXAxisTitle, setYAxisTitle, setTheme, setAnnotations,
  } = useChartStore();

  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const [showLabel, setShowLabel] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [dataSource, setDataSource] = useState<"sample" | "dataset">("sample");
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [testResult, setTestResult] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState<ChartConfigRecord[]>([]);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);

  // 加载已保存的图表配置 + 数据集列表
  useEffect(() => {
    loadSavedConfigs();
    (async () => {
      try {
        const db = await getDatabase();
        const rows = await db.select<Array<{ id: string; name: string; row_count: number; created_at: string; updated_at: string; project_id: string; source_file: string; import_scheme_id: string | null; schema_json: string }>>(
          "SELECT * FROM datasets ORDER BY created_at DESC"
        );
        if (rows && rows.length > 0) {
          setDatasets(rows.map(r => ({
            id: r.id,
            projectId: r.project_id,
            name: r.name,
            sourceFile: r.source_file,
            importSchemeId: r.import_scheme_id,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            rowCount: r.row_count,
            schema: r.schema_json ? JSON.parse(r.schema_json) : { fields: [] },
          })));
        }
      } catch (e) {
        console.error("加载数据集列表失败:", e);
      }
    })();
  }, []);

  // 初始化 ECharts 实例（带主题）
  useEffect(() => {
    if (chartRef.current) {
      chartInstance.current = echarts.init(chartRef.current, theme);
    }
    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [theme]);

  // 根据选择的图表类型渲染
  useEffect(() => {
    if (!chartInstance.current) return;
    const generator = CHART_GENERATORS[chartType];
    if (!generator) return;

    const option = generator({
      title,
      chartType,
      categories,
      series,
      showLabel,
      showLegend,
      xAxisTitle,
      yAxisTitle,
      annotations,
    });
    chartInstance.current.setOption(option, true);
  }, [chartType, showLabel, showLegend, title, categories, series, xAxisTitle, yAxisTitle, annotations]);

  const loadSavedConfigs = async () => {
    try {
      const configs = await getChartConfigs("default-project");
      setSavedConfigs(configs);
    } catch (e) {
      console.error("加载图表配置失败:", e);
    }
  };

  /** 选择数据集后加载记录并提取 categories/series */
  const handleDatasetSelect = async (datasetId: string) => {
    setSelectedDataset(datasetId);
    if (!datasetId) return;

    try {
      const db = await getDatabase();
      const rows = await db.select<Array<{ data_json: string }>>(
        "SELECT data_json FROM dataset_records WHERE dataset_id = $1 ORDER BY row_index ASC",
        [datasetId]
      );

      if (!rows || rows.length === 0) {
        message.warning("该数据集无记录");
        return;
      }

      // 解析记录
      const records = rows.map((r) => JSON.parse(r.data_json) as Record<string, unknown>);
      const fields = Object.keys(records[0]);

      // 自动识别：第一个文本字段作为分类，其余数值字段作为系列
      const textFields: string[] = [];
      const numFields: string[] = [];
      for (const field of fields) {
        const sampleVal = records[0][field];
        if (typeof sampleVal === "number" || !isNaN(Number(sampleVal))) {
          numFields.push(field);
        } else {
          textFields.push(field);
        }
      }

      const categoryField = textFields[0] || fields[0];
      const extractedCategories = records.map((r) => String(r[categoryField] ?? ""));
      const extractedSeries = numFields.map((field) => ({
        name: field,
        values: records.map((r) => {
          const v = r[field];
          return typeof v === "number" ? v : Number(v) || 0;
        }),
      }));

      setCategories(extractedCategories);
      setSeries(extractedSeries);
      if (numFields.length > 0) {
        setYAxisTitle(numFields[0]);
      }
      setXAxisTitle(categoryField);
      message.success(`已加载 ${records.length} 条记录，${numFields.length} 个数值系列`);
    } catch (e) {
      message.error("加载数据集失败: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      message.warning("请输入图表标题");
      return;
    }
    setSaving(true);
    try {
      const configData = {
        title,
        chartType,
        categories,
        series,
        xAxisTitle,
        yAxisTitle,
        theme,
      };

      if (editingConfigId) {
        await updateChartConfig(editingConfigId, {
          name: title,
          chartType,
          datasetId: selectedDataset || "",
          configData,
        });
        message.success("图表配置已更新");
      } else {
        const id = await createChartConfig(
          "default-project",
          title,
          chartType,
          selectedDataset || "",
          configData
        );
        setEditingConfigId(id);
        message.success("图表配置已保存");
      }
      await loadSavedConfigs();
    } catch (e) {
      message.error("保存失败: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSaving(false);
    }
  };

  const handleLoadConfig = (config: ChartConfigRecord) => {
    const data = config.configJson;
    setTitle(data.title);
    setChartType(data.chartType);
    setCategories(data.categories);
    setSeries(data.series);
    if (data.xAxisTitle) setXAxisTitle(data.xAxisTitle);
    if (data.yAxisTitle) setYAxisTitle(data.yAxisTitle);
    if (data.theme) handleThemeChange(data.theme);
    setEditingConfigId(config.id);
    message.success(`已加载: ${config.name}`);
  };

  const handleDeleteConfig = async (id: string) => {
    try {
      await deleteChartConfig(id);
      if (editingConfigId === id) setEditingConfigId(null);
      await loadSavedConfigs();
      message.success("已删除");
    } catch (e) {
      message.error("删除失败");
    }
  };

  const handleThemeChange = (newTheme: string) => {
    themeManager.switchTheme(newTheme);
    setTheme(newTheme);
  };

  const handleTestRustCommand = async () => {
    try {
      const result = await invoke<ChartGenerationResponse>("generate_excel_chart", {
        filepath: "test-chart.xlsx",
        request: {
          title,
          chartType,
          categories,
          series,
          xAxisTitle,
          yAxisTitle,
        },
      });
      message.success("✅ " + result.message);
      setTestResult(JSON.stringify(result, null, 2));
    } catch (e) {
      message.error("❌ " + (e as string));
      setTestResult(String(e));
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
          图表设计器
        </Title>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={handleTestRustCommand} style={{ background: "#f0f0f0" }}>
            🔧 测试Rust命令
          </Button>
          <ExportButton
            enableExcel={EXPORTABLE_CHARTS.has(chartType)}
            chartInstance={chartInstance.current}
            chartContainer={chartRef.current}
            onSuccess={(format) => console.log("导出成功:", format)}
            onError={(error) => console.error("导出失败:", error)}
          />
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
          >
            {editingConfigId ? "更新图表" : "保存图表"}
          </Button>
        </div>
      </div>

      <Row gutter={16}>
        <Col span={6}>
          <Card title="图表配置" size="small">
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 4 }}>图表标题</label>
              <input
                style={{ width: "100%", padding: "4px 8px", border: "1px solid #d9d9d9", borderRadius: 4 }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 4 }}>数据源</label>
              <Select
                style={{ width: "100%" }}
                value={dataSource}
                onChange={setDataSource}
                options={DATA_SOURCE_OPTIONS}
              />
            </div>

            {dataSource === "dataset" && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", marginBottom: 4 }}>选择数据集</label>
                <Select
                  style={{ width: "100%" }}
                  placeholder="选择数据集"
                  value={selectedDataset || undefined}
                  onChange={handleDatasetSelect}
                >
                  {datasets.map((ds) => (
                    <Option key={ds.id} value={ds.id}>
                      {ds.name}
                    </Option>
                  ))}
                </Select>
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 4 }}>图表类型</label>
              <ChartTypeSelector value={chartType} onChange={setChartType} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 4 }}>
                <SkinOutlined style={{ marginRight: 4 }} />
                图表主题
              </label>
              <ThemeSelector value={theme} onChange={handleThemeChange} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 4 }}>分类标签（逗号分隔）</label>
              <input
                style={{ width: "100%", padding: "4px 8px", border: "1px solid #d9d9d9", borderRadius: 4 }}
                value={categories.join(", ")}
                onChange={(e) => setCategories(e.target.value.split(/,\s*/).filter(Boolean))}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 4 }}>X 轴标题</label>
              <input
                style={{ width: "100%", padding: "4px 8px", border: "1px solid #d9d9d9", borderRadius: 4 }}
                value={xAxisTitle || ""}
                placeholder="可选"
                onChange={(e) => setXAxisTitle(e.target.value || undefined)}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 4 }}>Y 轴标题</label>
              <input
                style={{ width: "100%", padding: "4px 8px", border: "1px solid #d9d9d9", borderRadius: 4 }}
                value={yAxisTitle || ""}
                placeholder="可选"
                onChange={(e) => setYAxisTitle(e.target.value || undefined)}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 4 }}>样式设置</label>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span>显示标签</span>
                <Switch size="small" checked={showLabel} onChange={setShowLabel} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>显示图例</span>
                <Switch size="small" checked={showLegend} onChange={setShowLegend} />
              </div>
            </div>
          </Card>

          <Card title="标注" size="small" style={{ marginTop: 16 }}>
            <AnnotationPanel config={annotations} onChange={setAnnotations} />
          </Card>
        </Col>

        <Col span={18}>
          <Card bodyStyle={{ padding: 0 }}>
            <div ref={chartRef} style={{ width: "100%", height: 500 }} />
          </Card>
        </Col>
      </Row>

      {testResult && (
        <Card title="Rust Command Test Result" size="small" style={{ marginTop: 16 }}>
          <pre style={{ margin: 0, fontSize: 12, maxHeight: 200, overflow: "auto" }}>
            {testResult}
          </pre>
        </Card>
      )}

      {savedConfigs.length > 0 && (
        <Card
          title={`已保存的图表配置 (${savedConfigs.length})`}
          size="small"
          style={{ marginTop: 16 }}
          extra={
            <Button
              size="small"
              onClick={() => {
                setEditingConfigId(null);
                message.info("已切换到新建模式");
              }}
            >
              新建
            </Button>
          }
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {savedConfigs.map((config) => (
              <Card
                key={config.id}
                size="small"
                hoverable
                style={{
                  width: 200,
                  border: editingConfigId === config.id ? "2px solid #1890ff" : undefined,
                }}
                actions={[
                  <span key="load" onClick={() => handleLoadConfig(config)}>加载</span>,
                  <span key="delete" onClick={() => handleDeleteConfig(config.id)}>删除</span>,
                ]}
              >
                <Card.Meta
                  title={config.name}
                  description={`${config.chartType} | ${new Date(config.createdAt).toLocaleDateString()}`}
                />
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
