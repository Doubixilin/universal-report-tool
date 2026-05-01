import type { EChartsTheme } from './types';

/** 党建红主题 — 主色 #C41E24，适用于党政报告 */
export const partyRedTheme: EChartsTheme = {
  color: ['#C41E24', '#E8464A', '#8B1A1A', '#F09532', '#4A5568', '#D4A574', '#B83232', '#718096'],
  backgroundColor: '#FFFFFF',
  textStyle: {
    color: '#2D3748',
    fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif',
    fontSize: 12,
  },
  title: {
    textStyle: { color: '#C41E24', fontWeight: 'bold', fontSize: 18 },
    subtextStyle: { color: '#4A5568', fontSize: 14 },
  },
  legend: { textStyle: { color: '#2D3748' } },
  tooltip: {
    backgroundColor: 'rgba(45, 55, 72, 0.9)',
    borderColor: '#C41E24',
    borderWidth: 1,
    textStyle: { color: '#FFFFFF' },
    axisPointer: { lineStyle: { color: '#C41E24', type: 'dashed' }, crossStyle: { color: '#C41E24' } },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#2D3748' } },
    axisLabel: { color: '#2D3748' },
    axisTick: { lineStyle: { color: '#2D3748' } },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: '#2D3748' } },
    axisLabel: { color: '#2D3748' },
    axisTick: { lineStyle: { color: '#2D3748' } },
    splitLine: { lineStyle: { color: '#E2E8F0' } },
    splitArea: { show: false },
  },
};
