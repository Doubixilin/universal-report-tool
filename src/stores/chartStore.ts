import { create } from "zustand";
import { ChartConfig, ChartTypeKind, ChartSeries } from "@/types";

/** 标注配置（内联定义，避免store依赖组件层） */
interface AnnotationConfig {
  markMax: boolean;
  markMin: boolean;
  markAverage: boolean;
  markTarget?: number;
  warnRangeLower?: number;
  warnRangeUpper?: number;
}

const DEFAULT_ANNOTATIONS: AnnotationConfig = {
  markMax: false,
  markMin: false,
  markAverage: false,
};

interface ChartState {
  // 图表配置列表
  chartConfigs: ChartConfig[];
  currentChart: ChartConfig | null;

  // === 图表设计器当前编辑状态 ===
  title: string;
  chartType: ChartTypeKind;
  xAxisTitle?: string;
  yAxisTitle?: string;
  categories: string[];
  series: ChartSeries[];

  // === 导出状态 ===
  isExporting: boolean;
  exportError: string | null;

  // === 主题状态 ===
  theme: string;

  // === 标注状态 ===
  annotations: AnnotationConfig;

  // 图表配置操作
  setChartConfigs: (configs: ChartConfig[]) => void;
  setCurrentChart: (config: ChartConfig | null) => void;
  addChartConfig: (config: ChartConfig) => void;
  updateChartConfig: (config: ChartConfig) => void;
  removeChartConfig: (id: string) => void;
  syncEditorFromChart: (config: ChartConfig) => void;

  // 图表设计器操作
  setTitle: (title: string) => void;
  setChartType: (chartType: ChartTypeKind) => void;
  setXAxisTitle: (xAxisTitle?: string) => void;
  setYAxisTitle: (yAxisTitle?: string) => void;
  setCategories: (categories: string[]) => void;
  setSeries: (series: ChartSeries[]) => void;
  syncChartFromEditor: () => void;
  clearExportError: () => void;

  // 导出操作
  setExporting: (isExporting: boolean) => void;
  setExportError: (error: string | null) => void;

  // 主题操作
  setTheme: (theme: string) => void;

  // 标注操作
  setAnnotations: (annotations: AnnotationConfig) => void;
}

export const useChartStore = create<ChartState>((set) => ({
  chartConfigs: [],
  currentChart: null,

  title: "示例图表",
  chartType: "barChart",
  xAxisTitle: undefined,
  yAxisTitle: undefined,
  categories: ["1月", "2月", "3月", "4月", "5月", "6月"],
  series: [
    { name: "销售额", values: [120, 200, 150, 80, 70, 110] },
  ],

  isExporting: false,
  exportError: null,
  theme: "business-blue",
  annotations: DEFAULT_ANNOTATIONS,

  setChartConfigs: (configs) => set({ chartConfigs: configs }),
  setCurrentChart: (config) =>
    set(() => {
      if (config) {
        return {
          currentChart: config,
          title: config.title,
          chartType: config.chartType,
          xAxisTitle: config.xAxisTitle,
          yAxisTitle: config.yAxisTitle,
          categories: config.categories ? [...config.categories] : [],
          series: config.series ? config.series.map((s) => ({ ...s })) : [],
        };
      }
      return { currentChart: null };
    }),
  addChartConfig: (config) =>
    set((state) => ({ chartConfigs: [...state.chartConfigs, config] })),
  updateChartConfig: (config) =>
    set((state) => ({
      chartConfigs: state.chartConfigs.map((c) =>
        c.id === config.id ? config : c
      ),
      currentChart:
        state.currentChart?.id === config.id ? config : state.currentChart,
    })),
  removeChartConfig: (id) =>
    set((state) => ({
      chartConfigs: state.chartConfigs.filter((c) => c.id !== id),
      currentChart: state.currentChart?.id === id ? null : state.currentChart,
    })),
  syncEditorFromChart: (config) =>
    set({
      title: config.title,
      chartType: config.chartType,
      xAxisTitle: config.xAxisTitle,
      yAxisTitle: config.yAxisTitle,
      categories: config.categories ? [...config.categories] : [],
      series: config.series ? config.series.map((s) => ({ ...s })) : [],
    }),

  setTitle: (title) => set({ title }),
  setChartType: (chartType) => set({ chartType }),
  setXAxisTitle: (xAxisTitle) => set({ xAxisTitle }),
  setYAxisTitle: (yAxisTitle) => set({ yAxisTitle }),
  setCategories: (categories) => set({ categories }),
  setSeries: (series) => set({ series }),
  syncChartFromEditor: () =>
    set((state) => {
      if (!state.currentChart) return {};
      const updated: ChartConfig = {
        ...state.currentChart,
        title: state.title,
        chartType: state.chartType,
        xAxisTitle: state.xAxisTitle,
        yAxisTitle: state.yAxisTitle,
        categories: [...state.categories],
        series: state.series.map((s) => ({ ...s })),
        updatedAt: new Date().toISOString(),
      };
      return {
        currentChart: updated,
        chartConfigs: state.chartConfigs.map((c) =>
          c.id === updated.id ? updated : c
        ),
      };
    }),
  clearExportError: () => set({ exportError: null, isExporting: false }),

  setExporting: (isExporting) => set({ isExporting }),
  setExportError: (exportError) =>
    set({ exportError, isExporting: false }),
  setTheme: (theme) => set({ theme }),
  setAnnotations: (annotations) => set({ annotations }),
}));
