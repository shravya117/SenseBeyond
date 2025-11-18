import {
  Box,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { useMemo, useState, type ReactElement } from "react";

import { ConfidenceTimelineChart } from "@/components/charts/ConfidenceTimelineChart";
import { useAppStore } from "@/store/useAppStore";

const timeRanges = [
  { label: "30m", minutes: 30 },
  { label: "1h", minutes: 60 },
  { label: "6h", minutes: 360 },
];

export function ConfidenceTimelinePage(): ReactElement {
  const predictions = useAppStore((state) => state.predictions);
  const [selectedRange, setSelectedRange] = useState<number>(
    timeRanges[0].minutes
  );

  const filtered = useMemo(() => {
    const cutoff = dayjs().subtract(selectedRange, "minute");
    return predictions.filter((prediction) =>
      dayjs(prediction.timestamp).isAfter(cutoff)
    );
  }, [predictions, selectedRange]);

  return (
    <Card
      sx={{
        bgcolor: "background.paper",
        p: 3,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">Confidence Timeline</Typography>
        <ToggleButtonGroup
          value={selectedRange}
          exclusive
          onChange={(_, value) => value && setSelectedRange(value)}
          size="small"
        >
          {timeRanges.map((range) => (
            <ToggleButton key={range.minutes} value={range.minutes}>
              {range.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      <CardContent sx={{ height: 360 }}>
        <ConfidenceTimelineChart data={filtered} />
      </CardContent>
    </Card>
  );
}
