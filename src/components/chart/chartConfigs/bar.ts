import type { EChartsOption } from 'echarts';
import type { ChartGeneratorInput } from './types';
import { applyAnnotations } from './annotation';

/** 柱状图配置 */
export function createBarOption(input: ChartGeneratorInput): EChartsOption {
  const annotations = applyAnnotations(input.annotations);

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
    series: input.series.map((s) => ({
      type: 'bar' as const,
      name: s.name,
      data: s.values,
      itemStyle: s.color ? { color: s.color } : undefined,
      label: { show: input.showLabel },
      ...annotations,
    })),
  };
}
