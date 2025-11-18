from __future__ import annotations

from fastapi import APIRouter

from .routes import csi, devices, health, predictions, signal, stream, training

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(csi.router)
api_router.include_router(predictions.router)
api_router.include_router(stream.router)
api_router.include_router(devices.router)
api_router.include_router(signal.router)
api_router.include_router(training.router)
