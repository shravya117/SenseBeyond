from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


PredictionLabel = Literal["empty", "human", "object", "unknown"]


class InferenceEnvelope(BaseModel):
    mac_address: str
    timestamp: datetime
    label: PredictionLabel
    confidence: float = Field(..., ge=0.0, le=1.0)
    distance_m: float = Field(..., ge=0.0)
    model_version: str
    latency_ms: float = Field(..., ge=0.0)


class PredictionRecord(InferenceEnvelope):
    sequence_id: Optional[int] = None
    rssi: Optional[float] = None
    noise_floor: Optional[float] = None
    snr: Optional[float] = None


class LatestPredictionsResponse(BaseModel):
    predictions: list[PredictionRecord]


class PaginatedPredictionsResponse(BaseModel):
    items: list[PredictionRecord]
    total: int
    page: int
    page_size: int
