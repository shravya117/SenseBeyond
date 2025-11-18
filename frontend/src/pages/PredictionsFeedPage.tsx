import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Card,
  Chip,
  InputAdornment,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";

import { useAppStore } from "@/store/useAppStore";
import type { PredictionRecord } from "@/types/prediction";

const LABEL_COLOR: Record<
  PredictionRecord["label"],
  "default" | "primary" | "secondary" | "success" | "warning" | "error"
> = {
  empty: "default",
  human: "error",
  object: "warning",
  unknown: "primary",
};

export function PredictionsFeedPage(): ReactElement {
  const predictions = useAppStore((state) => state.predictions);
  const devices = useAppStore((state) => state.devices);
  const [selectedDevice, setSelectedDevice] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const tableBodyRef = useRef<HTMLTableSectionElement | null>(null);

  const filtered = useMemo(() => {
    return predictions.filter((prediction) => {
      if (
        selectedDevice !== "all" &&
        prediction.macAddress !== selectedDevice
      ) {
        return false;
      }
      if (
        search &&
        !prediction.macAddress.includes(search) &&
        !prediction.timestamp.includes(search)
      ) {
        return false;
      }
      return true;
    });
  }, [predictions, selectedDevice, search]);

  useEffect(() => {
    if (tableBodyRef.current) {
      tableBodyRef.current.scrollTop = 0;
    }
  }, [filtered]);

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
      <Typography variant="h6">Predictions Feed</Typography>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <TextField
          select
          label="Device"
          size="small"
          value={selectedDevice}
          onChange={(event) => setSelectedDevice(event.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="all">All Devices</MenuItem>
          {devices.map((device) => (
            <MenuItem key={device.macAddress} value={device.macAddress}>
              {device.macAddress}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          label="Search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <Box sx={{ maxHeight: 480, overflowY: "auto" }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>MAC Address</TableCell>
              <TableCell>Label</TableCell>
              <TableCell align="right">Confidence</TableCell>
              <TableCell align="right">Distance (m)</TableCell>
              <TableCell align="right">Latency (ms)</TableCell>
              <TableCell align="right">SNR</TableCell>
            </TableRow>
          </TableHead>
          <TableBody ref={tableBodyRef}>
            {filtered.map((prediction) => (
              <TableRow
                key={`${prediction.macAddress}-${prediction.timestamp}`}
              >
                <TableCell>
                  {dayjs(prediction.timestamp).format("YYYY-MM-DD HH:mm:ss")}
                </TableCell>
                <TableCell>{prediction.macAddress}</TableCell>
                <TableCell>
                  <Chip
                    label={prediction.label}
                    color={LABEL_COLOR[prediction.label]}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  {Math.round(prediction.confidence * 100)}%
                </TableCell>
                <TableCell align="right">
                  {prediction.distanceM.toFixed(1)}
                </TableCell>
                <TableCell align="right">
                  {prediction.latencyMs.toFixed(1)}
                </TableCell>
                <TableCell align="right">
                  {prediction.snr?.toFixed(1) ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Card>
  );
}
