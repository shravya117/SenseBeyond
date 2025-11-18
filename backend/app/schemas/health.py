from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class HealthCheck(BaseModel):
	status: str = "ok"


class ReadinessProbe(BaseModel):
	status: str = "ready"
	build_version: str
	model_version: Optional[str] = None
	last_model_reload: Optional[datetime] = None
