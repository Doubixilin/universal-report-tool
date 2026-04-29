import { TemplateHandler } from "easy-template-x";
import { readFile, writeFile } from "@tauri-apps/plugin-fs";
import { save, open } from "@tauri-apps/plugin-dialog";
import type {
  TemplateBindings,
  DataRecord,
  ReportGenerationRequest,
  ReportGenerationResult,
} from "@/types";
import type { ChartSeries } from "@/types/chart";
import { useChartStore } from "@/stores/chartStore";
import { getDatabase } from "@/database";

/**
 * 将 chartStore 数据转换为 easy-template-x Chart 格式
 *
 * 注意：`_type: 'chart'` 是关键标识，缺少它会导致 ChartPlugin 不被触发。
 */
export function buildChartTemplateData(
  title: string,
  categories: string[],
  series: ChartSeries[]
): Record<string, unknown> {
  return {
    _type: "chart",
    title,
    categories: { names: categories },
    series: series.map((s) => ({
      name: s.name,
      color: s.color,
      values: s.values,
    })),
  };
}

/**
 * 解析数据绑定：将 TemplateBindings + datasets 解析为 easy-template-x 所需的键值对
 */
function resolveBindings(
  bindings: TemplateBindings,
  allRecords: Map<string, DataRecord[]>
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  for (const [placeholderName, binding] of Object.entries(bindings)) {
    if (binding.chartId) {
      // 图表绑定：优先从已保存配置查找，回退到当前编辑状态
      const store = useChartStore.getState();
      let chartData: { title: string; categories: string[]; series: ChartSeries[] };

      // 在 chartStore 内存列表中查找匹配的配置
      const savedConfig = store.chartConfigs.find(c => c.id === binding.chartId);
      if (savedConfig) {
        // 使用保存的配置（内存中）
        chartData = {
          title: savedConfig.title,
          categories: store.categories,  // TODO: 持久化后从 config_json 还原
          series: store.series,
        };
      } else if (binding.chartId === store.currentChart?.id && store.currentChart) {
        // 使用当前编辑的图表
        chartData = {
          title: store.title,
          categories: store.categories,
          series: store.series,
        };
      } else {
        // 回退：使用当前编辑状态（兼容旧流程）
        chartData = {
          title: store.title,
          categories: store.categories,
          series: store.series,
        };
      }

      data[placeholderName] = buildChartTemplateData(
        chartData.title,
        chartData.categories,
        chartData.series
      );
    } else if (binding.datasetId && binding.field) {
      // 文本/数值绑定：取数据集第一条记录的指定字段
      const records = allRecords.get(binding.datasetId);
      if (records && records.length > 0) {
        data[placeholderName] = records[0].data[binding.field];
      }
    } else if (binding.loopDatasetId) {
      // 循环绑定：将数据集记录转为数组
      const records = allRecords.get(binding.loopDatasetId);
      if (records) {
        data[placeholderName] = records.map((r) => r.data);
      }
    }
    // 条件绑定：后续可扩展，当前不设值
  }

  return data;
}

/**
 * 生成 Word 报告（核心函数）
 *
 * 运行在渲染进程，通过 Tauri fs 插件读写文件。
 * easy-template-x 的 Chart 插件 Bug 已通过 patch-package 修复。
 */
export async function generateReport(
  request: ReportGenerationRequest
): Promise<ReportGenerationResult> {
  try {
    // Step 1: 读取模板
    const templateBytes = await readFile(request.templatePath);
    const templateBuffer = Buffer.from(templateBytes);

    // Step 2: 从 SQLite 读取各数据集的实际记录
    const allRecords = new Map<string, DataRecord[]>();
    const db = await getDatabase();
    for (const ds of request.datasets) {
      const rows = await db.select<DataRecord[]>(
        "SELECT * FROM dataset_records WHERE dataset_id = $1 ORDER BY row_index ASC",
        [ds.id]
      );
      allRecords.set(ds.id, rows || []);
    }

    // Step 3: 解析绑定数据
    const data = resolveBindings(
      request.bindings,
      allRecords
    );

    // Step 4: 处理模板
    // easy-template-x 的 TemplateData 类型过于严格，使用类型断言
    const handler = new TemplateHandler();
    const outputDoc = await handler.process(templateBuffer, data as never);

    // Step 5: 写入输出
    await writeFile(request.outputPath, Buffer.from(outputDoc));

    const chartsUpdated = Object.values(data).filter(
      (v) => (v as Record<string, unknown>)?._type === "chart"
    ).length;

    return {
      success: true,
      outputPath: request.outputPath,
      placeholdersReplaced: Object.keys(data).length,
      chartsUpdated,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      placeholdersReplaced: 0,
      chartsUpdated: 0,
    };
  }
}

/**
 * 弹出文件选择对话框，选择 .docx 模板
 */
export async function selectTemplateFile(): Promise<string | null> {
  return open({
    filters: [{ name: "Word 模板", extensions: ["docx"] }],
    title: "选择 Word 模板",
  });
}

/**
 * 弹出文件保存对话框，选择报告输出路径
 */
export async function selectOutputPath(
  defaultName = "report.docx"
): Promise<string | null> {
  return save({
    filters: [{ name: "Word 文档", extensions: ["docx"] }],
    defaultPath: defaultName,
  });
}
