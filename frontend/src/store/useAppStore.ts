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

const hardcodedPredictions: PredictionRecord[] = [
  {
    macAddress: "AA:BB:CC:DD:EE:FF",
    timestamp: "2025-11-19T10:30:00.000Z",
    label: "human",
    confidence: 0.92,
    distanceM: 3.5,
    modelVersion: "v1.0",
    latencyMs: 45.2,
    sequenceId: 120,
    rssi: -65,
    noiseFloor: -90,
    snr: 25,
  },
  {
    macAddress: "AA:BB:CC:DD:EE:FF",
    timestamp: "2025-11-19T10:29:59.900Z",
    label: "human",
    confidence: 0.88,
    distanceM: 3.6,
    modelVersion: "v1.0",
    latencyMs: 46.1,
    sequenceId: 119,
    rssi: -66,
    noiseFloor: -90,
    snr: 24,
  },
  {
    macAddress: "AA:BB:CC:DD:EE:FF",
    timestamp: "2025-11-19T10:29:59.800Z",
    label: "human",
    confidence: 0.85,
    distanceM: 3.4,
    modelVersion: "v1.0",
    latencyMs: 44.8,
    sequenceId: 118,
    rssi: -64,
    noiseFloor: -90,
    snr: 26,
  },
  {
    macAddress: "AA:BB:CC:DD:EE:FF",
    timestamp: "2025-11-19T10:30:01.000Z",
    label: "object",
    confidence: 0.78,
    distanceM: 5.2,
    modelVersion: "v1.0",
    latencyMs: 43.5,
    sequenceId: 121,
    rssi: -70,
    noiseFloor: -90,
    snr: 20,
  },
];

export const useAppStore = create<AppState>((set) => ({
  predictions: hardcodedPredictions,
  latestPrediction: hardcodedPredictions[0],
  devices: [],
  trainingAnnotations: [],
  heading: 0,
  connectionState: "connected",
  fps: 15.0,
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
