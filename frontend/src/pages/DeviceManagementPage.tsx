import ClearAllIcon from "@mui/icons-material/ClearAll";
import SaveIcon from "@mui/icons-material/Save";
import {
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { useMemo, useState, type ReactElement } from "react";

import { apiClient } from "@/services/apiClient";
import { useAppStore } from "@/store/useAppStore";
import type {
  DeviceSettingsResponse,
  DeviceSettingsUpdate,
} from "@/types/device";

export function DeviceManagementPage(): ReactElement {
  const devices = useAppStore((state) => state.devices);
  const setDevices = useAppStore((state) => state.setDevices);
  const [formState, setFormState] = useState<
    Record<string, DeviceSettingsUpdate>
  >({});

  const sortedDevices = useMemo(
    () => [...devices].sort((a, b) => a.macAddress.localeCompare(b.macAddress)),
    [devices]
  );

  const handleChange = (
    mac: string,
    field: keyof DeviceSettingsUpdate,
    value: number | undefined
  ) => {
    setFormState((prev) => ({
      ...prev,
      [mac]: {
        ...prev[mac],
        [field]: value,
      },
    }));
  };

  const handleSave = async (mac: string) => {
    const payload = formState[mac];
    if (!payload) return;
    try {
      const updated = await apiClient.post<DeviceSettingsResponse>(
        `/devices/${mac}/settings`,
        payload
      );
      setDevices(
        devices.map((device) =>
          device.macAddress === mac
            ? {
                ...device,
                inferenceFrequencyHz: updated.inferenceFrequencyHz,
                distanceCalibrationM: updated.distanceCalibrationM,
              }
            : device
        )
      );
      setFormState((prev) => {
        const next = { ...prev };
        delete next[mac];
        return next;
      });
    } catch (error) {
      console.error("Failed to update device settings", error);
    }
  };

  const handleClear = async () => {
    try {
      await apiClient.post("/devices/clear");
      setDevices([]);
    } catch (error) {
      console.error("Failed to clear devices", error);
    }
  };

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
        <Typography variant="h6">Device Management</Typography>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<ClearAllIcon />}
          onClick={handleClear}
        >
          Clear History
        </Button>
      </Box>
      <Box sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>MAC</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Seen</TableCell>
              <TableCell align="right">Detections</TableCell>
              <TableCell align="right">Freq (Hz)</TableCell>
              <TableCell align="right">Calibration (m)</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedDevices.map((device) => {
              const form = formState[device.macAddress] ?? {};
              return (
                <TableRow key={device.macAddress}>
                  <TableCell>{device.macAddress}</TableCell>
                  <TableCell>
                    <Chip
                      label={device.online ? "Online" : "Offline"}
                      color={device.online ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {device.lastSeen
                      ? dayjs(device.lastSeen).format("YYYY-MM-DD HH:mm:ss")
                      : "—"}
                  </TableCell>
                  <TableCell align="right">{device.detectionCount}</TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      value={
                        form.inferenceFrequencyHz ??
                        device.inferenceFrequencyHz ??
                        ""
                      }
                      onChange={(event) =>
                        handleChange(
                          device.macAddress,
                          "inferenceFrequencyHz",
                          event.target.value === ""
                            ? undefined
                            : Number(event.target.value)
                        )
                      }
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      value={
                        form.distanceCalibrationM ??
                        device.distanceCalibrationM ??
                        ""
                      }
                      onChange={(event) =>
                        handleChange(
                          device.macAddress,
                          "distanceCalibrationM",
                          event.target.value === ""
                            ? undefined
                            : Number(event.target.value)
                        )
                      }
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="primary"
                      onClick={() => handleSave(device.macAddress)}
                    >
                      <SaveIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </Card>
  );
}
