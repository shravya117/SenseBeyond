export type PredictionLabel = "empty" | "human" | "object" | "unknown";

export interface PredictionRecord {
  macAddress: string;
  timestamp: string;
  label: PredictionLabel;
  confidence: number;
  distanceM: number;
  modelVersion: string;
  latencyMs: number;
  sequenceId?: number;
  rssi?: number;
  noiseFloor?: number;
  snr?: number;
}

export interface PredictionsResponse {
  predictions: PredictionRecord[];
}

export interface PaginatedPredictionsResponse {
  items: PredictionRecord[];
  total: number;
  page: number;
  pageSize: number;
}
