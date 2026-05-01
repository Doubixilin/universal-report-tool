import type { EChartsTheme } from './types';

/** 科技紫主题 — 主色 #6C5CE7，适用于科技/创新报告 */
export const techPurpleTheme: EChartsTheme = {
  color: ['#6C5CE7', '#A29BFE', '#4A00E0', '#F093FB', '#00CEC9', '#FFEAA7', '#FD79A8', '#636E72'],
  backgroundColor: '#FFFFFF',
  textStyle: {
    color: '#2D3436',
    fontFamily: '"Microsoft YaHei", "Consolas", "Fira Code", "Courier New", monospace',
    fontSize: 12,
  },
  title: {
    textStyle: { color: '#6C5CE7', fontWeight: 'bold', fontSize: 18 },
    subtextStyle: { color: '#636E72', fontSize: 14 },
  },
  legend: { textStyle: { color: '#2D3436' } },
  tooltip: {
    backgroundColor: 'rgba(45, 52, 54, 0.9)',
    borderColor: '#6C5CE7',
    borderWidth: 1,
    textStyle: { color: '#FFFFFF' },
    axisPointer: { lineStyle: { color: '#6C5CE7', type: 'dashed' }, crossStyle: { color: '#6C5CE7' } },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#2D3436' } },
    axisLabel: { color: '#2D3436' },
    axisTick: { lineStyle: { color: '#2D3436' } },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: '#2D3436' } },
    axisLabel: { color: '#2D3436' },
    axisTick: { lineStyle: { color: '#2D3436' } },
    splitLine: { lineStyle: { color: '#E5E5E5' } },
    splitArea: { show: false },
  },
};
