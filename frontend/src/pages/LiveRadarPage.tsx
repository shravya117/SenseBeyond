import RadarIcon from "@mui/icons-material/Radar";
import { Box, Card, CardContent, Typography } from "@mui/material";
import dayjs from "dayjs";
import { useMemo, type ReactElement } from "react";

import { HeadingControl } from "@/components/radar/HeadingControl";
import { RadarCanvas } from "@/components/radar/RadarCanvas";
import { useAppStore } from "@/store/useAppStore";

export function LiveRadarPage(): ReactElement {
  const predictions = useAppStore((state) => state.predictions);
  const latestPrediction = useAppStore((state) => state.latestPrediction);
  const heading = useAppStore((state) => state.heading);
  const fps = useAppStore((state) => state.fps);

  const recentPredictions = useMemo(
    () => predictions.slice(0, 50),
    [predictions]
  );

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
        gap: 3,
      }}
    >
      <Card sx={{ bgcolor: "background.paper", p: 3 }}>
        <Typography
          variant="h6"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <RadarIcon /> Live Radar
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <RadarCanvas predictions={recentPredictions} heading={heading} />
        </Box>
      </Card>
      <Card
        sx={{
          bgcolor: "background.paper",
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography variant="h6">Live Statistics</Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 2,
          }}
        >
          <Stat label="Detections" value={predictions.length.toString()} />
          <Stat
            label="Latest Confidence"
            value={
              latestPrediction
                ? `${Math.round(latestPrediction.confidence * 100)}%`
                : "—"
            }
          />
          <Stat
            label="Latency"
            value={
              latestPrediction
                ? `${latestPrediction.latencyMs.toFixed(1)} ms`
                : "—"
            }
          />
          <Stat label="FPS" value={fps.toFixed(1)} />
        </Box>
        <HeadingControl />
        <Typography variant="caption" color="text.secondary">
          Last detection:{" "}
          {latestPrediction
            ? dayjs(latestPrediction.timestamp).format("HH:mm:ss")
            : "—"}
        </Typography>
      </Card>
    </Box>
  );
}

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps): ReactElement {
  return (
    <CardContent sx={{ bgcolor: "rgba(255,255,255,0.04)", borderRadius: 2 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={600}>
        {value}
      </Typography>
    </CardContent>
  );
}
