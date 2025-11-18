import CompassCalibrationIcon from "@mui/icons-material/Explore";
import { Box, Slider, Typography } from "@mui/material";
import type { ReactElement } from "react";

import { useAppStore } from "@/store/useAppStore";

export function HeadingControl(): ReactElement {
  const heading = useAppStore((state) => state.heading);
  const setHeading = useAppStore((state) => state.setHeading);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <CompassCalibrationIcon color="primary" />
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Manual Heading Override
        </Typography>
        <Slider
          value={heading}
          min={0}
          max={360}
          step={1}
          onChange={(_, value) => setHeading(value as number)}
          valueLabelDisplay="auto"
          marks={[
            { value: 0, label: "N" },
            { value: 90, label: "E" },
            { value: 180, label: "S" },
            { value: 270, label: "W" },
          ]}
        />
      </Box>
    </Box>
  );
}
