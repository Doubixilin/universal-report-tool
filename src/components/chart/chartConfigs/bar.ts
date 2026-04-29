import type { EChartsOption } from 'echarts';
import type { ChartGeneratorInput } from './types';
import type { ChartTypeKind } from '@/types/chart';
import { applyAnnotations } from './annotation';

/** ChartTypeKind → ECharts series type 映射 */
function toEchartsType(kind: ChartTypeKind): { type: string; areaStyle?: object } {
  switch (kind) {
    case 'barChart': return { type: 'bar' };
    case 'lineChart': return { type: 'line' };
    case 'areaChart': return { type: 'line', areaStyle: {} };
    case 'scatterChart': return { type: 'scatter' };
    default: return { type: 'bar' };
  }
}

/** 柱状图配置（同时支持复合图表） */
export function createBarOption(input: ChartGeneratorInput): EChartsOption {
  const annotations = applyAnnotations(input.annotations);
  const hasCombo = input.seriesTypes && Object.keys(input.seriesTypes).length > 0;

  return {
    title: { text: input.title, left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { show: input.showLegend, bottom: 0 },
    xAxis: {
      type: 'category',
      data: input.categories,
      name: input.xAxisTitle,
    },
    yAxis: {
      type: 'value',
      name: input.yAxisTitle,
    },
    series: input.series.map((s) => {
      // 复合图表：根据 seriesTypes 决定每个系列的类型
      const seriesKind = hasCombo ? (input.seriesTypes![s.name] || input.chartType) : input.chartType;
      const { type, areaStyle } = toEchartsType(seriesKind);

      return {
        type: type as 'bar' | 'line' | 'scatter',
        name: s.name,
        data: s.values,
        itemStyle: s.color ? { color: s.color } : undefined,
        lineStyle: s.color && (type === 'line') ? { color: s.color } : undefined,
        areaStyle,
        label: { show: input.showLabel },
        ...annotations,
      };
    }),
  };
}
