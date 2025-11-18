import { create } from "zustand";
import type { DeviceStatus } from "@/types/device";
import type { PredictionRecord } from "@/types/prediction";
import type { SignalOverview } from "@/types/signal";
import type { TrainingAnnotation } from "@/types/training";

type ConnectionState = "disconnected" | "connecting" | "connected";

interface AppState {
  predictions: PredictionRecord[];
  latestPrediction?: PredictionRecord;
  devices: DeviceStatus[];
  signal?: SignalOverview;
  trainingAnnotations: TrainingAnnotation[];
  heading: number;
  connectionState: ConnectionState;
  fps: number;
  setPredictions: (records: PredictionRecord[]) => void;
  addPrediction: (record: PredictionRecord) => void;
  setDevices: (devices: DeviceStatus[]) => void;
  setSignal: (signal: SignalOverview) => void;
  setTrainingAnnotations: (annotations: TrainingAnnotation[]) => void;
  setHeading: (heading: number) => void;
  setConnectionState: (state: ConnectionState) => void;
  setFps: (fps: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  predictions: [],
  devices: [],
  trainingAnnotations: [],
  heading: 0,
  connectionState: "disconnected",
  fps: 0,
  setPredictions: (records) => set(() => ({ predictions: records })),
  addPrediction: (record) =>
    set((state) => {
      const predictions = [record, ...state.predictions].slice(0, 500);
      return { predictions, latestPrediction: record };
    }),
  setDevices: (devices) => set(() => ({ devices })),
  setSignal: (signal) => set(() => ({ signal })),
  setTrainingAnnotations: (trainingAnnotations) =>
    set(() => ({ trainingAnnotations })),
  setHeading: (heading) => set(() => ({ heading })),
  setConnectionState: (connectionState) => set(() => ({ connectionState })),
  setFps: (fps) => set(() => ({ fps })),
}));
