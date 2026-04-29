import type { EChartsOption } from 'echarts';
import type { ChartGeneratorInput } from './types';
import { applyAnnotations } from './annotation';

export function createRadarOption(input: ChartGeneratorInput): EChartsOption {
  const annotations = applyAnnotations(input.annotations);
  const maxVal = Math.max(
    ...input.series.flatMap((s) => s.values),
    100
  );

  return {
    title: { text: input.title, left: 'center' },
    tooltip: {},
    legend: { show: input.showLegend, bottom: 0 },
    radar: {
      indicator: input.categories.map((name) => ({ name, max: maxVal })),
    },
    series: input.series.map((s) => ({
      type: 'radar' as const,
      name: s.name,
      data: [{ value: s.values, name: s.name }],
      itemStyle: s.color ? { color: s.color } : undefined,
      ...annotations,
    })),
  };
}
