export interface SignalOverview {
  averageRssi: number;
  averageNoiseFloor: number;
  averageSnr: number;
  packetLossPercentage: number;
  inferenceLatencyMs: number[];
}
