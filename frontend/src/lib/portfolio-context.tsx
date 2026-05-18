"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";
import type { PortfolioHistoryResponse, PortfolioResponse, TradeRequest, WatchlistItem } from "./types";

interface PortfolioContextValue {
  portfolio: PortfolioResponse | null;
  history: PortfolioHistoryResponse | null;
  watchlist: WatchlistItem[];
  loading: boolean;
  error: string | null;
  refreshAll: () => Promise<void>;
  refreshPortfolio: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  refreshWatchlist: () => Promise<void>;
  executeTrade: (req: TradeRequest) => Promise<void>;
  addToWatchlist: (ticker: string) => Promise<void>;
  removeFromWatchlist: (ticker: string) => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

const HISTORY_POLL_MS = 30_000;

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [history, setHistory] = useState<PortfolioHistoryResponse | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const historyTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshPortfolio = useCallback(async () => {
    try {
      const data = await api.portfolio();
      setPortfolio(data);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const refreshHistory = useCallback(async () => {
    try {
      const data = await api.history();
      setHistory(data);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const refreshWatchlist = useCallback(async () => {
    try {
      const data = await api.watchlist();
      setWatchlist(data);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([refreshPortfolio(), refreshHistory(), refreshWatchlist()]);
    setLoading(false);
  }, [refreshPortfolio, refreshHistory, refreshWatchlist]);

  const executeTrade = useCallback(
    async (req: TradeRequest) => {
      const res = await api.trade(req);
      setPortfolio(res.portfolio);
      await refreshHistory();
    },
    [refreshHistory],
  );

  const addToWatchlist = useCallback(
    async (ticker: string) => {
      await api.addWatchlist(ticker);
      await refreshWatchlist();
    },
    [refreshWatchlist],
  );

  const removeFromWatchlist = useCallback(
    async (ticker: string) => {
      await api.removeWatchlist(ticker);
      await refreshWatchlist();
    },
    [refreshWatchlist],
  );

  useEffect(() => {
    refreshAll();
    historyTimer.current = setInterval(refreshHistory, HISTORY_POLL_MS);
    return () => {
      if (historyTimer.current) clearInterval(historyTimer.current);
    };
  }, [refreshAll, refreshHistory]);

  const value = useMemo<PortfolioContextValue>(
    () => ({
      portfolio,
      history,
      watchlist,
      loading,
      error,
      refreshAll,
      refreshPortfolio,
      refreshHistory,
      refreshWatchlist,
      executeTrade,
      addToWatchlist,
      removeFromWatchlist,
    }),
    [portfolio, history, watchlist, loading, error, refreshAll, refreshPortfolio, refreshHistory, refreshWatchlist, executeTrade, addToWatchlist, removeFromWatchlist],
  );

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used within PortfolioProvider");
  return ctx;
}
