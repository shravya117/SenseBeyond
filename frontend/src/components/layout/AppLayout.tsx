import { useMemo, useState, type ReactElement } from "react";
import { Outlet } from "react-router-dom";
import { Box, Drawer, useMediaQuery, useTheme } from "@mui/material";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppLayout(): ReactElement {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sidebarContent = useMemo(() => <Sidebar />, []);

  return (
    <Box
      sx={{ display: "flex", height: "100vh", bgcolor: "background.default" }}
    >
      {isMobile ? (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{ sx: { bgcolor: "background.paper" } }}
        >
          {sidebarContent}
        </Drawer>
      ) : (
        <Box
          sx={{
            width: 260,
            borderRight: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          {sidebarContent}
        </Box>
      )}
      <Box
        sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}
      >
        <Header onToggleDrawer={() => setDrawerOpen((open) => !open)} />
        <Box
          component="main"
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 3,
            display: "flex",
            flexDirection: "column",
            gap: 3,
            bgcolor: "background.default",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
