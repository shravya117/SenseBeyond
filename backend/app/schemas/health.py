from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class HealthCheck(BaseModel):
    status: str = "ok"


class ReadinessProbe(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    status: str = "ready"
    build_version: str
    model_version: Optional[str] = None
    last_model_reload: Optional[datetime] = None
