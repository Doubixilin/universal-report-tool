// ============================================================
// 图表类型定义 -- 与 Rust 后端 ChartDataRequest 严格对应
// 修改此文件后需同步更新 Rust 端的 chart_data.rs
// ============================================================

/** 图表类型（与 Rust 端 ChartTypeKind 对应） */
export type ChartTypeKind =
  // 基础图表（支持 Rust Excel 导出）
  | 'barChart'      // 柱状图
  | 'lineChart'     // 折线图
  | 'pieChart'      // 饼图
  | 'areaChart'     // 面积图
  | 'scatterChart'  // 散点图
  | 'radarChart'    // 雷达图
  | 'doughnutChart' // 环形图
  | 'bubbleChart'   // 气泡图
  // 扩展图表（仅 ECharts 前端渲染）
  | 'liquidFillChart'    // 水球图
  | 'pictorialBarChart'  // 象形柱图
  | 'candlestickChart'   // K 线图
  | 'wordCloudChart'     // 词云图
  | 'graphChart'         // 关系图
  | 'themeRiverChart'    // 主题河流图
  | 'customChart';       // 自定义系列

/** 单个数据系列 */
export interface ChartSeries {
  /** 系列名称（显示在图例中） */
  name: string;
  /** 数据值数组 */
  values: number[];
  /** 系列颜色（可选，Hex 格式如 "#C41E24"） */
  color?: string;
}

/** 图表数据请求体（前端 -> 后端） */
export interface ChartDataRequest {
  /** 图表标题 */
  title: string;
  /** 图表类型 */
  chartType: ChartTypeKind;
  /** X 轴分类标签 */
  categories: string[];
  /** 数据系列数组 */
  series: ChartSeries[];
  /** X 轴标题（可选） */
  xAxisTitle?: string;
  /** Y 轴标题（可选） */
  yAxisTitle?: string;
  /** 图表宽度（EMU 单位，可选） */
  width?: number;
  /** 图表高度（EMU 单位，可选） */
  height?: number;
}

/** 图表生成响应（后端 -> 前端） */
export interface ChartGenerationResponse {
  /** 是否成功 */
  success: boolean;
  /** 消息 */
  message: string;
}

/** 图表配置（前端状态管理用） */
export interface ChartConfig {
  id: string;
  datasetId: string;
  title: string;
  chartType: ChartTypeKind;
  xAxisField: string;
  yAxisFields: string[];
  seriesNames: string[];
  colors: string[];
  /** 运行时图表数据（从 config_json 恢复或编辑器填充） */
  xAxisTitle?: string;
  yAxisTitle?: string;
  categories?: string[];
  series?: ChartSeries[];
  createdAt: string;
  updatedAt: string;
}

/** 主题类型 */
export interface ChartTheme {
  id: string;
  name: string;
  description?: string;
  category: 'built-in' | 'custom';
  themeJson: string;     // 序列化后的 EChartsTheme
  previewImage?: string; // base64 预览图
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 导出格式 */
export type ExportFormat = 'png' | 'svg' | 'pdf' | 'excel';

/** 导出选项 */
export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  pixelRatio?: number;       // PNG 导出用
  backgroundColor?: string;  // PNG/SVG 导出用
  orientation?: 'portrait' | 'landscape'; // PDF 导出用
}

/** easy-template-x Chart 插件数据格式（内部转换用） */
export interface EasyTemplateXChartData {
  _type: 'chart';
  title?: string;
  categories: { names: string[] | number[] };
  series: Array<{
    name?: string;
    values: number[];
    color?: string;
  }>;
}
