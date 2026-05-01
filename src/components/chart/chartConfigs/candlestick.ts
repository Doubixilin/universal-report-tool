import type { EChartsOption } from 'echarts';
import type { ChartGeneratorInput } from './types';

/** K 线图配置 — 将 series 值映射为 OHLC 数据 */
export function createCandlestickOption(input: ChartGeneratorInput): EChartsOption {
  const data = input.categories.map((_, i) => {
    const vals = input.series[0]?.values || [];
    const value = vals[i] ?? 100;
    const open = value;
    const close = vals[i + 1] ?? value;
    const low = Math.min(open, close) - 5;
    const high = Math.max(open, close) + 5;
    return [open, close, low, high];
  });

  return {
    title: { text: input.title, left: 'center' },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0];
        if (!p || !p.data) return p?.name || '';
        const [open, close, low, high] = p.data;
        return `${p.name}<br/>开: ${open.toFixed(1)}<br/>收: ${close.toFixed(1)}<br/>低: ${low.toFixed(1)}<br/>高: ${high.toFixed(1)}`;
      },
    },
    xAxis: { data: input.categories, axisLine: { lineStyle: { color: '#8392A5' } } },
    yAxis: { scale: true, axisLine: { lineStyle: { color: '#8392A5' } }, splitLine: { show: true } },
    grid: { bottom: 80 },
    dataZoom: [
      { type: 'inside', start: 50, end: 100 },
      { show: true, type: 'slider', top: '90%', start: 50, end: 100 },
    ],
    series: [{
      type: 'candlestick',
      data,
      itemStyle: {
        color: '#EB5454',
        color0: '#47B262',
        borderColor: '#EB5454',
        borderColor0: '#47B262',
      },
    }],
  };
}
