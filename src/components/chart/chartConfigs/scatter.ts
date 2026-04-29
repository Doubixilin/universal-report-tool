import type { EChartsOption } from 'echarts';
import type { ChartGeneratorInput } from './types';
import { applyAnnotations } from './annotation';

export function createScatterOption(input: ChartGeneratorInput): EChartsOption {
  const annotations = applyAnnotations(input.annotations);

  return {
    title: { text: input.title, left: 'center' },
    tooltip: { trigger: 'item' },
    xAxis: { type: 'value', name: input.xAxisTitle },
    yAxis: { type: 'value', name: input.yAxisTitle },
    series: input.series.map((s) => ({
      type: 'scatter' as const,
      name: s.name,
      data: input.categories.map((_, i) => [i + 1, s.values[i] ?? Math.random() * 10]),
      itemStyle: s.color ? { color: s.color } : undefined,
      ...annotations,
    })),
  };
}

export function createBubbleOption(input: ChartGeneratorInput): EChartsOption {
  const scatterData = input.series[0]?.values.map((v, i) => {
    const x = i + 1;
    const y = v;
    const size = (input.series[1]?.values[i] ?? Math.random() * 50) / 5;
    return [x, y, size];
  }) || [];

  return {
    title: { text: input.title, left: 'center' },
    tooltip: { trigger: 'item' },
    xAxis: { type: 'value', name: input.xAxisTitle },
    yAxis: { type: 'value', name: input.yAxisTitle },
    series: [{
      type: 'scatter',
      data: scatterData,
      symbolSize: (data: any) => data[2],
    }],
  };
}
