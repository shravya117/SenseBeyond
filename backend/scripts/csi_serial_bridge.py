from __future__ import annotations

import argparse
import json
import logging
import os
import sys
import time
from typing import Optional

import httpx
import serial

DEFAULT_PREFIX = "CSI_JSON:"


def parse_args(argv: Optional[list[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Forward CSI JSON lines from an ESP32 serial port into the FastAPI backend.",
    )
    parser.add_argument(
        "--port",
        default=os.getenv("CSI_SERIAL_PORT", "COM5"),
        help="Serial port exposing the receiver (default: %(default)s)",
    )
    parser.add_argument(
        "--baud",
        type=int,
        default=int(os.getenv("CSI_SERIAL_BAUD", "115200")),
        help="Serial baud rate (default: %(default)s)",
    )
    parser.add_argument(
        "--backend",
        default=os.getenv("SENSEBEYOND_BACKEND_URL", "http://127.0.0.1:8000"),
        help="Backend base URL (default: %(default)s)",
    )
    parser.add_argument(
        "--prefix",
        default=DEFAULT_PREFIX,
        help="Line prefix that marks CSI payloads (default: %(default)s)",
    )
    parser.add_argument(
        "--retry",
        type=float,
        default=float(os.getenv("CSI_HTTP_RETRY", "0.5")),
        help="Delay in seconds before retrying after an HTTP failure (default: %(default)s)",
    )
    return parser.parse_args(argv)


def forward_stream(args: argparse.Namespace) -> None:
    logging.info(
        "Starting serial bridge on %s @ %d baud -> %s",
        args.port,
        args.baud,
        args.backend,
    )

    while True:
        try:
            with serial.Serial(args.port, args.baud, timeout=1) as ser, httpx.Client(
                base_url=args.backend,
                timeout=httpx.Timeout(10.0, connect=5.0),
            ) as client:
                while True:
                    raw = ser.readline()
                    if not raw:
                        continue
                    try:
                        text = raw.decode("utf-8", errors="ignore").strip()
                    except UnicodeDecodeError:
                        logging.debug("Skipping undecodable line")
                        continue

                    if not text.startswith(args.prefix):
                        continue

                    payload_text = text[len(args.prefix) :]
                    try:
                        payload = json.loads(payload_text)
                    except json.JSONDecodeError:
                        logging.warning("Malformed JSON from serial: %s", payload_text[:80])
                        continue

                    try:
                        response = client.post("/csi", json=payload)
                        response.raise_for_status()
                    except httpx.HTTPError as exc:
                        logging.warning("HTTP post failed: %s", exc)
                        time.sleep(args.retry)
        except serial.SerialException as exc:
            logging.error("Serial connection error: %s", exc)
            time.sleep(2.0)
        except KeyboardInterrupt:
            logging.info("Interrupted, stopping")
            break


def main(argv: Optional[list[str]] = None) -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    args = parse_args(argv)
    forward_stream(args)
    return 0


if __name__ == "__main__":
    sys.exit(main())
