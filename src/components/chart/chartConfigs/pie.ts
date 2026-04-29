import type { EChartsOption } from 'echarts';
import type { ChartGeneratorInput } from './types';

export function createPieOption(input: ChartGeneratorInput): EChartsOption {
  const data = input.categories.map((name, i) => ({
    name,
    value: input.series[0]?.values[i] ?? Math.random() * 100,
  }));

  return {
    title: { text: input.title, left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { show: input.showLegend, bottom: 0 },
    series: [{
      type: 'pie',
      radius: '60%',
      data,
      label: { show: input.showLabel },
    }],
  };
}

export function createDoughnutOption(input: ChartGeneratorInput): EChartsOption {
  const pieOption = createPieOption(input) as EChartsOption;
  const series = (pieOption.series as any[])?.[0];
  if (series) series.radius = ['40%', '70%'];
  return pieOption;
}
