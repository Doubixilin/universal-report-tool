import type { EChartsOption } from 'echarts';
import type { ChartGeneratorInput } from './types';

/** 象形柱图配置 */
export function createPictorialBarOption(input: ChartGeneratorInput): EChartsOption {
  return {
    title: { text: input.title, left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { show: input.showLegend, bottom: 0 },
    xAxis: {
      type: 'category',
      data: input.categories,
      axisLine: { lineStyle: { color: '#ccc' } },
    },
    yAxis: {
      type: 'value',
      splitLine: { show: false },
    },
    series: input.series.map((s) => ({
      type: 'pictorialBar' as const,
      name: s.name,
      data: s.values,
      symbol: 'circle',
      symbolSize: ['100%', 20],
      itemStyle: { color: s.color },
    })),
  };
}
