import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/components/common/AppLayout";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import ProjectPage from "@/pages/ProjectPage";
import DataPage from "@/pages/DataPage";
import TemplatePage from "@/pages/TemplatePage";
import ChartDesignerPage from "@/pages/ChartDesignerPage";
import ReportPage from "@/pages/ReportPage";
import SettingsPage from "@/pages/SettingsPage";
import { useProjectStore } from "@/stores/projectStore";
import { useDataStore } from "@/stores/dataStore";
import { useChartStore } from "@/stores/chartStore";
import { useTemplateStore } from "@/stores/templateStore";

// 跨 Store 协调：切换项目时清除其他 Store 中属于旧项目的数据
let lastProjectId: string | null = null;
useProjectStore.subscribe((state) => {
  const currentId = state.currentProject?.id ?? null;
  if (currentId !== lastProjectId) {
    lastProjectId = currentId;
    const dataState = useDataStore.getState();
    const chartState = useChartStore.getState();
    const templateState = useTemplateStore.getState();
    dataState.setCurrentDataset(null);
    dataState.setCurrentRecords([]);
    chartState.setCurrentChart(null);
    chartState.setChartConfigs([]);
    templateState.setCurrentTemplate(null);
  }
});

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Navigate to="/project" replace />} />
            <Route path="/project" element={<ProjectPage />} />
            <Route path="/data" element={<DataPage />} />
            <Route path="/template" element={<TemplatePage />} />
            <Route path="/chart" element={<ChartDesignerPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </ErrorBoundary>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
