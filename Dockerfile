# syntax=docker/dockerfile:1.7

# Stage 1: Build the Next.js frontend as a static export.
FROM node:20-slim AS frontend-build

WORKDIR /build

# Install dependencies first for better layer caching.
COPY frontend/package.json frontend/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy the rest of the frontend source and build the static export.
COPY frontend/ ./
RUN npm run build


# Stage 2: Python runtime serving FastAPI plus the static frontend.
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never \
    UV_PROJECT_ENVIRONMENT=/app/.venv \
    PATH=/app/.venv/bin:/root/.local/bin:$PATH

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && curl -LsSf https://astral.sh/uv/install.sh | sh

# Install Python dependencies from the lockfile before copying source for cache reuse.
COPY backend/pyproject.toml backend/uv.lock /app/backend/
WORKDIR /app/backend
RUN uv sync --frozen --no-install-project --no-dev

# Copy the backend application source and install the project itself.
COPY backend/ /app/backend/
RUN uv sync --frozen --no-dev

# Copy the built static frontend from stage 1.
COPY --from=frontend-build /build/out /app/static

# Volume-mounted SQLite database location.
RUN mkdir -p /app/db
VOLUME ["/app/db"]

ENV FINALLY_STATIC_DIR=/app/static \
    FINALLY_DB_PATH=/app/db/finally.db

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS http://localhost:8000/api/health || exit 1

CMD ["/app/.venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
