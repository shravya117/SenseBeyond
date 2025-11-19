# SenseBeyond CSI Detection Platform

Real-time WiFi CSI (Channel State Information) inference system with FastAPI + PyTorch backend and a React + Vite dashboard. The platform ingests CSI packets, performs continuous inference, and streams detections to an advanced multi-page radar dashboard.

## Project Structure

- `backend/` – FastAPI application with TorchScript inference pipeline, Redis cache, optional PostgreSQL persistence, WebSocket streaming, and metrics
- `frontend/` – React 18 + Vite dashboard with Material UI, Chart.js, and Zustand (to be implemented)
- `models/` – TorchScript artifacts mounted at runtime

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20.10+
- Redis 7+
- (Optional) PostgreSQL 16+

### One-Time Setup

```bash
./setup.sh
```

The script verifies Node.js and Python availability, provisions the backend virtual environment (including `.env` from `.env.example` when missing), and installs frontend dependencies. Re-run it whenever dependencies change.

### Running the Stack

```bash
# default: docker compose
./start.sh

# alternatively, run services locally
./start.sh local
```

- Compose mode builds and launches the full stack (backend, frontend, Redis, Postgres) via Docker.
- Local mode reuses the created virtual environment and runs `uvicorn` plus the Vite dev server; press `Ctrl+C` to stop both.

Backend: http://localhost:8000
Frontend preview: http://localhost:4173
Prometheus metrics: http://localhost:8000/metrics

### Bridging Hardware CSI Over Serial

- Flash the ESP32 receiver with the latest firmware so it emits `CSI_JSON:` lines on the UART.
- Keep the receiver attached to the host on `COM5` (adjust if your port differs).
- Forward the serial stream into the backend: `uvicorn` must be running, then execute
  ```powershell
  python backend/scripts/csi_serial_bridge.py --port COM5 --backend http://127.0.0.1:8000
  ```
- Once the bridge is active the inference pipeline ingests live CSI data and the React dashboard reflects real samples in real time.

## Tests

Backend tests use PyTest:

```powershell
cd backend
pytest
```

Frontend linting:

```powershell
cd frontend
npm run lint
```

## Next Steps

- Implement CSI preprocessing and TorchScript inference logic
- Build the multi-page React dashboard with live WebSocket updates
- Integrate Redis and PostgreSQL persistence layers
- Add observability dashboards and CI/CD pipeline
