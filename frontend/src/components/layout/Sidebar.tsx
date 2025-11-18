import { useMemo, type ReactElement } from "react";
import { NavLink } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Radar";
import HistoryIcon from "@mui/icons-material/History";
import TimelineIcon from "@mui/icons-material/Timeline";
import DevicesIcon from "@mui/icons-material/Devices";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import SchoolIcon from "@mui/icons-material/School";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";

const navItems = [
  { to: "/", label: "Live Radar", icon: <DashboardIcon /> },
  { to: "/predictions", label: "Predictions Feed", icon: <HistoryIcon /> },
  { to: "/timeline", label: "Confidence Timeline", icon: <TimelineIcon /> },
  { to: "/devices", label: "Device Management", icon: <DevicesIcon /> },
  { to: "/signal", label: "Signal Overview", icon: <SignalCellularAltIcon /> },
  { to: "/training", label: "Training Manager", icon: <SchoolIcon /> },
];

export function Sidebar(): ReactElement {
  const renderNavItems = useMemo(
    () =>
      navItems.map((item) => (
        <ListItemButton
          key={item.to}
          component={NavLink}
          to={item.to}
          sx={{
            borderRadius: 1,
            color: "text.secondary",
            "&.active": {
              bgcolor: "primary.main",
              color: "primary.contrastText",
            },
          }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>{item.icon}</ListItemIcon>
          <ListItemText primary={item.label} />
        </ListItemButton>
      )),
    []
  );

  return (
    <Box
      sx={{
        width: 260,
        px: 2,
        py: 3,
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <Box>
        <Typography variant="h5" fontWeight={700} color="primary.main">
          SenseBeyond
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Real-time CSI Radar
        </Typography>
      </Box>
      <List sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {renderNavItems}
      </List>
    </Box>
  );
}
