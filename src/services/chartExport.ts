// ============================================================
// 图表导出服务 -- 支持 PNG / SVG / PDF 多格式
// ============================================================

import * as echarts from 'echarts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface PNGExportOptions {
  filename?: string;
  pixelRatio?: number;
  backgroundColor?: string;
}

export interface SVGExportOptions {
  filename?: string;
  useViewBox?: boolean;
}

export interface PDFExportOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'a3' | 'letter';
}

/**
 * 导出高清 PNG
 */
export function exportPNG(
  chart: echarts.ECharts,
  options: PNGExportOptions = {}
): void {
  const {
    filename = 'chart',
    pixelRatio = 2,
    backgroundColor = '#FFFFFF',
  } = options;

  const dataURL = chart.getDataURL({
    type: 'png',
    pixelRatio,
    backgroundColor,
    excludeComponents: ['toolbox'],
  });

  downloadDataURL(dataURL, `${filename}.png`);
}

/**
 * 导出 SVG（矢量图）
 * 调用方需确保图表使用 SVG 渲染器
 */
export function exportSVG(
  chart: echarts.ECharts,
  options: SVGExportOptions = {}
): void {
  const { filename = 'chart', useViewBox = true } = options;

  const svgString = chart.renderToSVGString({ useViewBox });
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  downloadURL(url, `${filename}.svg`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * 导出 PDF
 */
export async function exportPDF(
  chartContainer: HTMLElement,
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    filename = 'chart',
    orientation = 'landscape',
    pageSize = 'a4',
  } = options;

  const canvas = await html2canvas(chartContainer, {
    scale: 3,
    useCORS: true,
    backgroundColor: '#FFFFFF',
    logging: false,
  });

  const pdf = new jsPDF({ orientation, unit: 'mm', format: pageSize });
  const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
  const pdfHeight = pdf.internal.pageSize.getHeight() - 20;

  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

  const imgData = canvas.toDataURL('image/png', 1.0);
  pdf.addImage(
    imgData, 'PNG',
    10, 10,
    imgWidth * ratio, imgHeight * ratio
  );

  pdf.save(`${filename}.pdf`);
}

// 辅助函数
function downloadDataURL(dataURL: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadURL(url: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
