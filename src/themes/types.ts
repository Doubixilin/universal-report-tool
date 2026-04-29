/** ECharts 主题类型定义 */
export interface EChartsTheme {
  /** 颜色调色板 */
  color: string[];
  /** 背景色 */
  backgroundColor?: string;
  /** 是否为深色模式 */
  darkMode?: boolean;
  /** 全局文字样式 */
  textStyle?: {
    color?: string;
    fontFamily?: string;
    fontSize?: number;
  };
  /** 标题样式 */
  title?: {
    textStyle?: Record<string, unknown>;
    subtextStyle?: Record<string, unknown>;
  };
  /** 图例样式 */
  legend?: {
    textStyle?: Record<string, unknown>;
  };
  /** 提示框样式 */
  tooltip?: {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    textStyle?: Record<string, unknown>;
    axisPointer?: Record<string, unknown>;
  };
  /** 数值轴样式 */
  valueAxis?: Record<string, unknown>;
  /** 类目轴样式 */
  categoryAxis?: Record<string, unknown>;
  /** 坐标轴公共样式 */
  axisLine?: Record<string, unknown>;
  axisLabel?: Record<string, unknown>;
  axisTick?: Record<string, unknown>;
  splitLine?: Record<string, unknown>;
  splitArea?: Record<string, unknown>;
  timeline?: Record<string, unknown>;
  /** 系列默认样式 */
  series?: Record<string, unknown>;
}
