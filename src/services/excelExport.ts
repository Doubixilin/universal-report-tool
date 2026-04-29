import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import type { ChartDataRequest, ChartGenerationResponse } from '@/types/chart';

export interface ExcelExportOptions {
  title: string;
  chartType: ChartDataRequest['chartType'];
  categories: string[];
  series: Array<{
    name: string;
    values: number[];
    color?: string;
  }>;
  xAxisTitle?: string;
  yAxisTitle?: string;
  defaultFilename?: string;
}

/**
 * 导出图表为 Excel 文件（包含可编辑图表）
 *
 * 流程：弹出文件保存对话框 -> 调用 Rust 后端生成 -> 返回结果
 */
export async function exportChartToExcel(
  options: ExcelExportOptions
): Promise<{ success: boolean; filepath?: string; message: string }> {
  try {
    // Step 1: 弹出文件保存对话框
    const filepath = await save({
      filters: [
        { name: 'Excel 工作簿', extensions: ['xlsx'] },
      ],
      defaultPath: options.defaultFilename || `${options.title}.xlsx`,
    });

    // 用户取消选择
    if (!filepath) {
      return { success: false, message: '用户取消了保存操作' };
    }

    const finalPath = filepath.endsWith('.xlsx') ? filepath : `${filepath}.xlsx`;

    // Step 2: 构造请求数据
    const request: ChartDataRequest = {
      title: options.title,
      chartType: options.chartType,
      categories: options.categories,
      series: options.series,
      xAxisTitle: options.xAxisTitle,
      yAxisTitle: options.yAxisTitle,
    };

    // Step 3: 调用 Rust 后端生成 Excel
    const response = await invoke<ChartGenerationResponse>('generate_excel_chart', {
      filepath: finalPath,
      request,
    });

    if (response.success) {
      return {
        success: true,
        filepath: finalPath,
        message: `Excel 文件已成功导出到: ${finalPath}`,
      };
    } else {
      return {
        success: false,
        message: response.message || '导出失败',
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `导出过程中发生错误: ${errorMessage}`,
    };
  }
}

/**
 * 从 chartStore 的配置构造导出选项
 */
export function buildExportOptions(
  chartConfig: {
    title: string;
    chartType: ChartDataRequest['chartType'];
    xAxisTitle?: string;
    yAxisTitle?: string;
  },
  dataset: {
    categories: string[];
    series: Array<{ name: string; values: number[]; color?: string }>;
  }
): ExcelExportOptions {
  return {
    title: chartConfig.title,
    chartType: chartConfig.chartType,
    categories: dataset.categories,
    series: dataset.series,
    xAxisTitle: chartConfig.xAxisTitle,
    yAxisTitle: chartConfig.yAxisTitle,
    defaultFilename: `${chartConfig.title}.xlsx`,
  };
}
