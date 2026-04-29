import type { AnnotationConfig } from './types';

/**
 * 根据标注配置为 ECharts series 添加 markPoint / markLine / markArea
 */
export function applyAnnotations(
  annotations: AnnotationConfig | undefined
): {
  markPoint?: Record<string, unknown>;
  markLine?: Record<string, unknown>;
  markArea?: Record<string, unknown>;
} {
  if (!annotations) return {};

  const markPoints: Record<string, unknown>[] = [];
  const markLines: Record<string, unknown>[] = [];
  const markAreas: { data: Record<string, unknown>[] }[] = [];

  // markPoint
  if (annotations.markMax) {
    markPoints.push({ type: 'max', name: '最大值', symbolSize: 50, label: { formatter: '最大值:\n{c}', position: 'inside' } });
  }
  if (annotations.markMin) {
    markPoints.push({ type: 'min', name: '最小值', symbolSize: 50, label: { formatter: '最小值:\n{c}', position: 'inside' } });
  }

  // markLine
  if (annotations.markAverage) {
    markLines.push({ type: 'average', name: '平均值', label: { formatter: '平均值: {c}' } });
  }
  if (typeof annotations.markTarget === 'number') {
    markLines.push({ yAxis: annotations.markTarget, name: '目标线', label: { formatter: `目标: ${annotations.markTarget}` }, lineStyle: { color: '#FF0000', type: 'dashed' } });
  }

  // markArea
  const hasWarnRange = typeof annotations.warnRangeLower === 'number' && typeof annotations.warnRangeUpper === 'number';
  if (hasWarnRange) {
    markAreas.push({
      data: [
        { yAxis: annotations.warnRangeLower as number, name: '预警区间', itemStyle: { color: 'rgba(255, 0, 0, 0.05)' } },
        { yAxis: annotations.warnRangeUpper as number },
      ],
    });
  }

  const result: Record<string, unknown> = {};
  if (markPoints.length > 0) {
    result.markPoint = { data: markPoints };
  }
  if (markLines.length > 0) {
    result.markLine = { data: markLines };
  }
  if (markAreas.length > 0) {
    result.markArea = { data: markAreas[0].data };
  }

  return result;
}
