#!/usr/bin/env bash
# Start the FinAlly container (macOS/Linux). Idempotent.
# Flags:
#   --build   Force a rebuild of the Docker image.
#   --open    Open http://localhost:8000 in the default browser when ready.

set -euo pipefail

IMAGE="finally:latest"
CONTAINER="finally"
PORT="8000"
VOLUME="finally-data"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

FORCE_BUILD=0
OPEN_BROWSER=0
for arg in "$@"; do
  case "$arg" in
    --build) FORCE_BUILD=1 ;;
    --open)  OPEN_BROWSER=1 ;;
    -h|--help)
      echo "Usage: $0 [--build] [--open]"
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 2
      ;;
  esac
done

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker is not installed or not on PATH." >&2
  exit 1
fi

if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    echo "No .env found - copying .env.example to .env. Edit it to add your API keys."
    cp .env.example .env
  else
    echo "ERROR: .env not found and .env.example missing." >&2
    exit 1
  fi
fi

if [ "$FORCE_BUILD" -eq 1 ] || ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
  echo "Building image $IMAGE..."
  docker build -t "$IMAGE" .
fi

# If the container exists in any state, remove it before starting fresh.
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "Removing existing container $CONTAINER..."
  docker rm -f "$CONTAINER" >/dev/null
fi

echo "Starting container $CONTAINER on port $PORT..."
docker run -d \
  --name "$CONTAINER" \
  --env-file .env \
  -v "${VOLUME}:/app/db" \
  -p "${PORT}:8000" \
  --restart unless-stopped \
  "$IMAGE" >/dev/null

URL="http://localhost:${PORT}"
echo "FinAlly is starting at ${URL}"
echo "Use 'docker logs -f ${CONTAINER}' to follow logs."

if [ "$OPEN_BROWSER" -eq 1 ]; then
  if command -v open >/dev/null 2>&1; then
    open "$URL"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL"
  fi
fi
