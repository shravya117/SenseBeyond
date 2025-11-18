import DownloadIcon from "@mui/icons-material/Download";
import FlagIcon from "@mui/icons-material/Flag";
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { useMemo, useState, type ReactElement } from "react";

import { apiClient } from "@/services/apiClient";
import { useAppStore } from "@/store/useAppStore";
import type { PredictionRecord } from "@/types/prediction";
import type { TrainingAnnotation, TrainingLabel } from "@/types/training";

const labelOptions: { value: TrainingLabel; label: string }[] = [
  { value: "confirmed_human", label: "Confirmed Human" },
  { value: "false_positive", label: "False Positive" },
  { value: "false_negative", label: "False Negative" },
  { value: "unknown", label: "Unknown" },
];

export function TrainingManagerPage(): ReactElement {
  const predictions = useAppStore((state) => state.predictions);
  const trainingAnnotations = useAppStore((state) => state.trainingAnnotations);
  const setTrainingAnnotations = useAppStore(
    (state) => state.setTrainingAnnotations
  );
  const [selectedLabel, setSelectedLabel] =
    useState<TrainingLabel>("confirmed_human");

  const stats = useMemo(() => {
    return trainingAnnotations.reduce<Record<string, number>>(
      (acc, annotation) => {
        acc[annotation.label] = (acc[annotation.label] ?? 0) + 1;
        return acc;
      },
      {}
    );
  }, [trainingAnnotations]);

  const recentPredictions = predictions.slice(0, 10);

  const handleAnnotate = async (prediction: PredictionRecord) => {
    const predictionId = `${prediction.macAddress}-${prediction.timestamp}`;
    try {
      const annotation = await apiClient.post<TrainingAnnotation>(
        "/training/annotations",
        {
          prediction_id: predictionId,
          label: selectedLabel,
        }
      );
      const next = [...trainingAnnotations, annotation];
      setTrainingAnnotations(next);
    } catch (error) {
      console.error("Failed to annotate prediction", error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiClient.get<{
        generated_at: string;
        samples: TrainingAnnotation[];
      }>("/training/export");
      const blob = new Blob([JSON.stringify(response, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `sensebeyond-training-${dayjs().format(
        "YYYYMMDD-HHmmss"
      )}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export training data", error);
    }
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
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
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h6"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <FlagIcon /> Training Data Manager
          </Typography>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export JSON
          </Button>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2">Label as:</Typography>
          <Select
            value={selectedLabel}
            size="small"
            onChange={(event) =>
              setSelectedLabel(event.target.value as TrainingLabel)
            }
          >
            {labelOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <Typography variant="subtitle2" color="text.secondary">
          Recent Detections
        </Typography>
        <List
          dense
          sx={{
            maxHeight: 360,
            overflowY: "auto",
            bgcolor: "rgba(255,255,255,0.03)",
            borderRadius: 2,
          }}
        >
          {recentPredictions.map((prediction) => (
            <ListItem
              key={`${prediction.macAddress}-${prediction.timestamp}`}
              secondaryAction={
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleAnnotate(prediction)}
                >
                  Add
                </Button>
              }
            >
              <ListItemText
                primary={`${prediction.macAddress} • ${prediction.label}`}
                secondary={dayjs(prediction.timestamp).format(
                  "YYYY-MM-DD HH:mm:ss"
                )}
              />
            </ListItem>
          ))}
        </List>
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
        <Typography variant="h6">Dataset Statistics</Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {labelOptions.map((option) => (
            <Chip
              key={option.value}
              label={`${option.label}: ${stats[option.value] ?? 0}`}
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
        <Divider />
        <Typography variant="subtitle2" color="text.secondary">
          Existing Annotations
        </Typography>
        <List dense sx={{ maxHeight: 360, overflowY: "auto" }}>
          {trainingAnnotations.map((annotation) => (
            <ListItem key={annotation.predictionId}>
              <ListItemText
                primary={`${annotation.macAddress} • ${annotation.label}`}
                secondary={dayjs(annotation.timestamp).format(
                  "YYYY-MM-DD HH:mm:ss"
                )}
              />
            </ListItem>
          ))}
        </List>
      </Card>
    </Box>
  );
}
