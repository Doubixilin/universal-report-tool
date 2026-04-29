import type { EChartsOption } from 'echarts';
import type { ChartGeneratorInput } from './types';

/** 自定义系列 — 柱状图 + 误差线 */
export function createCustomOption(input: ChartGeneratorInput): EChartsOption {
  const values = input.series[0]?.values || [];
  const data = values.map((v, i) => ({
    value: [i, Math.max(0, v - 10), Math.max(0, v + 10)],
    name: input.categories[i],
    baseValue: v,
  }));

  return {
    title: { text: input.title, left: 'center' },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0];
        return p?.name
          ? `${p.name}<br/>值: ${p.data.baseValue}<br/>范围: ${p.data.value[1]} ~ ${p.data.value[2]}`
          : '';
      },
    },
    xAxis: {
      type: 'category',
      data: input.categories,
      name: input.xAxisTitle,
    },
    yAxis: {
      type: 'value',
      name: input.yAxisTitle,
    },
    series: [{
      type: 'custom',
      name: '误差范围',
      data,
      renderItem: (_params: any, api: any) => {
        const x = api.value(0);
        const y0 = api.value(1);
        const y1 = api.value(2);
        const left = api.coord([x, y0]);
        const right = api.coord([x, y1]);
        const width = 20;
        return {
          type: 'group',
          children: [
            {
              type: 'rect',
              shape: { x: left[0] - width / 2, y: left[1], width, height: right[1] - left[1] },
              style: api.style(),
            },
            {
              type: 'line',
              shape: { x1: left[0], y1: left[1], x2: left[0], y2: right[1] },
              style: { stroke: '#333', lineWidth: 1 },
            },
          ],
        };
      },
    }],
  };
}
