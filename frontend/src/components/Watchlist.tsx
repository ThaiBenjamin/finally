"use client";

import { useMemo, useState } from "react";
import { useMarket } from "@/lib/market-context";
import { usePortfolio } from "@/lib/portfolio-context";
import { useSelection } from "@/lib/selection-context";
import { directionClass, fmt } from "@/lib/format";
import { Sparkline } from "./Sparkline";

export function Watchlist() {
  const { prices, spark, tickVersion } = useMarket();
  const { watchlist, addToWatchlist, removeFromWatchlist } = usePortfolio();
  const { selected, setSelected } = useSelection();
  const [adding, setAdding] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    return watchlist.map((w) => {
      const live = prices[w.ticker];
      return {
        ticker: w.ticker,
        price: live?.price ?? w.price,
        change: live?.change ?? w.change,
        changePct: live?.change_percent ?? w.change_percent,
        direction: live?.direction ?? w.direction,
        spark: spark[w.ticker] ?? [],
        version: tickVersion[w.ticker] ?? 0,
      };
    });
  }, [watchlist, prices, spark, tickVersion]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const t = adding.trim().toUpperCase();
    if (!t) return;
    setBusy(true);
    setError(null);
    try {
      await addToWatchlist(t);
      setAdding("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(ticker: string) {
    setError(null);
    try {
      await removeFromWatchlist(ticker);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <section className="panel flex flex-col h-full" data-testid="watchlist-panel">
      <header className="panel-header justify-between">
        <div className="flex items-center gap-3">
          <span className="panel-title">Watchlist</span>
          <span className="pill">{rows.length} symbols</span>
        </div>
        <form onSubmit={handleAdd} className="flex items-center gap-1.5">
          <input
            data-testid="watchlist-add-input"
            value={adding}
            onChange={(e) => setAdding(e.target.value.toUpperCase())}
            placeholder="ADD TICKER"
            className="input-bare w-28 py-1 text-xs"
            maxLength={10}
          />
          <button
            data-testid="watchlist-add-button"
            disabled={busy || !adding.trim()}
            className="btn-submit py-1 px-2 text-2xs"
            type="submit"
          >
            +
          </button>
        </form>
      </header>

      {error ? (
        <div className="px-3 py-1.5 text-2xs text-signal-down border-b border-line bg-signal-down/5">{error}</div>
      ) : null}

      <div className="grid grid-cols-[56px_1fr_88px_72px_96px_18px] gap-0 px-3 py-1.5 text-2xs uppercase tracking-[0.16em] text-ink-faint border-b border-line">
        <div>Sym</div>
        <div className="text-ink-dim">Name</div>
        <div className="text-right">Last</div>
        <div className="text-right">Chg%</div>
        <div className="text-right">1m</div>
        <div />
      </div>

      <ul className="flex-1 overflow-y-auto divide-y divide-line-subtle">
        {rows.map((r) => {
          const isSelected = r.ticker === selected;
          return (
            <li
              key={r.ticker}
              data-testid={`watchlist-row-${r.ticker}`}
              data-ticker={r.ticker}
              onClick={() => setSelected(r.ticker)}
              className={`group grid grid-cols-[56px_1fr_88px_72px_96px_18px] items-center gap-0 px-3 py-2 cursor-pointer hover:bg-bg-raised/60 transition-colors ${
                isSelected ? "bg-accent-blue/5 border-l-2 border-l-accent-blue -ml-px pl-[10px]" : ""
              }`}
            >
              <div className="font-mono text-sm text-ink font-medium">{r.ticker}</div>
              <div className="text-2xs text-ink-dim truncate">{TICKER_NAMES[r.ticker] ?? "—"}</div>
              <div
                key={r.version}
                className={`text-right num text-sm tabular-nums px-1.5 ${
                  r.direction === "up" ? "flash-up" : r.direction === "down" ? "flash-down" : ""
                }`}
                data-testid={`watchlist-price-${r.ticker}`}
              >
                {fmt.price(r.price)}
              </div>
              <div className={`text-right num text-xs ${directionClass(r.direction)}`}>{fmt.pct(r.changePct)}</div>
              <div className="flex justify-end">
                <Sparkline data={r.spark} direction={r.direction as "up" | "down" | "flat" | null | undefined} />
              </div>
              <button
                aria-label={`Remove ${r.ticker}`}
                data-testid={`watchlist-remove-${r.ticker}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(r.ticker);
                }}
                className="opacity-0 group-hover:opacity-100 text-ink-faint hover:text-signal-down text-sm leading-none"
              >
                ×
              </button>
            </li>
          );
        })}
        {rows.length === 0 ? (
          <li className="px-3 py-6 text-center text-2xs text-ink-faint">No symbols. Add one above.</li>
        ) : null}
      </ul>
    </section>
  );
}

const TICKER_NAMES: Record<string, string> = {
  AAPL: "Apple Inc.",
  GOOGL: "Alphabet Inc.",
  MSFT: "Microsoft Corp.",
  AMZN: "Amazon.com Inc.",
  TSLA: "Tesla Inc.",
  NVDA: "Nvidia Corp.",
  META: "Meta Platforms",
  JPM: "JPMorgan Chase",
  V: "Visa Inc.",
  NFLX: "Netflix Inc.",
};
