import SpeedIcon from "@mui/icons-material/Speed";
import WifiIcon from "@mui/icons-material/Wifi";
import {
  Box,
  Card,
  CardContent,
  LinearProgress,
  Typography,
} from "@mui/material";
import { useMemo, type ReactElement } from "react";

import { ConfidenceTimelineChart } from "@/components/charts/ConfidenceTimelineChart";
import { useAppStore } from "@/store/useAppStore";

const LATENCY_BASE_TIMESTAMP = Date.UTC(2024, 0, 1, 0, 0, 0);

export function SignalOverviewPage(): ReactElement {
  const signal = useAppStore((state) => state.signal);
  const predictions = useAppStore((state) => state.predictions);

  const recentSnr = useMemo(
    () =>
      predictions
        .slice(0, 100)
        .map((prediction) => prediction.snr ?? 0)
        .filter((value) => value > 0),
    [predictions]
  );

  const latencyHistogram = useMemo(
    () => signal?.inferenceLatencyMs ?? [],
    [signal]
  );

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
        gap: 3,
      }}
    >
      <Card
        sx={{
          bgcolor: "background.paper",
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <WifiIcon /> Signal Quality
        </Typography>
        <Metric
          label="Average RSSI"
          value={signal?.averageRssi ?? 0}
          unit="dBm"
        />
        <Metric
          label="Noise Floor"
          value={signal?.averageNoiseFloor ?? 0}
          unit="dBm"
        />
        <Metric
          label="Packet Loss"
          value={signal?.packetLossPercentage ?? 0}
          unit="%"
          max={100}
        />
      </Card>
      <Card sx={{ bgcolor: "background.paper", p: 3 }}>
        <Typography
          variant="h6"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <SpeedIcon /> Inference Latency Histogram
        </Typography>
        <Box sx={{ height: 260, mt: 2 }}>
          <ConfidenceTimelineChart
            data={latencyHistogram.map((latency, index) => ({
              macAddress: `virtual-${index}`,
              timestamp: new Date(
                LATENCY_BASE_TIMESTAMP - index * 5000
              ).toISOString(),
              label: "unknown",
              confidence: Math.min(latency / 100, 1),
              distanceM: latency / 10,
              modelVersion: "latency",
              latencyMs: latency,
            }))}
          />
        </Box>
      </Card>
      <Card
        sx={{
          bgcolor: "background.paper",
          p: 3,
          gridColumn: { xs: "span 1", lg: "span 2" },
        }}
      >
        <Typography variant="h6">Recent SNR Trend</Typography>
        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
          {recentSnr.map((value, index) => (
            <Box
              key={index}
              sx={{
                flex: 1,
                bgcolor: "primary.main",
                height: `${Math.min(value * 3, 120)}px`,
                borderRadius: 1,
              }}
            />
          ))}
        </Box>
      </Card>
    </Box>
  );
}

interface MetricProps {
  label: string;
  value: number;
  unit: string;
  max?: number;
}

function Metric({ label, value, unit, max = 100 }: MetricProps): ReactElement {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <CardContent sx={{ bgcolor: "rgba(255,255,255,0.04)", borderRadius: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6">
        {value.toFixed(1)} {unit}
      </Typography>
      <LinearProgress variant="determinate" value={percentage} sx={{ mt: 1 }} />
    </CardContent>
  );
}
