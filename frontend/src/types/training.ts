export type TrainingLabel =
  | "confirmed_human"
  | "false_positive"
  | "false_negative"
  | "unknown";

export interface TrainingAnnotation {
  predictionId: string;
  macAddress: string;
  label: TrainingLabel;
  timestamp: string;
  notes?: string;
}
