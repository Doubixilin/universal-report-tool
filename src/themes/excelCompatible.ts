import type { EChartsTheme } from './types';

/** Excel 兼容主题 — 配色接近 Office 默认，确保导出一致性 */
export const excelCompatibleTheme: EChartsTheme = {
  color: ['#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5', '#70AD47', '#264478', '#9E480E'],
  backgroundColor: '#FFFFFF',
  textStyle: {
    color: '#000000',
    fontFamily: 'Calibri, "Microsoft YaHei", Arial, sans-serif',
    fontSize: 11,
  },
  title: {
    textStyle: { color: '#000000', fontWeight: 'bold', fontSize: 16 },
    subtextStyle: { color: '#595959', fontSize: 12 },
  },
  legend: { textStyle: { color: '#000000' } },
  tooltip: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderColor: '#CCCCCC',
    borderWidth: 1,
    textStyle: { color: '#FFFFFF' },
    axisPointer: { lineStyle: { color: '#999999', type: 'dashed' }, crossStyle: { color: '#999999' } },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#666666' } },
    axisLabel: { color: '#666666' },
    axisTick: { lineStyle: { color: '#666666' } },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: '#666666' } },
    axisLabel: { color: '#666666' },
    axisTick: { lineStyle: { color: '#666666' } },
    splitLine: { lineStyle: { color: '#E0E0E0' } },
    splitArea: { show: false },
  },
};
