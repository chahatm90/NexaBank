#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."

echo "Stopping NexaBank services..."

for pidfile in "$SCRIPT_DIR/logs"/*.pid; do
  [ -f "$pidfile" ] || continue
  pid=$(cat "$pidfile")
  svc=$(basename "$pidfile" .pid)
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" && echo "  Stopped $svc (PID $pid)"
  fi
  rm "$pidfile"
done

echo "Done."
