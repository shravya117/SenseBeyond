from __future__ import annotations

import logging
from typing import Any, Dict, cast

import structlog


def configure_logging(log_level: str = "INFO") -> None:
    """Configure structlog and stdlib logging for unified JSON output."""

    timestamper = structlog.processors.TimeStamper(fmt="iso", utc=True)

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            timestamper,
            structlog.processors.add_log_level,
            structlog.processors.dict_tracebacks,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(getattr(logging, log_level, logging.INFO)),
        cache_logger_on_first_use=True,
    )

    logging.basicConfig(level=getattr(logging, log_level, logging.INFO))


def get_logger(name: str, **context: Any) -> structlog.BoundLogger:
    """Return a structlog logger with optional bound context."""

    logger = structlog.get_logger(name)
    if context:
        return logger.bind(**cast(Dict[str, Any], context))
    return logger