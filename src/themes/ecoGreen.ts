import type { EChartsTheme } from './types';

/** 环保绿主题 — 主色 #27AE60，适用于环保/可持续发展报告 */
export const ecoGreenTheme: EChartsTheme = {
  color: ['#27AE60', '#6BCB77', '#1B7A3D', '#F4A261', '#48BFE3', '#FFD166', '#EF476F', '#9CA3AF'],
  backgroundColor: '#FFFFFF',
  textStyle: {
    color: '#1B4332',
    fontFamily: '"Microsoft YaHei", "SimSun", "Noto Serif SC", "Georgia", serif',
    fontSize: 12,
  },
  title: {
    textStyle: { color: '#27AE60', fontWeight: 'bold', fontSize: 18 },
    subtextStyle: { color: '#4A7C59', fontSize: 14 },
  },
  legend: { textStyle: { color: '#1B4332' } },
  tooltip: {
    backgroundColor: 'rgba(27, 67, 50, 0.9)',
    borderColor: '#27AE60',
    borderWidth: 1,
    textStyle: { color: '#FFFFFF' },
    axisPointer: { lineStyle: { color: '#27AE60', type: 'dashed' }, crossStyle: { color: '#27AE60' } },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#1B4332' } },
    axisLabel: { color: '#1B4332' },
    axisTick: { lineStyle: { color: '#1B4332' } },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: '#1B4332' } },
    axisLabel: { color: '#1B4332' },
    axisTick: { lineStyle: { color: '#1B4332' } },
    splitLine: { lineStyle: { color: '#D4EDDA' } },
    splitArea: { show: true, areaStyle: { color: ['#F0FFF4', '#FFFFFF'] } },
  },
};
