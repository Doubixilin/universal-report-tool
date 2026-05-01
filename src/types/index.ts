export * from './chart';
import type { ChartConfig } from './chart';
export type { ChartConfig };

// ==================== 数据集相关 ====================

export interface Dataset {
  id: string;
  projectId: string;
  name: string;
  sourceFile: string;
  importSchemeId: string | null;
  createdAt: string;
  updatedAt: string;
  rowCount: number;
  schema: DatasetSchema;
}

export interface DatasetSchema {
  fields: FieldConfig[];
}

export interface FieldConfig {
  name: string;
  type: "text" | "number" | "date" | "percent" | "currency";
  displayName?: string;
  format?: string;
}

export interface DataRecord {
  id: string;
  datasetId: string;
  rowIndex: number;
  data: Record<string, unknown>;
  createdAt: string;
}

// ==================== 导入方案相关 ====================

export type TableType = "normal" | "multiheader" | "pivot" | "merged" | "complex";

export interface ImportScheme {
  id: string;
  name: string;
  tableType: TableType;
  headerRows: number;
  dataStartRow: number;
  columnMapping: Record<string, string>;
  fieldTypes: Record<string, FieldConfig["type"]>;
  createdAt: string;
}

export interface SheetAnalysisResult {
  tableType: TableType;
  headerRowCount: number;
  dataStartRow: number;
  headers: string[];
  sampleData: unknown[][];
  mergedCells: MergeCell[];
}

export interface MergeCell {
  s: { r: number; c: number };
  e: { r: number; c: number };
}

// ==================== 图表相关 ====================

// ChartConfig 和 ChartTypeKind 已移至 types/chart.ts，通过 export * from './chart' 导出

// ==================== 模板相关 ====================

export type PlaceholderType = "text" | "image" | "chart" | "loop" | "condition";

export interface Placeholder {
  name: string;
  type: PlaceholderType;
  rawCommand: string;
  location: {
    paragraph: number;
    cell?: { row: number; col: number };
  };
}

export interface Template {
  id: string;
  projectId: string;
  name: string;
  filePath: string;
  placeholders: Placeholder[];
  bindings: TemplateBindings;
  createdAt: string;
}

export interface TemplateBindings {
  [placeholderName: string]: {
    datasetId?: string;
    field?: string;
    chartId?: string;
    loopDatasetId?: string;
  };
}

// ==================== 项目相关 ====================

export interface Project {
  id: string;
  name: string;
  description: string;
  storageType: "sqlite" | "json";
  createdAt: string;
  updatedAt: string;
}

// ==================== 报告生成相关 ====================

export interface ReportJob {
  id: string;
  projectId: string;
  templateId: string;
  datasetIds: string[];
  chartIds: string[];
  status: "pending" | "running" | "completed" | "failed";
  outputPath?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ParsedPlaceholder {
  name: string;
  type: PlaceholderType;
  rawCommand: string;
  isOpener?: boolean;
  isCloser?: boolean;
  location: {
    paragraph: number;
    cell?: { row: number; col: number };
  };
}

export interface ReportGenerationRequest {
  templatePath: string;
  outputPath: string;
  bindings: TemplateBindings;
  datasets: Dataset[];
  chartConfigs: ChartConfig[];
}

export interface ReportGenerationResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  placeholdersReplaced: number;
  chartsUpdated: number;
}
