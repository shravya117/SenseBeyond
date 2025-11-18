from __future__ import annotations

import asyncio
import contextlib
from contextlib import asynccontextmanager
from typing import Any, AsyncIterator, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app

from .api.router import api_router
from .core.config import settings
from .core.logging import configure_logging
from .infrastructure.postgres import (
    create_engine as create_db_engine,
    create_session_factory,
    dispose_engine,
)
from .infrastructure.redis_client import close_redis, create_redis
from .repositories.prediction_repository import PredictionRepository
from .services.device_registry import DeviceRegistry
from .services.inference_engine import InferenceEngine
from .services.prediction_cache import PredictionCache
from .services.websocket_manager import WebSocketManager
from .workers.pipeline import InferencePipeline


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    configure_logging(settings.log_level)

    queue: asyncio.Queue = asyncio.Queue(maxsize=settings.queue_maxsize)
    cache = PredictionCache(settings.prediction_cache_size)
    devices = DeviceRegistry()
    websocket_manager = WebSocketManager()
    inference_engine = InferenceEngine(settings.model_artifact_path, settings.model_version)

    redis = await create_redis(settings.redis_url) if settings.redis_url else None

    session_factory = None
    repository: Optional[PredictionRepository] = None
    db_engine = None
    db_session = None
    if settings.postgres_dsn:
        db_engine = create_db_engine(settings.postgres_dsn)
        session_factory = create_session_factory(db_engine)
        db_session = session_factory()
        repository = PredictionRepository(db_session)  # type: ignore[arg-type]

    pipeline = InferencePipeline(
        queue=queue,
        settings=settings,
        engine=inference_engine,
        cache=cache,
        devices=devices,
        websocket_manager=websocket_manager,
        redis_client=redis,
        repository=repository,
    )
    pipeline_task = asyncio.create_task(pipeline.run())

    app.state.settings = settings
    app.state.queue = queue
    app.state.prediction_cache = cache
    app.state.device_registry = devices
    app.state.websocket_manager = websocket_manager
    app.state.pipeline = pipeline
    app.state.pipeline_task = pipeline_task
    app.state.redis_client = redis
    app.state.prediction_repository = repository
    app.state.db_session = db_session
    app.state.training_annotations = []  # type: ignore[attr-defined]

    try:
        yield
    finally:
        pipeline_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await pipeline_task
        await close_redis(redis)
        if db_session is not None:
            await db_session.close()
        if db_engine is not None:
            await dispose_engine(db_engine)


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version=settings.api_version, lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router)

    if settings.metrics_enabled:
        app.mount("/metrics", make_asgi_app())

    return app


app = create_app()
