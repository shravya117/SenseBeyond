#!/usr/bin/env bash
set -euo pipefail

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
    echo "";
  fi
}

ensure_tooling() {
  local missing=()
  for tool in node npm; do
    if ! command_exists "$tool"; then
      missing+=("$tool")
    fi
  done
  if [[ ${#missing[@]} -gt 0 ]]; then
    echo "Missing required tools: ${missing[*]}" >&2
    echo "Install Node.js 20.10+ before continuing." >&2
    exit 1
  fi

  local py_bin
  py_bin="$(pick_python)"
  if [[ -z "$py_bin" ]]; then
    echo "Python 3.11+ is required but was not found in PATH." >&2
    exit 1
  fi
}

create_backend_env() {
  local py_bin
  py_bin="$(pick_python)"
  pushd "$BACKEND_DIR" >/dev/null
  if [[ ! -d .venv ]]; then
    "$py_bin" -m venv .venv
  fi

  if [[ -f .venv/Scripts/activate ]]; then
    # Windows (Git Bash / PowerShell compatible path)
    source .venv/Scripts/activate
  else
    source .venv/bin/activate
  fi

  pip install --upgrade pip >/dev/null
  pip install --editable .

  if [[ ! -f .env && -f .env.example ]]; then
    cp .env.example .env
  fi
  deactivate
  popd >/dev/null
}

install_frontend_packages() {
  pushd "$FRONTEND_DIR" >/dev/null
  npm install
  popd >/dev/null
}

ensure_tooling
create_backend_env
install_frontend_packages

echo "Setup complete. Activate backend venv with 'source backend/.venv/bin/activate' (or Scripts/activate on Windows) before local development."