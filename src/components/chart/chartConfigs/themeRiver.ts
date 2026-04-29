import type { EChartsOption } from 'echarts';
import type { ChartGeneratorInput } from './types';

/** 主题河流图 — 展示时序数据趋势 */
export function createThemeRiverOption(input: ChartGeneratorInput): EChartsOption {
  const data = input.categories.flatMap((date, i) =>
    input.series.map((s) => [date, s.values[i] ?? 0, s.name])
  );

  return {
    title: { text: input.title, left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { show: input.showLegend, bottom: 0 },
    singleAxis: {
      type: 'category',
      data: input.categories,
      bottom: 60,
      axisLabel: { interval: 'auto' },
    },
    series: [{
      type: 'themeRiver',
      data: data as any,
      label: { show: input.showLabel },
    }],
  } as EChartsOption;
}
