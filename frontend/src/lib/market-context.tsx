"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { API_BASE_URL } from "./api";
import type { ConnectionState, PriceMap, PriceTick } from "./types";

const STREAM_URL = `${API_BASE_URL}/api/stream/prices`;
const SPARK_CAPACITY = 60;

interface SparkPoint {
  t: number;
  p: number;
}

interface MarketContextValue {
  prices: PriceMap;
  spark: Record<string, SparkPoint[]>;
  tickVersion: Record<string, number>;
  connection: ConnectionState;
  isMock: boolean;
}

const MarketContext = createContext<MarketContextValue | null>(null);

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [prices, setPrices] = useState<PriceMap>({});
  const [spark, setSpark] = useState<Record<string, SparkPoint[]>>({});
  const [tickVersion, setTickVersion] = useState<Record<string, number>>({});
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const esRef = useRef<EventSource | null>(null);
  const tickVersionRef = useRef<Record<string, number>>({});

  const ingest = useCallback((data: PriceMap) => {
    setPrices((prev) => {
      const next = { ...prev };
      const versionNext: Record<string, number> = {};
      let versionChanged = false;
      for (const [ticker, tick] of Object.entries(data)) {
        const prior = prev[ticker];
        if (!prior || prior.price !== tick.price) {
          versionNext[ticker] = (tickVersionRef.current[ticker] ?? 0) + 1;
          versionChanged = true;
        }
        next[ticker] = tick;
      }
      if (versionChanged) {
        tickVersionRef.current = { ...tickVersionRef.current, ...versionNext };
        setTickVersion(tickVersionRef.current);
      }
      return next;
    });
    setSpark((prev) => {
      const next = { ...prev };
      for (const [ticker, tick] of Object.entries(data)) {
        const arr = next[ticker] ? next[ticker].slice() : [];
        const last = arr[arr.length - 1];
        if (!last || last.p !== tick.price || last.t !== tick.timestamp) {
          arr.push({ t: tick.timestamp, p: tick.price });
          if (arr.length > SPARK_CAPACITY) arr.splice(0, arr.length - SPARK_CAPACITY);
          next[ticker] = arr;
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      setConnection((s) => (s === "connected" ? "reconnecting" : "connecting"));

      const es = new EventSource(STREAM_URL);
      esRef.current = es;

      es.onopen = () => {
        if (!cancelled) setConnection("connected");
      };

      es.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data) as PriceMap;
          ingest(data);
        } catch {
          /* ignore malformed events */
        }
      };

      es.onerror = () => {
        if (cancelled) return;
        setConnection("reconnecting");
        // EventSource auto-reconnects per the server's retry directive,
        // but if it ends up closed we re-open explicitly.
        if (es.readyState === EventSource.CLOSED) {
          es.close();
          esRef.current = null;
          setTimeout(connect, 1500);
        }
      };
    }

    connect();
    return () => {
      cancelled = true;
      esRef.current?.close();
      esRef.current = null;
    };
    // ingest closure intentionally not re-fired on every change; we want one connection per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<MarketContextValue>(
    () => ({ prices, spark, tickVersion, connection, isMock: false }),
    [prices, spark, tickVersion, connection],
  );

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket(): MarketContextValue {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error("useMarket must be used within MarketProvider");
  return ctx;
}

export function useTick(ticker: string | null | undefined): PriceTick | null {
  const { prices } = useMarket();
  if (!ticker) return null;
  return prices[ticker] ?? null;
}
