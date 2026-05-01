import type { EChartsOption } from 'echarts';
import type { ChartGeneratorInput } from './types';
import { createLineOption } from './line';

export function createHeatmapOption(input: ChartGeneratorInput): EChartsOption {
  const data: number[][] = [];
  for (let i = 0; i < input.categories.length; i++) {
    for (let j = 0; j < input.series.length; j++) {
      data.push([j, i, input.series[j]?.values[i] ?? 0]);
    }
  }
  const maxVal = Math.max(...data.map((d) => d[2]), 10);

  return {
    title: { text: input.title, left: 'center' },
    tooltip: { position: 'top' },
    grid: { height: '50%', top: '10%' },
    xAxis: {
      type: 'category',
      data: input.series.map((s) => s.name),
    },
    yAxis: {
      type: 'category',
      data: input.categories,
    },
    visualMap: {
      min: 0,
      max: maxVal,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
    },
    series: [{
      type: 'heatmap',
      data,
      label: { show: input.showLabel },
    }],
  };
}

export function createAreaOption(input: ChartGeneratorInput): EChartsOption {
  const lineOption = JSON.parse(JSON.stringify(createLineOption(input)));
  const series = (lineOption.series as any[]) || [];
  series.forEach((s) => { s.areaStyle = {}; });
  return lineOption;
}
