import type { EChartsOption } from 'echarts';
import type { ChartGeneratorInput } from './types';

/** 关系图（力导向布局） */
export function createGraphOption(input: ChartGeneratorInput): EChartsOption {
  const nodes = input.categories.map((name, i) => ({
    name,
    symbolSize: Math.max((input.series[0]?.values[i] ?? 50) / 5, 10),
    itemStyle: { color: input.series[0]?.color || '#5470c6' },
    label: { show: true },
  }));

  const links = nodes.map((_, i) => ({
    source: i,
    target: (i + 1) % nodes.length,
  }));

  return {
    title: { text: input.title, left: 'center' },
    tooltip: {},
    series: [{
      type: 'graph',
      layout: 'force',
      data: nodes,
      links,
      roam: true,
      force: { repulsion: 300, gravity: 0.1, edgeLength: 100 },
      label: { show: input.showLabel },
      lineStyle: { color: 'source', curveness: 0.3 },
    }],
  };
}
