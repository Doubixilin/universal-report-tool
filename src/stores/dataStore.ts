import { create } from "zustand";
import { Dataset, DataRecord, ImportScheme } from "@/types";

interface DataState {
  datasets: Dataset[];
  currentDataset: Dataset | null;
  currentRecords: DataRecord[];
  importSchemes: ImportScheme[];
  setDatasets: (datasets: Dataset[]) => void;
  setCurrentDataset: (dataset: Dataset | null) => void;
  setCurrentRecords: (records: DataRecord[]) => void;
  setImportSchemes: (schemes: ImportScheme[]) => void;
  addDataset: (dataset: Dataset) => void;
  updateDataset: (dataset: Dataset) => void;
  removeDataset: (id: string) => void;
}

export const useDataStore = create<DataState>((set) => ({
  datasets: [],
  currentDataset: null,
  currentRecords: [],
  importSchemes: [],
  setDatasets: (datasets) => set({ datasets }),
  setCurrentDataset: (dataset) => set({ currentDataset: dataset }),
  setCurrentRecords: (records) => set({ currentRecords: records }),
  setImportSchemes: (schemes) => set({ importSchemes: schemes }),
  addDataset: (dataset) =>
    set((state) => ({ datasets: [...state.datasets, dataset] })),
  updateDataset: (dataset) =>
    set((state) => ({
      datasets: state.datasets.map((d) =>
        d.id === dataset.id ? dataset : d
      ),
    })),
  removeDataset: (id) =>
    set((state) => ({
      datasets: state.datasets.filter((d) => d.id !== id),
      currentDataset:
        state.currentDataset?.id === id ? null : state.currentDataset,
    })),
}));
