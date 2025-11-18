from __future__ import annotations

from pathlib import Path
from typing import Literal, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration driven by environment variables."""

    model_config = SettingsConfigDict(
        env_prefix="CSI_",
        env_file=".env",
        env_file_encoding="utf-8",
        arbitrary_types_allowed=True,
    )

    app_name: str = "SenseBeyond CSI Backend"
    api_version: str = "0.1.0"
    environment: Literal["development", "staging", "production"] = "development"
    log_level: str = "INFO"

    redis_url: str = "redis://localhost:6379/0"
    postgres_dsn: Optional[str] = None

    model_artifact_path: Path = Path("models/artifacts/model.ts")
    model_version: str = "unversioned"

    inference_batch_size: int = 32
    inference_poll_timeout_ms: int = 50
    queue_maxsize: int = 4096
    prediction_cache_size: int = 200

    readiness_build_version: str = "0.1.0"
    metrics_enabled: bool = True

    websocket_ping_interval: float = 20.0
    websocket_ping_timeout: float = 10.0

    redis_prediction_ttl_seconds: int = 60


settings = Settings()