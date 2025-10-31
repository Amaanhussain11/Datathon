#!/usr/bin/env bash
set -euo pipefail

# Run backend (server) and frontend (Vite) concurrently on separate ports
# Backend: http://localhost:4000
# Frontend: http://localhost:5173
# Fraud backend: http://localhost:4800

# Gracefully free a port if already in use
kill_port() {
  local PORT="$1"
  # Find PID(s) listening on port
  local PIDS
  PIDS=$(ss -ltnp 2>/dev/null | awk -v p=":${PORT}" '$4 ~ p { print $NF }' | sed -E 's/.*pid=([0-9]+).*/\1/' | sort -u || true)
  if [ -n "${PIDS}" ]; then
    echo "Port ${PORT} is in use by PID(s): ${PIDS}. Stopping them to avoid conflicts..."
    # Try graceful kill first, then force if needed
    for PID in ${PIDS}; do
      kill "${PID}" 2>/dev/null || true
    done
    sleep 0.5
    # Verify and force kill if still present
    for PID in ${PIDS}; do
      if ps -p "${PID}" >/dev/null 2>&1; then
        kill -9 "${PID}" 2>/dev/null || true
      fi
    done
  fi
}

# Ensure ports are free (prevents EADDRINUSE if a previous run is lingering)
kill_port 4000
kill_port 4800

# Start Node server
(
  cd server
  npm run dev
) &
SERVER_PID=$!

# Start Vite frontend
(
  cd Frontend
  npm run dev
) &
FRONTEND_PID=$!

# Start Fraud Detection backend
(
  cd fraud-detection-ai/backend
  npm run dev
) &
FRAUD_PID=$!

cleanup() {
  echo "\nShutting down..."
  kill ${SERVER_PID} ${FRONTEND_PID} ${FRAUD_PID} 2>/dev/null || true
}
trap cleanup EXIT INT TERM

wait
