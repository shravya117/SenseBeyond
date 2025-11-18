from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field


class SignalOverview(BaseModel):
    average_rssi: float = Field(..., description="Average RSSI across devices")
    average_noise_floor: float = Field(..., description="Average noise floor")
    average_snr: float = Field(..., description="Average SNR")
    packet_loss_percentage: float = Field(..., ge=0.0, le=100.0)
    inference_latency_ms: List[float] = Field(..., description="Latency histogram buckets")
