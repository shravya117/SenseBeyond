#!/usr/bin/env bash
set -euo pipefail

MODE="compose"
if [[ $# -gt 0 ]]; then
  case "$1" in
    compose|docker)
      MODE="compose"
      ;;
    local)
      MODE="local"
      ;;
    *)
      echo "Unknown option '$1'. Use 'compose' (default) or 'local'." >&2
      exit 1
      ;;
  esac
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

pick_python() {
  if command_exists python3; then
    echo python3
  elif command_exists python; then
    echo python
  else
    echo ""
  fi
}

start_compose() {
  if command_exists docker-compose; then
    exec docker-compose -f "${ROOT_DIR}/docker-compose.yml" up --build
  elif command_exists docker; then
    exec docker compose -f "${ROOT_DIR}/docker-compose.yml" up --build
  else
    echo "Docker is required for compose mode." >&2
    exit 1
  fi
}

start_local() {
  local py_bin
  py_bin="$(pick_python)"
  if [[ -z "$py_bin" ]]; then
    echo "Python 3.11+ is required for local mode." >&2
    exit 1
  fi

  pushd "$BACKEND_DIR" >/dev/null
  if [[ ! -d .venv ]]; then
    echo "Missing backend virtual environment. Run ./setup.sh first." >&2
    exit 1
  fi
  if [[ -f .venv/Scripts/activate ]]; then
    source .venv/Scripts/activate
  else
    source .venv/bin/activate
  fi

  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
  BACKEND_PID=$!
  popd >/dev/null

  pushd "$FRONTEND_DIR" >/dev/null
  npm run dev -- --host &
  FRONTEND_PID=$!
  popd >/dev/null

  cleanup() {
    trap - INT TERM EXIT
    kill "$BACKEND_PID" "$FRONTEND_PID" >/dev/null 2>&1 || true
  }

  trap cleanup INT TERM EXIT
  wait "$BACKEND_PID"
  wait "$FRONTEND_PID"
}

if [[ "$MODE" == "compose" ]]; then
  start_compose
else
  start_local
fi