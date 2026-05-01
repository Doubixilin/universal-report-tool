import 'echarts-liquidfill';
import type { EChartsOption } from 'echarts';
import type { ChartGeneratorInput } from './types';

/** 水球图配置 — 取 series 第一个值作为百分比 */
export function createLiquidFillOption(input: ChartGeneratorInput): EChartsOption {
  const val = input.series[0]?.values[0] ?? 50;
  const pct = Math.min(Math.max(val / 100, 0), 1); // 归一化到 0-1
  const color = input.series[0]?.color || '#156ACF';

  return {
    title: { text: input.title, left: 'center', top: '5%' },
    series: [{
      type: 'liquidFill',
      data: [pct, pct * 0.8, pct * 0.6],
      radius: '70%',
      center: ['50%', '55%'],
      shape: 'circle',
      amplitude: 15,
      waveLength: '80%',
      period: 2000,
      direction: 'right',
      waveAnimation: true,
      color: [color, `${color}88`, `${color}44`],
      outline: {
        show: true,
        borderDistance: 8,
        itemStyle: { borderColor: color, borderWidth: 4 },
      },
      backgroundStyle: { color: '#f0f4f8' },
      label: {
        show: input.showLabel,
        formatter: () => `${(pct * 100).toFixed(1)}%`,
        fontSize: 48,
        fontWeight: 'bold',
        color,
      },
    }],
  } as EChartsOption;
}
