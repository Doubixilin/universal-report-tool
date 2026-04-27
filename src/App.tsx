import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/components/common/AppLayout";
import ProjectPage from "@/pages/ProjectPage";
import DataPage from "@/pages/DataPage";
import TemplatePage from "@/pages/TemplatePage";
import ChartDesignerPage from "@/pages/ChartDesignerPage";
import ReportPage from "@/pages/ReportPage";
import SettingsPage from "@/pages/SettingsPage";

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/project" replace />} />
          <Route path="/project" element={<ProjectPage />} />
          <Route path="/data" element={<DataPage />} />
          <Route path="/template" element={<TemplatePage />} />
          <Route path="/chart" element={<ChartDesignerPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
