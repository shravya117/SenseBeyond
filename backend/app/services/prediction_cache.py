from __future__ import annotations

from collections import deque
from typing import Deque, Dict, Iterable, Optional

from ..schemas.prediction import PredictionRecord


class PredictionCache:
    """Manage per-device rolling prediction buffers."""

    def __init__(self, max_size: int) -> None:
        self._max_size = max_size
        self._store: Dict[str, Deque[PredictionRecord]] = {}

    def push(self, prediction: PredictionRecord) -> None:
        buffer = self._store.setdefault(prediction.mac_address, deque(maxlen=self._max_size))
        buffer.append(prediction)

    def bulk_push(self, predictions: Iterable[PredictionRecord]) -> None:
        for prediction in predictions:
            self.push(prediction)

    def latest(self) -> list[PredictionRecord]:
        return [buffer[-1] for buffer in self._store.values() if buffer]

    def history(self, mac: Optional[str] = None) -> list[PredictionRecord]:
        if mac:
            buffer = self._store.get(mac)
            return list(buffer) if buffer else []
        results: list[PredictionRecord] = []
        for buffer in self._store.values():
            results.extend(buffer)
        results.sort(key=lambda record: record.timestamp, reverse=True)
        return results

    def reset(self) -> None:
        self._store.clear()
