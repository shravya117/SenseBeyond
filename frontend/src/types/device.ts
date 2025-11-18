export interface DeviceStatus {
  macAddress: string;
  lastSeen?: string;
  detectionCount: number;
  online: boolean;
  inferenceFrequencyHz?: number;
  distanceCalibrationM?: number;
}

export interface DeviceSettingsUpdate {
  inferenceFrequencyHz?: number;
  distanceCalibrationM?: number;
}

export interface DeviceSettingsResponse {
  macAddress: string;
  inferenceFrequencyHz?: number;
  distanceCalibrationM?: number;
}
