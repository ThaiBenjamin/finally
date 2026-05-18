"use client";

import type { ConnectionState } from "@/lib/types";

const labels: Record<ConnectionState, string> = {
  connecting: "Connecting",
  connected: "Live",
  reconnecting: "Reconnecting",
  disconnected: "Offline",
};

const colors: Record<ConnectionState, string> = {
  connecting: "bg-accent-yellow",
  connected: "bg-signal-up",
  reconnecting: "bg-accent-yellow",
  disconnected: "bg-signal-down",
};

export function ConnectionDot({ state }: { state: ConnectionState }) {
  return (
    <div className="flex items-center gap-2" data-testid="connection-status" data-state={state}>
      <span className="relative inline-flex">
        <span
          className={`absolute inline-flex h-full w-full rounded-full ${colors[state]} opacity-50 ${
            state === "connected" ? "animate-ping" : ""
          }`}
        />
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${colors[state]}`} />
      </span>
      <span className="label-2xs text-ink-muted">{labels[state]}</span>
    </div>
  );
}
