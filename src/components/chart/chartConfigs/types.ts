import type { EChartsOption } from 'echarts';
import type { ChartTypeKind, ChartSeries } from '@/types/chart';

/** 标注配置 */
export interface AnnotationConfig {
  /** 标注最大值 */
  markMax: boolean;
  /** 标注最小值 */
  markMin: boolean;
  /** 显示平均值线 */
  markAverage: boolean;
  /** 自定义目标线值（可选，填写后添加水平目标线） */
  markTarget?: number;
  /** 预警区间下界（可选） */
  warnRangeLower?: number;
  /** 预警区间上界（可选） */
  warnRangeUpper?: number;
}

/** 图表配置生成器的统一输入接口 */
export interface ChartGeneratorInput {
  title: string;
  chartType: ChartTypeKind;
  categories: string[];
  series: ChartSeries[];
  showLabel: boolean;
  showLegend: boolean;
  xAxisTitle?: string;
  yAxisTitle?: string;
  /** 标注配置 */
  annotations?: AnnotationConfig;
}

/** 图表配置生成器函数类型 */
export type ChartGeneratorFn = (input: ChartGeneratorInput) => EChartsOption;
