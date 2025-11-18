from __future__ import annotations

from datetime import datetime
from typing import Iterable, List, Optional

from pydantic import BaseModel, Field, field_validator


class CSIPacket(BaseModel):
    """Payload delivered from ESP32 receivers."""

    mac_address: str = Field(..., description="Source device MAC address")
    sequence_id: int = Field(..., ge=0)
    timestamp: datetime = Field(..., description="Client-captured timestamp")
    rssi: Optional[float] = Field(None, description="Received Signal Strength Indicator")
    noise_floor: Optional[float] = Field(None, description="Noise floor in dBm")
    snr: Optional[float] = Field(None, description="Signal-to-noise ratio in dB")
    csi: List[List[float]] = Field(..., description="Complex CSI matrix flattened into [subcarrier][antenna]")

    @field_validator("mac_address")
    @classmethod
    def _normalize_mac(cls, value: str) -> str:
        mac = value.replace("-", ":").lower()
        parts = mac.split(":")
        if len(parts) != 6 or any(len(part) != 2 for part in parts):
            raise ValueError("MAC address must contain 6 octets")
        return mac

    @field_validator("csi")
    @classmethod
    def _validate_csi_shape(cls, matrix: Iterable[Iterable[float]]) -> List[List[float]]:
        matrix_list = [list(row) for row in matrix]
        if not matrix_list:
            raise ValueError("CSI matrix cannot be empty")
        width = len(matrix_list[0])
        if any(len(row) != width for row in matrix_list):
            raise ValueError("CSI matrix rows must be the same length")
        return matrix_list


class CSIIngestResponse(BaseModel):
    accepted: bool
    queued: int
