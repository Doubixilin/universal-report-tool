import { useState, useRef, useEffect } from "react";
import { Card, Select, Switch, Button, Typography, Row, Col } from "antd";
import { SaveOutlined, DownloadOutlined } from "@ant-design/icons";
import * as echarts from "echarts";
import { useDataStore } from "@/stores/dataStore";

const { Title } = Typography;
const { Option } = Select;

function buildChartOption(
  chartType: string,
  showLabel: boolean,
  showLegend: boolean
): echarts.EChartsOption {
  const base: echarts.EChartsOption = {
    title: { text: "示例图表", left: "center" },
    tooltip: {},
    legend: { show: showLegend, bottom: 0 },
  };

  switch (chartType) {
    case "bar":
      return {
        ...base,
        tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: ["1月", "2月", "3月", "4月", "5月", "6月"] },
        yAxis: { type: "value" },
        series: [{ type: "bar", data: [120, 200, 150, 80, 70, 110], label: { show: showLabel } }],
      };

    case "line":
      return {
        ...base,
        tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: ["1月", "2月", "3月", "4月", "5月", "6月"] },
        yAxis: { type: "value" },
        series: [{ type: "line", data: [120, 200, 150, 80, 70, 110], label: { show: showLabel } }],
      };

    case "scatter":
      return {
        ...base,
        tooltip: { trigger: "item" },
        xAxis: { type: "value" },
        yAxis: { type: "value" },
        series: [
          {
            type: "scatter",
            data: [
              [10, 8.04], [8, 6.95], [13, 7.58], [9, 8.81],
              [11, 8.33], [14, 9.96], [6, 7.24], [4, 4.26],
              [12, 10.84], [7, 4.82], [5, 5.68],
            ],
          },
        ],
      };

    case "pie":
      return {
        ...base,
        tooltip: { trigger: "item" },
        legend: { show: showLegend, bottom: 0 },
        series: [
          {
            type: "pie",
            radius: "60%",
            data: [
              { value: 335, name: "直接访问" },
              { value: 310, name: "邮件营销" },
              { value: 234, name: "联盟广告" },
              { value: 135, name: "视频广告" },
              { value: 1548, name: "搜索引擎" },
            ],
            label: { show: showLabel },
          },
        ],
      };

    case "radar":
      return {
        ...base,
        tooltip: {},
        legend: { show: showLegend, bottom: 0 },
        radar: {
          indicator: [
            { name: "销售", max: 6500 },
            { name: "管理", max: 16000 },
            { name: "信息技术", max: 30000 },
            { name: "客服", max: 38000 },
            { name: "研发", max: 52000 },
            { name: "市场", max: 25000 },
          ],
        },
        series: [
          {
            type: "radar",
            data: [
              { value: [4200, 3000, 20000, 35000, 50000, 18000], name: "预算分配" },
              { value: [5000, 14000, 28000, 31000, 42000, 21000], name: "实际开销" },
            ],
          },
        ],
      };

    case "heatmap":
      return {
        ...base,
        tooltip: { position: "top" },
        grid: { height: "50%", top: "10%" },
        xAxis: {
          type: "category",
          data: ["12a", "1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a"],
        },
        yAxis: {
          type: "category",
          data: ["周六", "周五", "周四", "周三", "周二", "周一", "周日"],
        },
        visualMap: {
          min: 0,
          max: 10,
          calculable: true,
          orient: "horizontal",
          left: "center",
          bottom: "0%",
        },
        series: [
          {
            type: "heatmap",
            data: (() => {
              const d: number[][] = [];
              for (let i = 0; i < 7; i++) {
                for (let j = 0; j < 12; j++) {
                  d.push([j, i, Math.round(Math.random() * 10)]);
                }
              }
              return d;
            })(),
            label: { show: showLabel },
          },
        ],
      };

    default:
      return {
        ...base,
        tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: ["1月", "2月", "3月", "4月", "5月", "6月"] },
        yAxis: { type: "value" },
        series: [{ type: "bar" as const, data: [120, 200, 150, 80, 70, 110] }],
      };
  }
}

export default function ChartDesignerPage() {
  const { datasets } = useDataStore();
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const [chartType, setChartType] = useState<string>("bar");
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [showLabel, setShowLabel] = useState(true);
  const [showLegend, setShowLegend] = useState(true);

  useEffect(() => {
    if (chartRef.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }
    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartInstance.current) return;
    const option = buildChartOption(chartType, showLabel, showLegend);
    chartInstance.current.setOption(option, true);
  }, [chartType, showLabel, showLegend]);

  const handleExportImage = () => {
    if (chartInstance.current) {
      const url = chartInstance.current.getDataURL({ type: "png", pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = "chart.png";
      link.href = url;
      link.click();
    }
  };

  const handleSave = () => {
    // TODO: 保存图表配置到SQLite
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
          <Button icon={<DownloadOutlined />} onClick={handleExportImage}>
            导出图片
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
            保存图表
          </Button>
        </div>
      </div>

      <Row gutter={16}>
        <Col span={6}>
          <Card title="图表配置" size="small">
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4 }}>数据源</label>
              <Select
                style={{ width: "100%" }}
                placeholder="选择数据集"
                value={selectedDataset || undefined}
                onChange={setSelectedDataset}
              >
                {datasets.map((ds) => (
                  <Option key={ds.id} value={ds.id}>
                    {ds.name}
                  </Option>
                ))}
              </Select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4 }}>图表类型</label>
              <Select style={{ width: "100%" }} value={chartType} onChange={setChartType}>
                <Option value="bar">柱状图</Option>
                <Option value="line">折线图</Option>
                <Option value="scatter">散点图</Option>
                <Option value="pie">饼图</Option>
                <Option value="radar">雷达图</Option>
                <Option value="heatmap">热力图</Option>
              </Select>
            </div>

            <div style={{ marginBottom: 16 }}>
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
        </Col>

        <Col span={18}>
          <Card bodyStyle={{ padding: 0 }}>
            <div
              ref={chartRef}
              style={{ width: "100%", height: 500 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
