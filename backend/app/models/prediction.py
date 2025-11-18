from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, declarative_base, mapped_column

from ..schemas.prediction import PredictionRecord

Base = declarative_base()


class PredictionORM(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    mac_address: Mapped[str] = mapped_column(String(17), index=True)
    timestamp: Mapped[datetime] = mapped_column()
    label: Mapped[str] = mapped_column(String(32), index=True)
    confidence: Mapped[float] = mapped_column(Float)
    distance_m: Mapped[float] = mapped_column(Float)
    model_version: Mapped[str] = mapped_column(String(64))
    latency_ms: Mapped[float] = mapped_column(Float)
    sequence_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    rssi: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    noise_floor: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    snr: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    def to_schema(self) -> PredictionRecord:
        return PredictionRecord(
            mac_address=self.mac_address,
            timestamp=self.timestamp,
            label=self.label,  # type: ignore[arg-type]
            confidence=self.confidence,
            distance_m=self.distance_m,
            model_version=self.model_version,
            latency_ms=self.latency_ms,
            sequence_id=self.sequence_id,
            rssi=self.rssi,
            noise_floor=self.noise_floor,
            snr=self.snr,
        )

    @classmethod
    def from_schema(cls, record: PredictionRecord) -> "PredictionORM":
        return cls(
            mac_address=record.mac_address,
            timestamp=record.timestamp,
            label=record.label,
            confidence=record.confidence,
            distance_m=record.distance_m,
            model_version=record.model_version,
            latency_ms=record.latency_ms,
            sequence_id=record.sequence_id,
            rssi=record.rssi,
            noise_floor=record.noise_floor,
            snr=record.snr,
        )
