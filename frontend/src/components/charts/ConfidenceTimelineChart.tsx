import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { Line } from "react-chartjs-2";
import type { ReactElement } from "react";

import type { PredictionRecord } from "@/types/prediction";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  TimeScale
);

interface ConfidenceTimelineChartProps {
  data: PredictionRecord[];
}

const LABEL_COLORS: Record<PredictionRecord["label"], string> = {
  human: "#ef4444",
  object: "#facc15",
  empty: "#94a3b8",
  unknown: "#6366f1",
};

export function ConfidenceTimelineChart({
  data,
}: ConfidenceTimelineChartProps): ReactElement {
  const grouped = data.reduce<Record<string, PredictionRecord[]>>(
    (acc, prediction) => {
      acc[prediction.label] = acc[prediction.label] ?? [];
      acc[prediction.label].push(prediction);
      return acc;
    },
    {}
  );

  const chartData = {
    datasets: Object.entries(grouped).map(([label, entries]) => ({
      label,
      data: entries.map((entry) => ({
        x: entry.timestamp,
        y: Math.round(entry.confidence * 100),
      })),
      borderColor: LABEL_COLORS[label as PredictionRecord["label"]],
      backgroundColor: `${LABEL_COLORS[label as PredictionRecord["label"]]}55`,
      tension: 0.25,
      fill: false,
    })),
  };

  return (
    <Line
      options={{
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "nearest", intersect: false },
        scales: {
          x: {
            type: "time",
            time: { unit: "minute", tooltipFormat: "HH:mm:ss" },
            grid: { color: "rgba(255,255,255,0.05)" },
          },
          y: {
            min: 0,
            max: 100,
            ticks: { stepSize: 20 },
            grid: { color: "rgba(255,255,255,0.05)" },
          },
        },
        plugins: {
          legend: { position: "bottom", labels: { color: "#dde3f7" } },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y}% confidence`,
            },
          },
        },
      }}
      data={chartData}
    />
  );
}
