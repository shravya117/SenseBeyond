from __future__ import annotations

import asyncio
import json
from typing import Any, Set

from fastapi import WebSocket


class WebSocketManager:
    """Track active websocket connections and broadcast payloads."""

    def __init__(self) -> None:
        self._clients: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._clients.add(websocket)

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._clients.discard(websocket)

    async def broadcast(self, message: Any) -> None:
        payload = json.dumps(message, default=str)
        async with self._lock:
            stale: Set[WebSocket] = set()
            for client in self._clients:
                try:
                    await client.send_text(payload)
                except Exception:  # pragma: no cover - best effort cleanup
                    stale.add(client)
            for client in stale:
                self._clients.discard(client)

    async def count(self) -> int:
        async with self._lock:
            return len(self._clients)
