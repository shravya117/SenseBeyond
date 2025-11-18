from __future__ import annotations

import time
from contextlib import contextmanager

from prometheus_client import Counter, Gauge, Histogram

PREDICTION_COUNTER = Counter(
    "csi_predictions_total",
    "Total number of inference predictions",
    labelnames=("label",),
)
PREDICTION_LATENCY = Histogram(
    "csi_inference_latency_ms",
    "Inference latency in milliseconds",
    buckets=(1, 2.5, 5, 7.5, 10, 25, 50, 75, 100, 250, 500, 1000),
)
QUEUE_SIZE = Gauge(
    "csi_ingest_queue_size",
    "Number of CSI packets waiting for inference",
)


@contextmanager
def record_latency():
    start = time.perf_counter()
    yield
    elapsed = time.perf_counter() - start
    PREDICTION_LATENCY.observe(elapsed * 1000.0)
