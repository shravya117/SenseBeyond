import { useEffect } from "react";

import { apiClient } from "@/services/apiClient";
import { useAppStore } from "@/store/useAppStore";
import type { PaginatedPredictionsResponse } from "@/types/prediction";
import type { DeviceStatus } from "@/types/device";
import type { SignalOverview } from "@/types/signal";
import type { TrainingAnnotation } from "@/types/training";

export function useInitialData(): void {
  const setPredictions = useAppStore((state) => state.setPredictions);
  const setDevices = useAppStore((state) => state.setDevices);
  const setSignal = useAppStore((state) => state.setSignal);
  const setTrainingAnnotations = useAppStore(
    (state) => state.setTrainingAnnotations
  );
  const predictions = useAppStore((state) => state.predictions);

  useEffect(() => {
    async function bootstrap() {
      try {
        const [predictionsResponse, devices, signal, annotations] =
          await Promise.all([
            apiClient.get<PaginatedPredictionsResponse>(
              "/predictions/history?page=1&page_size=200"
            ),
            apiClient.get<DeviceStatus[]>("/devices"),
            apiClient.get<SignalOverview>("/signal/overview"),
            apiClient.get<TrainingAnnotation[]>("/training/annotations"),
          ]);

        setPredictions(predictionsResponse.items);
        setDevices(devices);
        setSignal(signal);
        setTrainingAnnotations(annotations);
      } catch (error) {
        console.error("Failed to bootstrap dashboard", error);
        // Keep existing predictions (hard-coded or from previous state)
      }
    }

    // Only bootstrap if no predictions exist yet
    if (predictions.length === 0) {
      void bootstrap();
    }
  }, [
    setPredictions,
    setDevices,
    setSignal,
    setTrainingAnnotations,
    predictions.length,
  ]);
}
