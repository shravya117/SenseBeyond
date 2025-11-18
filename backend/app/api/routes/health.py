from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from ...schemas.health import HealthCheck, ReadinessProbe
from ..deps import get_settings

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthCheck)
async def health_check() -> HealthCheck:
    return HealthCheck()


@router.get("/readiness", response_model=ReadinessProbe)
async def readiness(settings=Depends(get_settings)) -> ReadinessProbe:
    return ReadinessProbe(
        build_version=settings.readiness_build_version,
        model_version=settings.model_version,
        last_model_reload=datetime.now(tz=timezone.utc),
    )
