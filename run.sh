#!/bin/bash
# run.sh — starts both servers.
# TTS server runs in the background; Vite dev server is in the foreground.
# Killing/exiting this script (Ctrl-C) also stops the TTS server.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

mkdir -p "$SCRIPT_DIR/logs"

#kill any server running on port 9997 (TTS server) before starting a fresh one
fuser -k 9997/tcp 2>/dev/null || true

echo "[run.sh] Starting Vite dev server → http://localhost:9997"
cd "$SCRIPT_DIR"
CHOKIDAR_USEPOLLING=true bun dev --port=9997 --host
