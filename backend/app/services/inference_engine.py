from __future__ import annotations

import time
from pathlib import Path
from typing import Iterable, List, Optional

import numpy as np
import torch

from ..schemas.csi import CSIPacket
from ..schemas.prediction import InferenceEnvelope


class InferenceEngine:
    """Wrap TorchScript model inference with fallbacks for missing artifacts."""

    def __init__(self, artifact_path: Path, model_version: str) -> None:
        self._artifact_path = artifact_path
        self._model_version = model_version
        self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._model: Optional[torch.jit.ScriptModule] = None
        self._load_model()

    def _load_model(self) -> None:
        if self._artifact_path.exists():
            self._model = torch.jit.load(str(self._artifact_path), map_location=self._device)
            self._model.eval()
        else:
            self._model = None

    @property
    def model_version(self) -> str:
        return self._model_version

    @property
    def has_model(self) -> bool:
        return self._model is not None

    def reload(self) -> None:
        self._load_model()

    def run_batch(self, batch: Iterable[tuple[np.ndarray, CSIPacket]]) -> List[InferenceEnvelope]:
        start = time.perf_counter()
        envelopes: List[InferenceEnvelope] = []

        features = [item[0] for item in batch]
        packets = [item[1] for item in batch]
        if not packets:
            return envelopes

        latency_ms = 0.0
        if self._model is not None:
            tensor = torch.from_numpy(np.stack(features)).to(self._device)
            with torch.inference_mode():
                logits = self._model(tensor)
            probs = torch.softmax(logits, dim=-1).cpu().numpy()
            predicted = probs.argmax(axis=1)
        else:
            probs = np.tile(np.array([[0.2, 0.6, 0.2, 0.0]]), (len(features), 1))
            predicted = probs.argmax(axis=1)

        elapsed = time.perf_counter() - start
        latency_ms = elapsed * 1000.0

        labels = ["empty", "human", "object", "unknown"]
        for idx, packet in enumerate(packets):
            label_idx = int(predicted[idx]) if idx < len(predicted) else 3
            confidence = float(probs[idx][label_idx]) if idx < len(probs) else 0.0
            envelope = InferenceEnvelope(
                mac_address=packet.mac_address,
                timestamp=packet.timestamp,
                label=labels[label_idx] if label_idx < len(labels) else "unknown",
                confidence=confidence,
                distance_m=max(0.0, float(packet.snr or 0.0) * 0.5),
                model_version=self._model_version,
                latency_ms=latency_ms,
            )
            envelopes.append(envelope)
        return envelopes
