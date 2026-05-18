"use client";

import { useEffect, useState } from "react";
import { useMarket } from "@/lib/market-context";
import { usePortfolio } from "@/lib/portfolio-context";
import { useSelection } from "@/lib/selection-context";
import { fmt } from "@/lib/format";
import type { TradeSide } from "@/lib/types";

export function TradeBar() {
  const { selected } = useSelection();
  const { executeTrade } = usePortfolio();
  const { prices } = useMarket();
  const [ticker, setTicker] = useState(selected);
  const [quantity, setQuantity] = useState("10");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFill, setLastFill] = useState<{ side: TradeSide; ticker: string; price: number; quantity: number } | null>(null);

  useEffect(() => {
    setTicker(selected);
  }, [selected]);

  const live = prices[ticker]?.price ?? null;
  const qty = Number(quantity);
  const estimate = live != null && qty > 0 ? live * qty : null;

  async function submit(side: TradeSide) {
    if (!ticker || !quantity || qty <= 0) return;
    setBusy(true);
    setError(null);
    try {
      await executeTrade({ ticker: ticker.toUpperCase(), quantity: qty, side });
      setLastFill({ side, ticker: ticker.toUpperCase(), price: live ?? 0, quantity: qty });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" data-testid="trade-bar">
      <header className="panel-header justify-between">
        <div className="flex items-center gap-3">
          <span className="panel-title">Order Ticket</span>
          <span className="pill">Market · IOC</span>
        </div>
        {lastFill ? (
          <div className="text-2xs text-ink-muted">
            Filled <span className="text-ink">{lastFill.quantity}</span> {lastFill.ticker} {lastFill.side.toUpperCase()} @{" "}
            <span className="text-ink num">{fmt.price(lastFill.price)}</span>
          </div>
        ) : null}
      </header>

      <div className="flex items-stretch gap-2 p-3">
        <div className="flex-1 flex flex-col gap-1">
          <label className="label-2xs">Symbol</label>
          <input
            data-testid="trade-ticker-input"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            className="input-bare h-9"
            maxLength={10}
          />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <label className="label-2xs">Quantity</label>
          <input
            data-testid="trade-quantity-input"
            type="number"
            min="0"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="input-bare h-9"
          />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <label className="label-2xs">Last</label>
          <div className="h-9 flex items-center px-2 bg-bg-inset border border-line num text-sm text-ink">
            {fmt.price(live)}
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <label className="label-2xs">Est. Notional</label>
          <div className="h-9 flex items-center px-2 bg-bg-inset border border-line num text-sm text-accent-yellow">
            {fmt.money(estimate)}
          </div>
        </div>
        <div className="flex flex-col gap-1 justify-end">
          <div className="flex gap-2">
            <button
              data-testid="trade-buy-button"
              type="button"
              onClick={() => submit("buy")}
              disabled={busy || qty <= 0}
              className="btn-buy h-9 min-w-[88px]"
            >
              Buy
            </button>
            <button
              data-testid="trade-sell-button"
              type="button"
              onClick={() => submit("sell")}
              disabled={busy || qty <= 0}
              className="btn-sell h-9 min-w-[88px]"
            >
              Sell
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="px-3 py-1.5 text-2xs text-signal-down border-t border-line bg-signal-down/5" data-testid="trade-error">
          {error}
        </div>
      ) : null}
    </section>
  );
}
