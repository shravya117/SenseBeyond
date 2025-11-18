from __future__ import annotations

from typing import Tuple

import numpy as np

from ..schemas.csi import CSIPacket


def preprocess_packet(packet: CSIPacket) -> Tuple[np.ndarray, CSIPacket]:
    """Return normalized CSI features ready for inference."""

    matrix = np.array(packet.csi, dtype=np.float32)
    phase = np.unwrap(np.angle(matrix + 0j), axis=0)
    spectrum = np.fft.fft(phase, axis=0)
    magnitude = np.abs(spectrum)
    normalized = (magnitude - magnitude.mean()) / (magnitude.std() + 1e-6)
    return normalized.astype(np.float32), packet
