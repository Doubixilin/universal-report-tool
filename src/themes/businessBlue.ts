import type { EChartsTheme } from './types';

/** 商务蓝主题 — 主色 #1E6FDC，适用于商业报告 */
export const businessBlueTheme: EChartsTheme = {
  color: ['#1E6FDC', '#4DA3FF', '#0D47A1', '#FF8C42', '#36CFC9', '#73D13D', '#F5222D', '#BDBDBD'],
  backgroundColor: '#FFFFFF',
  textStyle: {
    color: '#333333',
    fontFamily: '"Microsoft YaHei", "Arial", sans-serif',
    fontSize: 12,
  },
  title: {
    textStyle: { color: '#1E6FDC', fontWeight: 'bold', fontSize: 18 },
    subtextStyle: { color: '#666666', fontSize: 14 },
  },
  legend: { textStyle: { color: '#333333' } },
  tooltip: {
    backgroundColor: 'rgba(51, 51, 51, 0.9)',
    borderColor: '#1E6FDC',
    borderWidth: 1,
    textStyle: { color: '#FFFFFF' },
    axisPointer: { lineStyle: { color: '#1E6FDC', type: 'dashed' }, crossStyle: { color: '#1E6FDC' } },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#333333' } },
    axisLabel: { color: '#333333' },
    axisTick: { lineStyle: { color: '#333333' } },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: '#333333' } },
    axisLabel: { color: '#333333' },
    axisTick: { lineStyle: { color: '#333333' } },
    splitLine: { lineStyle: { color: '#E8E8E8' } },
    splitArea: { show: false },
  },
};
