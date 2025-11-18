from __future__ import annotations

from fastapi import APIRouter, Depends

from ...schemas.device import DeviceSettingsResponse, DeviceSettingsUpdate, DeviceStatus
from ..deps import get_device_registry

router = APIRouter(prefix="/devices", tags=["devices"])


@router.get("", response_model=list[DeviceStatus])
async def list_devices(registry=Depends(get_device_registry)) -> list[DeviceStatus]:
    return registry.list()


@router.post("/{mac_address}/settings", response_model=DeviceSettingsResponse)
async def update_device_settings(
    mac_address: str,
    payload: DeviceSettingsUpdate,
    registry=Depends(get_device_registry),
) -> DeviceSettingsResponse:
    return registry.update_settings(mac_address, payload)


@router.post("/clear", status_code=204)
async def clear_devices(registry=Depends(get_device_registry)) -> None:
    registry.clear()
