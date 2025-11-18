import { useEffect, useRef, type ReactElement } from "react";

import type { PredictionRecord } from "@/types/prediction";

const LABEL_COLOR: Record<PredictionRecord["label"], string> = {
  human: "#ef4444",
  object: "#facc15",
  empty: "#9ca3af",
  unknown: "#6366f1",
};

interface RadarCanvasProps {
  predictions: PredictionRecord[];
  heading: number;
  size?: number;
}

export function RadarCanvas({
  predictions,
  heading,
  size = 520,
}: RadarCanvasProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const radius = size / 2;
    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.translate(radius, radius);

    ctx.fillStyle = "#08101d";
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    const rings = 4;
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    for (let i = 1; i <= rings; i += 1) {
      ctx.beginPath();
      ctx.arc(0, 0, (radius / rings) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath();
    ctx.moveTo(-radius, 0);
    ctx.lineTo(radius, 0);
    ctx.moveTo(0, -radius);
    ctx.lineTo(0, radius);
    ctx.stroke();

    ctx.save();
    ctx.rotate((-heading * Math.PI) / 180);
    ctx.fillStyle = "rgba(56, 189, 248, 0.12)";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, (-15 * Math.PI) / 180, (15 * Math.PI) / 180);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const markers = predictions.slice(0, 50);
    markers.forEach((prediction) => {
      const angleRad = (((prediction.sequenceId ?? 0) % 360) * Math.PI) / 180;
      const distanceRatio = Math.min(prediction.distanceM / 20, 1);
      const markerRadius = 6 + prediction.confidence * 10;
      const opacity = Math.max(prediction.confidence, 0.3);
      const x = Math.cos(angleRad) * radius * distanceRatio;
      const y = Math.sin(angleRad) * radius * distanceRatio;
      ctx.beginPath();
      ctx.fillStyle = `${LABEL_COLOR[prediction.label]}${Math.floor(
        opacity * 255
      )
        .toString(16)
        .padStart(2, "0")}`;
      ctx.arc(x, y, markerRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }, [predictions, heading, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ borderRadius: "50%" }}
    />
  );
}
