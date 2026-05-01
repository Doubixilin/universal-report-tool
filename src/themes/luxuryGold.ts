import type { EChartsTheme } from './types';

/** 高端金主题 — 主色 #B8860B，适用于金融/高端报告 */
export const luxuryGoldTheme: EChartsTheme = {
  color: ['#B8860B', '#DAA520', '#8B6914', '#CD853F', '#C0C0C0', '#F5DEB3', '#800020', '#4A4A4A'],
  backgroundColor: '#FFFFFF',
  textStyle: {
    color: '#4A4A4A',
    fontFamily: '"Microsoft YaHei", "Georgia", "Noto Serif SC", "STSong", serif',
    fontSize: 12,
  },
  title: {
    textStyle: { color: '#B8860B', fontWeight: 'bold', fontSize: 18 },
    subtextStyle: { color: '#6B6B6B', fontSize: 14 },
  },
  legend: { textStyle: { color: '#4A4A4A' } },
  tooltip: {
    backgroundColor: 'rgba(74, 74, 74, 0.9)',
    borderColor: '#B8860B',
    borderWidth: 1,
    textStyle: { color: '#FFFFFF' },
    axisPointer: { lineStyle: { color: '#B8860B', type: 'dashed' }, crossStyle: { color: '#B8860B' } },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#4A4A4A' } },
    axisLabel: { color: '#4A4A4A' },
    axisTick: { lineStyle: { color: '#4A4A4A' } },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: '#4A4A4A' } },
    axisLabel: { color: '#4A4A4A' },
    axisTick: { lineStyle: { color: '#4A4A4A' } },
    splitLine: { lineStyle: { color: '#E8E0D0' } },
    splitArea: { show: true, areaStyle: { color: ['#FFFDF5', '#FFFFFF'] } },
  },
};
