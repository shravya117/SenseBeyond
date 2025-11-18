from __future__ import annotations

from fastapi import Request, WebSocket

from ..core.config import Settings
from ..services.device_registry import DeviceRegistry
from ..services.prediction_cache import PredictionCache
from ..services.websocket_manager import WebSocketManager
from ..workers.pipeline import InferencePipeline


def get_settings(request: Request) -> Settings:
    return request.app.state.settings  # type: ignore[attr-defined]


def get_prediction_cache(request: Request) -> PredictionCache:
    return request.app.state.prediction_cache  # type: ignore[attr-defined]


def get_device_registry(request: Request) -> DeviceRegistry:
    return request.app.state.device_registry  # type: ignore[attr-defined]


async def get_websocket_manager(websocket: WebSocket) -> WebSocketManager:
    # WebSocket routes interact with the same app state that holds the manager.
    return websocket.app.state.websocket_manager  # type: ignore[attr-defined]


def get_pipeline(request: Request) -> InferencePipeline:
    return request.app.state.pipeline  # type: ignore[attr-defined]
