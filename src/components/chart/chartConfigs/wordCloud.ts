import 'echarts-wordcloud';
import type { EChartsOption } from 'echarts';
import type { ChartGeneratorInput } from './types';

/** 词云图配置 — categories 作为关键词，series 值作为权重 */
export function createWordCloudOption(input: ChartGeneratorInput): EChartsOption {
  const data = input.categories.map((name, i) => ({
    name,
    value: input.series[0]?.values[i] ?? Math.floor(Math.random() * 100),
  }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 100); // 限制 100 个词

  return {
    title: { text: input.title, left: 'center' },
    tooltip: { show: true },
    series: [{
      type: 'wordCloud',
      shape: 'circle',
      left: 'center',
      top: 'center',
      width: '80%',
      height: '80%',
      sizeRange: [12, 80],
      rotationRange: [-90, 90],
      rotationStep: 45,
      gridSize: 8,
      drawOutOfBound: false,
      textStyle: {
        fontFamily: 'sans-serif',
        fontWeight: 'bold',
        color: () => `hsl(${Math.random() * 360}, 70%, 50%)`,
      },
      emphasis: {
        focus: 'self',
        textStyle: { shadowBlur: 10, shadowColor: '#333' } as any,
      },
      data,
    }],
  } as EChartsOption;
}
