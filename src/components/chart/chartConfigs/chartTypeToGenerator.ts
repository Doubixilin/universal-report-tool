import type { ChartTypeKind } from '@/types/chart';
import type { ChartGeneratorFn } from './types';
import {
  createBarOption,
  createLineOption,
  createPieOption,
  createDoughnutOption,
  createScatterOption,
  createBubbleOption,
  createRadarOption,
  createAreaOption,
  createLiquidFillOption,
  createPictorialBarOption,
  createCandlestickOption,
  createWordCloudOption,
  createGraphOption,
  createThemeRiverOption,
  createCustomOption,
} from './index';

/** ChartTypeKind -> 配置生成器映射 */
export const CHART_GENERATORS: Record<ChartTypeKind, ChartGeneratorFn> = {
  barChart: createBarOption,
  lineChart: createLineOption,
  pieChart: createPieOption,
  areaChart: createAreaOption,
  scatterChart: createScatterOption,
  radarChart: createRadarOption,
  doughnutChart: createDoughnutOption,
  bubbleChart: createBubbleOption,
  liquidFillChart: createLiquidFillOption,
  pictorialBarChart: createPictorialBarOption,
  candlestickChart: createCandlestickOption,
  wordCloudChart: createWordCloudOption,
  graphChart: createGraphOption,
  themeRiverChart: createThemeRiverOption,
  customChart: createCustomOption,
};

/** 图表类型显示信息（用于选择器分组） */
export interface ChartTypeInfo {
  key: ChartTypeKind;
  label: string;
}

export interface ChartTypeGroup {
  label: string;
  options: ChartTypeInfo[];
}

export const CHART_TYPE_GROUPS: ChartTypeGroup[] = [
  {
    label: '基础图表',
    options: [
      { key: 'barChart', label: '柱状图' },
      { key: 'lineChart', label: '折线图' },
      { key: 'pieChart', label: '饼图' },
      { key: 'scatterChart', label: '散点图' },
      { key: 'areaChart', label: '面积图' },
      { key: 'doughnutChart', label: '环形图' },
      { key: 'bubbleChart', label: '气泡图' },
    ],
  },
  {
    label: '多维分析',
    options: [
      { key: 'radarChart', label: '雷达图' },
      { key: 'liquidFillChart', label: '水球图' },
    ],
  },
  {
    label: '数据可视化',
    options: [
      { key: 'pictorialBarChart', label: '象形柱图' },
      { key: 'wordCloudChart', label: '词云图' },
    ],
  },
  {
    label: '财务分析',
    options: [
      { key: 'candlestickChart', label: 'K 线图' },
    ],
  },
  {
    label: '关系与时序',
    options: [
      { key: 'graphChart', label: '关系图' },
      { key: 'themeRiverChart', label: '主题河流图' },
    ],
  },
  {
    label: '高级',
    options: [
      { key: 'customChart', label: '自定义系列' },
    ],
  },
];

/** 判断是否支持 Excel 导出（仅前 8 种基础图表） */
export const EXPORTABLE_CHARTS: Set<ChartTypeKind> = new Set([
  'barChart', 'lineChart', 'pieChart', 'areaChart',
  'scatterChart', 'radarChart', 'doughnutChart', 'bubbleChart',
]);
