#!/usr/bin/env bash
# Stop and remove the FinAlly container (macOS/Linux). Idempotent.
# The named volume is preserved so data persists across restarts.

set -euo pipefail

CONTAINER="finally"

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker is not installed or not on PATH." >&2
  exit 1
fi

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "Stopping and removing container $CONTAINER..."
  docker rm -f "$CONTAINER" >/dev/null
  echo "Done. Volume 'finally-data' is preserved."
else
  echo "Container $CONTAINER is not running."
fi
