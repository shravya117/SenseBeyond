# SenseBeyond CSI Sender (ESP32)

This ESP-IDF project turns an ESP32 into a lightweight 802.11 traffic source so a paired receiver can collect CSI data. The project configures the board as a soft-AP and periodically transmits null-data frames toward the receiver.

## Prerequisites

- ESP-IDF v5.x (or newer) toolchain installed and exported.
- ESP32 or ESP32-S3 module with 802.11n capability.

## Configuration

Run `idf.py menuconfig` and adjust the **SenseBeyond CSI Sender** options:

- **SoftAP SSID / Password** — credentials the receiver will use to associate.
- **Target Receiver MAC** — MAC address of the receiver station; used as the destination for generated frames.
- **Channel** — 2.4 GHz channel shared by both boards.
- **TX Interval (ms)** — cadence for injecting frames (default 20 ms).

After saving, build and flash:

```bash
idf.py set-target esp32
idf.py build flash monitor
```

## Operation

1. Power the sender board; it will expose the configured SSID.
2. The receiver should connect as a station, obtain an IP, and begin capturing CSI.
3. The sender schedules a FreeRTOS task that crafts null-data frames and sends them via `esp_wifi_80211_tx`, generating deterministic traffic without opening sockets.

Monitor the serial log to confirm periodic transmit events and client associations.
