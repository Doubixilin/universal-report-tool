import { useState, useCallback, useMemo } from 'react';
import { Button, Dropdown, message } from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  PictureOutlined,
  DownOutlined,
} from '@ant-design/icons';
import * as echarts from 'echarts';
import { exportChartToExcel, buildExportOptions, type ExcelExportOptions } from '@/services/excelExport';
import { exportPNG, exportSVG, exportPDF } from '@/services/chartExport';
import { useChartStore } from '@/stores/chartStore';

interface ExportButtonProps {
  /** ECharts 实例（用于 PNG/SVG 导出） */
  chartInstance?: echarts.ECharts | null;
  /** 图表 DOM 容器（用于 PDF 导出） */
  chartContainer?: HTMLDivElement | null;
  /** 是否支持 Excel 导出 */
  enableExcel?: boolean;
  /** 自定义导出选项（可选，默认从 chartStore 读取） */
  exportOptions?: ExcelExportOptions;
  /** 导出成功回调 */
  onSuccess?: (format: string, filepath?: string) => void;
  /** 导出失败回调 */
  onError?: (error: string) => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  chartInstance,
  chartContainer,
  enableExcel = true,
  exportOptions,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const chartStore = useChartStore();

  const rawFilename = chartStore.title || 'chart';
  const filename = rawFilename.replace(/[\/\\:*?"<>|]/g, '-');

  const handleExcelExport = useCallback(async () => {
    setLoading(true);

    try {
      const options = exportOptions || buildExportOptions(
        {
          title: chartStore.title,
          chartType: chartStore.chartType,
          xAxisTitle: chartStore.xAxisTitle,
          yAxisTitle: chartStore.yAxisTitle,
        },
        {
          categories: chartStore.categories,
          series: chartStore.series,
        }
      );

      const result = await exportChartToExcel(options);

      if (result.success) {
        message.success('Excel 文件导出成功');
        onSuccess?.('excel', result.filepath);
      } else {
        message.error(result.message);
        onError?.(result.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      message.error(`导出失败: ${errorMessage}`);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [exportOptions, chartStore, onSuccess, onError]);

  const handlePNGExport = useCallback(() => {
    if (!chartInstance) {
      message.warning('图表未初始化');
      return;
    }
    try {
      exportPNG(chartInstance, { filename, pixelRatio: 2, backgroundColor: '#FFFFFF' });
      message.success('PNG 图片已导出（2x）');
      onSuccess?.('png', `${filename}.png`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      message.error(`PNG 导出失败: ${errorMessage}`);
      onError?.(errorMessage);
    }
  }, [chartInstance, filename, onSuccess, onError]);

  const handleHDExport = useCallback((ratio: number) => {
    if (!chartInstance) {
      message.warning('图表未初始化');
      return;
    }
    try {
      exportPNG(chartInstance, { filename, pixelRatio: ratio, backgroundColor: '#FFFFFF' });
      message.success(`高清 PNG 已导出（${ratio}x）`);
      onSuccess?.(`png-${ratio}x`, `${filename}.png`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      message.error(`PNG 导出失败: ${errorMessage}`);
      onError?.(errorMessage);
    }
  }, [chartInstance, filename, onSuccess, onError]);

  const handleSVGExport = useCallback(() => {
    if (!chartInstance) {
      message.warning('图表未初始化');
      return;
    }
    try {
      exportSVG(chartInstance, { filename });
      message.success('SVG 矢量图已导出');
      onSuccess?.('svg', `${filename}.svg`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      message.error(`SVG 导出失败: ${errorMessage}`);
      onError?.(errorMessage);
    }
  }, [chartInstance, filename, onSuccess, onError]);

  const handlePDFExport = useCallback(async () => {
    if (!chartContainer) {
      message.warning('图表容器未初始化');
      return;
    }
    setLoading(true);

    try {
      await exportPDF(chartContainer, { filename, orientation: 'landscape', pageSize: 'a4' });
      message.success('PDF 文档已导出');
      onSuccess?.('pdf', `${filename}.pdf`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      message.error(`PDF 导出失败: ${errorMessage}`);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [chartContainer, filename, onSuccess, onError]);

  const handleHDExport3 = useCallback(() => handleHDExport(3), [handleHDExport]);

  const items = useMemo(() => [
    {
      key: 'png',
      label: '导出为 PNG（2x 高清）',
      icon: <PictureOutlined />,
      onClick: handlePNGExport,
    },
    {
      key: 'png-hd',
      label: '导出为 PNG（3x 超清）',
      icon: <FileImageOutlined />,
      onClick: handleHDExport3,
    },
    {
      key: 'svg',
      label: '导出为 SVG（矢量图）',
      icon: <PictureOutlined />,
      onClick: handleSVGExport,
    },
    {
      key: 'pdf',
      label: '导出为 PDF（A4 横版）',
      icon: <FilePdfOutlined />,
      onClick: handlePDFExport,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'excel',
      label: '导出为 Excel（可编辑图表）',
      icon: <FileExcelOutlined />,
      onClick: handleExcelExport,
      disabled: !enableExcel,
    },
  ], [handlePNGExport, handleHDExport3, handleSVGExport, handlePDFExport, handleExcelExport, enableExcel]);

  return (
    <Dropdown menu={{ items }} placement="bottomRight">
      <Button
        type="primary"
        icon={<DownloadOutlined />}
        loading={loading}
        disabled={loading}
      >
        导出 <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default ExportButton;
