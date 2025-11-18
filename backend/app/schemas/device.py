from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class DeviceStatus(BaseModel):
    mac_address: str
    last_seen: Optional[datetime] = None
    detection_count: int = 0
    online: bool = False
    inference_frequency_hz: Optional[float] = None
    distance_calibration_m: Optional[float] = Field(None, ge=0.0)


class DeviceSettingsUpdate(BaseModel):
    inference_frequency_hz: Optional[float] = Field(None, ge=0.1, le=100.0)
    distance_calibration_m: Optional[float] = Field(None, ge=0.0, le=100.0)


class DeviceSettingsResponse(BaseModel):
    mac_address: str
    inference_frequency_hz: Optional[float]
    distance_calibration_m: Optional[float]
