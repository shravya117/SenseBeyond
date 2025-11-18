# SenseBeyond CSI Receiver (ESP32)

This ESP-IDF project connects an ESP32 to Wi-Fi, enables CSI capture, and posts the resulting samples to the SenseBeyond backend (`POST /csi`). Pair it with the `esp32-csi-sender` project or any 802.11 traffic source on the same channel.

## Prerequisites

- ESP-IDF v5.x (or newer) toolchain.
- Reachable SenseBeyond backend (default `http://192.168.1.100:8000`).
- Internet access (or local SNTP server) so the ESP32 can obtain wall-clock time for CSI timestamps.

## Configuration

Use `idf.py menuconfig` and adjust **SenseBeyond CSI Receiver** settings:

- **Wi-Fi SSID / Password** — network the receiver uses (typically the sender’s SoftAP).
- **Backend Base URL** — `http(s)://host:port` pointing at the FastAPI service.
- **Device Identifier** — label used for `mac_address` when posting CSI.
- **Post Interval (ms)** — batching window for CSI frames before sending.
- **Retry Backoff (ms)** — delay before retrying failed HTTP posts.

Optional SNTP server and timezone settings live under **Component config → LWIP**.

## Build & Flash

```bash
idf.py set-target esp32
idf.py build flash monitor
```

On boot the receiver:

1. Joins the configured Wi-Fi network.
2. Starts SNTP and waits for valid time (so timestamps are ISO-8601).
3. Enables CSI and registers a callback that pushes raw samples into a FreeRTOS queue.
4. A dedicated task converts the samples into JSON payloads and posts them to the backend.

Serial logs print HTTP status codes. If you see connection or time-sync failures, confirm SSID credentials, backend reachability, and SNTP availability.
