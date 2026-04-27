import { create } from "zustand";
import { ChartConfig } from "@/types";

interface ChartState {
  chartConfigs: ChartConfig[];
  currentChart: ChartConfig | null;
  setChartConfigs: (configs: ChartConfig[]) => void;
  setCurrentChart: (config: ChartConfig | null) => void;
  addChartConfig: (config: ChartConfig) => void;
  updateChartConfig: (config: ChartConfig) => void;
  removeChartConfig: (id: string) => void;
}

export const useChartStore = create<ChartState>((set) => ({
  chartConfigs: [],
  currentChart: null,
  setChartConfigs: (configs) => set({ chartConfigs: configs }),
  setCurrentChart: (config) => set({ currentChart: config }),
  addChartConfig: (config) =>
    set((state) => ({ chartConfigs: [...state.chartConfigs, config] })),
  updateChartConfig: (config) =>
    set((state) => ({
      chartConfigs: state.chartConfigs.map((c) =>
        c.id === config.id ? config : c
      ),
    })),
  removeChartConfig: (id) =>
    set((state) => ({
      chartConfigs: state.chartConfigs.filter((c) => c.id !== id),
      currentChart: state.currentChart?.id === id ? null : state.currentChart,
    })),
}));
