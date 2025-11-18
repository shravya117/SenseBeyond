from __future__ import annotations

import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..deps import get_websocket_manager

router = APIRouter(tags=["stream"])


@router.websocket("/ws/predictions")
async def predictions_stream(
    websocket: WebSocket,
) -> None:
    settings = websocket.app.state.settings  # type: ignore[attr-defined]
    manager = await get_websocket_manager(websocket)
    await manager.connect(websocket)
    try:
        while True:
            await asyncio.sleep(settings.websocket_ping_interval)
            await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception:
        await manager.disconnect(websocket)
        await websocket.close()
