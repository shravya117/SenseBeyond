from __future__ import annotations

from statistics import mean

from fastapi import APIRouter, Depends

from ...schemas.signal import SignalOverview
from ..deps import get_prediction_cache

router = APIRouter(prefix="/signal", tags=["signal"])


@router.get("/overview", response_model=SignalOverview)
async def signal_overview(cache=Depends(get_prediction_cache)) -> SignalOverview:
    history = cache.history()
    rssi_values = [record.rssi for record in history if record.rssi is not None]
    noise_values = [record.noise_floor for record in history if record.noise_floor is not None]
    snr_values = [record.snr for record in history if record.snr is not None]
    latency_values = [record.latency_ms for record in history]

    def avg(values: list[float]) -> float:
        return float(mean(values)) if values else 0.0

    histogram = sorted(latency_values)[:50]

    return SignalOverview(
        average_rssi=avg(rssi_values),
        average_noise_floor=avg(noise_values),
        average_snr=avg(snr_values),
        packet_loss_percentage=0.0,
        inference_latency_ms=histogram,
    )
