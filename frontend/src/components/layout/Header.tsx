import CircleIcon from "@mui/icons-material/Circle";
import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { ReactElement } from "react";

import { useAppStore } from "@/store/useAppStore";

interface HeaderProps {
  onToggleDrawer?: () => void;
}

export function Header({ onToggleDrawer }: HeaderProps): ReactElement {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const connectionState = useAppStore((state) => state.connectionState);
  const latestPrediction = useAppStore((state) => state.latestPrediction);
  const fps = useAppStore((state) => state.fps);
  const heading = useAppStore((state) => state.heading);

  const statusColor =
    connectionState === "connected"
      ? "#4ade80"
      : connectionState === "connecting"
      ? "#facc15"
      : "#f87171";

  return (
    <AppBar
      position="sticky"
      elevation={1}
      color="transparent"
      sx={{ backdropFilter: "blur(12px)" }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {isMobile && (
            <IconButton edge="start" color="inherit" onClick={onToggleDrawer}>
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircleIcon htmlColor={statusColor} fontSize="small" />
            <Typography variant="subtitle2" color="text.secondary">
              Backend {connectionState}
            </Typography>
          </Box>
          <Typography variant="subtitle2" color="text.secondary">
            Model: {latestPrediction?.modelVersion ?? "unknown"}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            FPS: {fps.toFixed(1)}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Heading: {heading.toFixed(0)}°
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
