import { useState, useRef, useEffect, useMemo } from "react";
import { Card, Switch, Button, Typography, Row, Col, message, Select, Modal, Checkbox, InputNumber, Tag, Divider, Space } from "antd";
import { SaveOutlined, SkinOutlined, CheckCircleOutlined, AppstoreOutlined } from "@ant-design/icons";
import * as echarts from "echarts";
import { useDataStore } from "@/stores/dataStore";
import { useChartStore } from "@/stores/chartStore";
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
import type { ChartTypeKind } from "@/types/chart";

const { Title, Text } = Typography;
const { Option } = Select;

/** 从原始记录中识别字段类型 */
function detectFieldTypes(records: Record<string, unknown>[]) {
  if (records.length === 0) return { textFields: [], numFields: [] };
  const fields = Object.keys(records[0]);
  const textFields: string[] = [];
  const numFields: string[] = [];
  for (const field of fields) {
    // 用前 5 行判断类型
    const samples = records.slice(0, 5).map((r) => r[field]);
    const allNum = samples.every((v) => typeof v === "number" || (v !== null && v !== "" && !isNaN(Number(v))));
    if (allNum) {
      numFields.push(field);
    } else {
      textFields.push(field);
    }
  }
  return { textFields, numFields };
}

/** 复合图表系列类型选项 */
const SERIES_TYPE_OPTIONS = [
  { value: "barChart", label: "柱状图" },
  { value: "lineChart", label: "折线图" },
  { value: "areaChart", label: "面积图" },
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
  const [saving, setSaving] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState<ChartConfigRecord[]>([]);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);

  // === 数据列/行选择状态 ===
  const [rawRecords, setRawRecords] = useState<Record<string, unknown>[]>([]);
  const [categoryField, setCategoryField] = useState<string>("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [rowRange, setRowRange] = useState<[number, number]>([1, 100]);
  const [seriesTypes, setSeriesTypes] = useState<Record<string, ChartTypeKind>>({});
  const [dataConfigured, setDataConfigured] = useState(false);

  /** 根据 rawRecords 自动检测的字段列表 */
  const fieldInfo = useMemo(() => detectFieldTypes(rawRecords), [rawRecords]);

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
      seriesTypes: Object.keys(seriesTypes).length > 0 ? seriesTypes : undefined,
    });
    chartInstance.current.setOption(option, true);
  }, [chartType, showLabel, showLegend, title, categories, series, xAxisTitle, yAxisTitle, annotations, seriesTypes]);

  const loadSavedConfigs = async () => {
    try {
      const configs = await getChartConfigs("default-project");
      setSavedConfigs(configs);
      // 同步到 chartStore，供 ReportGenerator 等组件使用
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
    } catch (e) {
      console.error("加载图表配置失败:", e);
    }
  };

  /** 选择数据集后加载原始记录，展示列/行选择器 */
  const handleDatasetSelect = async (datasetId: string) => {
    setSelectedDataset(datasetId);
    setDataConfigured(false);
    setRawRecords([]);
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

      const records = rows.map((r) => JSON.parse(r.data_json) as Record<string, unknown>);
      setRawRecords(records);

      // 自动检测并预设默认选择
      const { textFields, numFields } = detectFieldTypes(records);
      const defaultCat = textFields[0] || Object.keys(records[0])[0];
      setCategoryField(defaultCat);
      setSelectedColumns(numFields.length > 0 ? numFields : Object.keys(records[0]).slice(1));
      setRowRange([1, records.length]);
      setSeriesTypes({});
      setDataConfigured(false);

      message.success(`已加载 ${records.length} 行数据，请在下方选择分类列和数据列`);
    } catch (e) {
      message.error("加载数据集失败: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  /** 将用户选择的列/行应用到图表状态 */
  const handleApplyData = () => {
    if (!categoryField) {
      message.warning("请选择分类列（X 轴）");
      return;
    }
    if (selectedColumns.length === 0) {
      message.warning("请至少选择一个数据列");
      return;
    }

    // 截取行范围
    const start = Math.max(0, rowRange[0] - 1);
    const end = Math.min(rawRecords.length, rowRange[1]);
    const sliced = rawRecords.slice(start, end);

    // 提取分类
    const extractedCategories = sliced.map((r) => String(r[categoryField] ?? ""));
    setCategories(extractedCategories);

    // 提取系列
    const defaultColors = ["#C41E24", "#1E6FDC", "#27AE60", "#B8860B", "#6C5CE7", "#E17055", "#00B894", "#FDCB6E"];
    const extractedSeries = selectedColumns.map((field, idx) => ({
      name: field,
      values: sliced.map((r) => {
        const v = r[field];
        return typeof v === "number" ? v : Number(v) || 0;
      }),
      color: defaultColors[idx % defaultColors.length],
    }));
    setSeries(extractedSeries);

    // 自动设置轴标题
    setXAxisTitle(categoryField);
    if (selectedColumns.length === 1) {
      setYAxisTitle(selectedColumns[0]);
    }

    // 检查是否有混合图表类型 → 自动切换为柱状图基座
    const types = Object.values(seriesTypes);
    const hasMixed = types.length > 0 && new Set(types).size > 1;
    if (hasMixed) {
      // 混合类型时，ECharts 通过每个 series 指定 type 实现
      // 这里设置基座为 barChart，各 series 的 type 在生成器中处理
      message.info("检测到复合图表类型，各系列将使用各自指定的图表类型");
    }

    setDataConfigured(true);
    message.success(`已应用：${sliced.length} 行 × ${selectedColumns.length} 个系列`);
  };

  /** 更新某个系列的图表类型（复合图表） */
  const handleSeriesTypeChange = (field: string, type: ChartTypeKind) => {
    setSeriesTypes((prev) => ({ ...prev, [field]: type }));
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

  const handleDeleteConfig = (id: string, name: string) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除图表配置「${name}」吗？`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          await deleteChartConfig(id);
          if (editingConfigId === id) setEditingConfigId(null);
          await loadSavedConfigs();
          message.success("已删除");
        } catch {
          message.error("删除失败");
        }
      },
    });
  };

  const handleThemeChange = (newTheme: string) => {
    themeManager.switchTheme(newTheme);
    setTheme(newTheme);
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
          {/* 数据源选择 — 突出显示 */}
          <Card
            size="small"
            style={{
              marginBottom: 16,
              borderColor: dataConfigured ? "#52c41a" : "#1677ff",
              borderWidth: 2,
            }}
            title={
              <span>
                {dataConfigured ? <CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} /> : <AppstoreOutlined style={{ marginRight: 8 }} />}
                选择图表数据来源
              </span>
            }
          >
            <div style={{ marginBottom: 12 }}>
              <Select
                style={{ width: "100%" }}
                value={dataSource}
                onChange={(v) => { setDataSource(v); if (v === "sample") { setSelectedDataset(""); setRawRecords([]); setDataConfigured(false); } }}
                options={[
                  { value: "sample", label: "使用示例数据（快速预览图表效果）" },
                  { value: "dataset", label: "从已导入的数据集生成图表" },
                ]}
              />
            </div>

            {dataSource === "dataset" && (
              <>
                {/* 步骤 1：选数据集 */}
                <div style={{ marginBottom: 12 }}>
                  <Text strong style={{ fontSize: 12 }}>① 选择数据集</Text>
                  <Select
                    style={{ width: "100%", marginTop: 4 }}
                    placeholder="选择一个已导入的数据集"
                    value={selectedDataset || undefined}
                    onChange={handleDatasetSelect}
                  >
                    {datasets.map((ds) => (
                      <Option key={ds.id} value={ds.id}>
                        {ds.name}（{ds.rowCount} 行）
                      </Option>
                    ))}
                  </Select>
                </div>

                {/* 步骤 2：选分类列（X轴） */}
                {rawRecords.length > 0 && (
                  <>
                    <Divider style={{ margin: "8px 0" }} />
                    <div style={{ marginBottom: 12 }}>
                      <Text strong style={{ fontSize: 12 }}>② 分类列（X 轴）</Text>
                      <Select
                        style={{ width: "100%", marginTop: 4 }}
                        value={categoryField}
                        onChange={setCategoryField}
                      >
                        {Object.keys(rawRecords[0]).map((f) => (
                          <Option key={f} value={f}>
                            {f}
                            {fieldInfo.numFields.includes(f) ? <Tag color="blue" style={{ marginLeft: 4 }}>数值</Tag> : <Tag style={{ marginLeft: 4 }}>文本</Tag>}
                          </Option>
                        ))}
                      </Select>
                      <div style={{ color: "#888", fontSize: 11, marginTop: 2 }}>
                        选择作为 X 轴分类标签的列（通常是文本列如部门、月份）
                      </div>
                    </div>

                    {/* 步骤 3：选数据列（Y轴，多选） */}
                    <div style={{ marginBottom: 12 }}>
                      <Text strong style={{ fontSize: 12 }}>③ 数据列（Y 轴，可多选）</Text>
                      <div style={{ marginTop: 4, maxHeight: 150, overflow: "auto", border: "1px solid #f0f0f0", borderRadius: 4, padding: "4px 8px" }}>
                        <Checkbox.Group
                          value={selectedColumns}
                          onChange={setSelectedColumns}
                          style={{ display: "flex", flexDirection: "column", gap: 4 }}
                        >
                          {Object.keys(rawRecords[0])
                            .filter((f) => f !== categoryField)
                            .map((f) => (
                              <Checkbox key={f} value={f}>
                                {f}
                                {fieldInfo.numFields.includes(f) ? <Tag color="blue" style={{ marginLeft: 4 }}>数值</Tag> : <Tag style={{ marginLeft: 4 }}>文本</Tag>}
                              </Checkbox>
                            ))}
                        </Checkbox.Group>
                      </div>
                      <div style={{ color: "#888", fontSize: 11, marginTop: 2 }}>
                        勾选要绘制为图表系列的列，每个勾选的列成为一个系列
                      </div>
                    </div>

                    {/* 步骤 4：行范围 */}
                    <div style={{ marginBottom: 12 }}>
                      <Text strong style={{ fontSize: 12 }}>④ 行范围（可选）</Text>
                      <Space style={{ marginTop: 4 }}>
                        <InputNumber
                          size="small"
                          min={1}
                          max={rawRecords.length}
                          value={rowRange[0]}
                          onChange={(v) => v && setRowRange([v, rowRange[1]])}
                          style={{ width: 70 }}
                        />
                        <span>~</span>
                        <InputNumber
                          size="small"
                          min={rowRange[0]}
                          max={rawRecords.length}
                          value={rowRange[1]}
                          onChange={(v) => v && setRowRange([rowRange[0], v])}
                          style={{ width: 70 }}
                        />
                        <span style={{ color: "#888", fontSize: 11 }}>共 {rawRecords.length} 行</span>
                      </Space>
                    </div>

                    {/* 步骤 5：复合图表 — 每个系列可指定图表类型 */}
                    {selectedColumns.length > 1 && (
                      <div style={{ marginBottom: 12 }}>
                        <Text strong style={{ fontSize: 12 }}>⑤ 系列图表类型（复合图表）</Text>
                        <div style={{ marginTop: 4 }}>
                          {selectedColumns.map((col) => (
                            <div key={col} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                              <Text style={{ fontSize: 12, minWidth: 60, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={col}>
                                {col}
                              </Text>
                              <Select
                                size="small"
                                style={{ flex: 1 }}
                                value={seriesTypes[col] || chartType}
                                onChange={(v) => handleSeriesTypeChange(col, v)}
                                options={SERIES_TYPE_OPTIONS}
                              />
                            </div>
                          ))}
                          {Object.keys(seriesTypes).length > 0 && new Set(Object.values(seriesTypes)).size > 1 && (
                            <Tag color="orange" style={{ marginTop: 4 }}>复合图表模式</Tag>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 应用按钮 */}
                    <Button
                      type="primary"
                      block
                      onClick={handleApplyData}
                      disabled={selectedColumns.length === 0 || !categoryField}
                    >
                      应用数据到图表
                    </Button>
                  </>
                )}
              </>
            )}
            {dataSource === "sample" && (
              <div style={{ color: "#888", fontSize: 12 }}>
                使用内置示例数据，适合快速预览不同图表类型的效果
              </div>
            )}
          </Card>

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
                  <span key="delete" onClick={() => handleDeleteConfig(config.id, config.name)}>删除</span>,
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
