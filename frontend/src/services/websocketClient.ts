import { useAppStore } from "@/store/useAppStore";
import type { PredictionRecord } from "@/types/prediction";

const WS_URL =
  import.meta.env.VITE_WS_URL ?? "ws://localhost:8000/ws/predictions";

let socket: WebSocket | null = null;
let frameCount = 0;
let lastTimestamp = performance.now();

function normalizePrediction(
  payload: Record<string, unknown>
): PredictionRecord {
  return {
    macAddress: String(payload.mac_address ?? "unknown"),
    timestamp: String(payload.timestamp ?? new Date().toISOString()),
    label: String(payload.label ?? "unknown") as PredictionRecord["label"],
    confidence: Number(payload.confidence ?? 0),
    distanceM: Number(payload.distance_m ?? 0),
    modelVersion: String(payload.model_version ?? "unknown"),
    latencyMs: Number(payload.latency_ms ?? 0),
    sequenceId: payload.sequence_id as number | undefined,
    rssi: payload.rssi as number | undefined,
    noiseFloor: payload.noise_floor as number | undefined,
    snr: payload.snr as number | undefined,
  };
}

export function connectWebSocket(): void {
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }
  const store = useAppStore.getState();
  store.setConnectionState("connecting");

  const currentSocket = new WebSocket(WS_URL);
  socket = currentSocket;

  currentSocket.onopen = () => {
    if (socket !== currentSocket) {
      return;
    }
    useAppStore.getState().setConnectionState("connected");
    frameCount = 0;
    lastTimestamp = performance.now();
  };

  currentSocket.onclose = () => {
    if (socket === currentSocket) {
      useAppStore.getState().setConnectionState("disconnected");
      socket = null;
    }
  };

  currentSocket.onerror = () => {
    if (socket === currentSocket) {
      useAppStore.getState().setConnectionState("disconnected");
    }
  };

  currentSocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data?.type === "ping") {
        return;
      }
      const prediction = normalizePrediction(data);
      useAppStore.getState().addPrediction(prediction);
      frameCount += 1;
      const now = performance.now();
      const elapsed = now - lastTimestamp;
      if (elapsed >= 1000) {
        const fps = (frameCount * 1000) / elapsed;
        useAppStore.getState().setFps(Number(fps.toFixed(1)));
        frameCount = 0;
        lastTimestamp = now;
      }
    } catch (error) {
      console.error("Failed to parse WebSocket message", error);
    }
  };
}

export function disconnectWebSocket(): void {
  if (!socket) {
    return;
  }

  const currentSocket = socket;
  useAppStore.getState().setConnectionState("disconnected");

  if (currentSocket.readyState === WebSocket.CONNECTING) {
    currentSocket.addEventListener(
      "open",
      () => {
        currentSocket.close();
      },
      { once: true }
    );
    socket = null;
    return;
  }

  currentSocket.close();
  socket = null;
}
