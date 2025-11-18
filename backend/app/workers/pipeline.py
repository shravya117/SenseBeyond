from __future__ import annotations

import asyncio
from typing import Iterable

import orjson

from ..core.config import Settings
from ..services.prediction_cache import PredictionCache
from ..services.metrics import PREDICTION_COUNTER, QUEUE_SIZE, record_latency
from ..services.device_registry import DeviceRegistry
from ..services.inference_engine import InferenceEngine
from ..services.websocket_manager import WebSocketManager
from ..schemas.prediction import InferenceEnvelope, PredictionRecord
from ..schemas.csi import CSIPacket
from ..services import preprocessing


class InferencePipeline:
    """Asynchronous pipeline that consumes CSI packets and emits predictions."""

    def __init__(
        self,
        queue: asyncio.Queue[CSIPacket],
        settings: Settings,
        engine: InferenceEngine,
        cache: PredictionCache,
        devices: DeviceRegistry,
        websocket_manager: WebSocketManager,
        redis_client=None,
        repository=None,
    ) -> None:
        self._queue = queue
        self._settings = settings
        self._engine = engine
        self._cache = cache
        self._devices = devices
        self._websocket_manager = websocket_manager
        self._redis = redis_client
        self._repository = repository
        self._running = False

    async def run(self) -> None:
        self._running = True
        poll_timeout = self._settings.inference_poll_timeout_ms / 1000.0
        batch_size = self._settings.inference_batch_size
        while self._running:
            QUEUE_SIZE.set(self._queue.qsize())
            items = await self._drain_batch(batch_size, poll_timeout)
            if not items:
                await asyncio.sleep(poll_timeout)
                continue

            features = [preprocessing.preprocess_packet(packet) for packet in items]
            with record_latency():
                envelopes = self._engine.run_batch(features)
            await self._handle_predictions(envelopes, items)

    async def stop(self) -> None:
        self._running = False

    async def _drain_batch(self, batch_size: int, timeout: float) -> list[CSIPacket]:
        items: list[CSIPacket] = []
        for _ in range(batch_size):
            try:
                packet = await asyncio.wait_for(self._queue.get(), timeout=timeout)
            except asyncio.TimeoutError:
                break
            items.append(packet)
        return items

    async def _handle_predictions(
        self, predictions: Iterable[InferenceEnvelope], packets: Iterable[CSIPacket]
    ) -> None:
        envelopes = list(predictions)
        packet_list = list(packets)
        if not envelopes:
            return

        records = [
            PredictionRecord(
                **envelope.model_dump(),
                sequence_id=packet.sequence_id,
                rssi=packet.rssi,
                noise_floor=packet.noise_floor,
                snr=packet.snr,
            )
            for envelope, packet in zip(envelopes, packet_list)
        ]

        self._cache.bulk_push(records)
        await self._broadcast(records)

        if self._redis is not None:
            await self._cache_to_redis(records)

        if self._repository is not None:
            await self._repository.add_many(records)

        for record in records:
            PREDICTION_COUNTER.labels(label=record.label).inc()
            self._devices.mark_prediction(record.mac_address)

        for packet in packet_list:
            self._devices.upsert(packet.mac_address)

    async def _broadcast(self, records: list[PredictionRecord]) -> None:
        for record in records:
            await self._websocket_manager.broadcast(record.model_dump(mode="json"))

    async def _cache_to_redis(self, records: list[PredictionRecord]) -> None:
        ttl = self._settings.redis_prediction_ttl_seconds
        for record in records:
            key = f"prediction:{record.mac_address}"
            payload = orjson.dumps(record.model_dump(mode="json")).decode("utf-8")
            await self._redis.set(key, payload, ex=ttl)
