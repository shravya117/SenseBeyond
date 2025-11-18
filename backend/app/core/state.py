from __future__ import annotations

import asyncio
from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import Deque, Dict, Optional

from redis.asyncio import Redis
from starlette.websockets import WebSocket

from ..schemas.prediction import InferenceEnvelope


@dataclass
class ApplicationState:
    """Mutable application state shared across components."""

    queue: asyncio.Queue
    redis: Optional[Redis] = None
    model = None
    model_device: str | None = None
    websocket_clients: set[WebSocket] = field(default_factory=set)
    prediction_cache: Dict[str, Deque[InferenceEnvelope]] = field(
        default_factory=lambda: defaultdict(lambda: deque(maxlen=200))
    )
    pipeline_task: Optional[asyncio.Task] = None
    latency_metrics: Deque[float] = field(default_factory=lambda: deque(maxlen=500))
    device_last_seen: Dict[str, float] = field(default_factory=dict)
