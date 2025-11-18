from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


TrainingLabel = Literal["confirmed_human", "false_positive", "false_negative", "unknown"]


class TrainingAnnotation(BaseModel):
    prediction_id: str = Field(..., description="Unique prediction identifier")
    mac_address: str
    label: TrainingLabel
    timestamp: datetime
    notes: str | None = None


class TrainingAnnotationRequest(BaseModel):
    prediction_id: str
    label: TrainingLabel
    notes: str | None = None


class TrainingExport(BaseModel):
    generated_at: datetime
    samples: list[TrainingAnnotation]
