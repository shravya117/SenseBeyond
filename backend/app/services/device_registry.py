from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict

from ..schemas.device import DeviceSettingsResponse, DeviceStatus, DeviceSettingsUpdate


class DeviceRegistry:
    """Track device activity and per-device configuration."""

    def __init__(self) -> None:
        self._devices: Dict[str, DeviceStatus] = {}

    def upsert(self, mac_address: str) -> DeviceStatus:
        record = self._devices.setdefault(mac_address, DeviceStatus(mac_address=mac_address))
        record.last_seen = datetime.now(tz=timezone.utc)
        record.online = True
        return record

    def mark_prediction(self, mac_address: str) -> None:
        record = self.upsert(mac_address)
        record.detection_count += 1

    def set_offline(self, mac_address: str) -> None:
        record = self._devices.get(mac_address)
        if record:
            record.online = False

    def update_settings(self, mac_address: str, payload: DeviceSettingsUpdate) -> DeviceSettingsResponse:
        record = self._devices.setdefault(mac_address, DeviceStatus(mac_address=mac_address))
        record.inference_frequency_hz = payload.inference_frequency_hz or record.inference_frequency_hz
        record.distance_calibration_m = payload.distance_calibration_m or record.distance_calibration_m
        return DeviceSettingsResponse(
            mac_address=mac_address,
            inference_frequency_hz=record.inference_frequency_hz,
            distance_calibration_m=record.distance_calibration_m,
        )

    def list(self) -> list[DeviceStatus]:
        return sorted(self._devices.values(), key=lambda record: record.mac_address)

    def clear(self) -> None:
        self._devices.clear()
