import { useEffect, type ReactElement } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { useInitialData } from "@/hooks/useInitialData";
import {
  connectWebSocket,
  disconnectWebSocket,
} from "@/services/websocketClient";
import { ConfidenceTimelinePage } from "@/pages/ConfidenceTimelinePage";
import { DeviceManagementPage } from "@/pages/DeviceManagementPage";
import { LiveRadarPage } from "@/pages/LiveRadarPage";
import { PredictionsFeedPage } from "@/pages/PredictionsFeedPage";
import { SignalOverviewPage } from "@/pages/SignalOverviewPage";
import { TrainingManagerPage } from "@/pages/TrainingManagerPage";

function App(): ReactElement {
  useInitialData();

  useEffect(() => {
    connectWebSocket();
    return () => disconnectWebSocket();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<LiveRadarPage />} />
          <Route path="predictions" element={<PredictionsFeedPage />} />
          <Route path="timeline" element={<ConfidenceTimelinePage />} />
          <Route path="devices" element={<DeviceManagementPage />} />
          <Route path="signal" element={<SignalOverviewPage />} />
          <Route path="training" element={<TrainingManagerPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
