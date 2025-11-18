from __future__ import annotations

import asyncio
from fastapi import APIRouter, Depends, HTTPException, Request, status

from ...schemas.csi import CSIIngestResponse, CSIPacket
from ..deps import get_device_registry

router = APIRouter(prefix="/csi", tags=["csi"])


@router.post("", response_model=CSIIngestResponse, status_code=status.HTTP_202_ACCEPTED)
async def ingest_csi(
    payload: CSIPacket,
    request: Request,
    registry=Depends(get_device_registry),
) -> CSIIngestResponse:
    queue: asyncio.Queue = request.app.state.queue  # type: ignore[attr-defined]
    if queue.full():
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Queue full")

    await queue.put(payload)
    registry.upsert(payload.mac_address)
    return CSIIngestResponse(accepted=True, queued=queue.qsize())
