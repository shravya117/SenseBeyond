# SenseBeyond ESP32 Firmware

This folder contains two ESP-IDF projects that pair with the FastAPI backend:

- `esp32-csi-receiver` — connects to Wi-Fi, captures CSI frames, and streams them to `POST /csi` on the backend.
- `esp32-csi-sender` — generates 802.11 traffic so the receiver has a steady CSI signal source.

Both projects target ESP32-class chips using ESP-IDF v5.x or newer. Use `idf.py set-target esp32` (or the MCU variant you own) before building.

## Common Workflow

1. Install ESP-IDF and export the environment (`. $IDF_PATH/export.sh` or PowerShell equivalent).
2. Flash `esp32-csi-sender` to the board acting as the access-point/traffic source.
3. Flash `esp32-csi-receiver` to the board connected to the SenseBeyond backend network.
4. Adjust project configuration with `idf.py menuconfig` so SSIDs, backend URLs, and MAC addresses match your environment.
5. Start the backend (`./start.sh`), power the boards, and verify CSI packets appear on the dashboard.

Refer to each project README for build and configuration specifics.
