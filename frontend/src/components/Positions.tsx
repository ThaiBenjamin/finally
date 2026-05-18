"use client";

import { useMemo } from "react";
import { useMarket } from "@/lib/market-context";
import { usePortfolio } from "@/lib/portfolio-context";
import { useSelection } from "@/lib/selection-context";
import { directionClass, fmt, pnlClass } from "@/lib/format";

export function Positions() {
  const { portfolio } = usePortfolio();
  const { prices, tickVersion } = useMarket();
  const { selected, setSelected } = useSelection();

  const rows = useMemo(() => {
    if (!portfolio) return [];
    return portfolio.positions
      .map((p) => {
        const live = prices[p.ticker];
        const price = live?.price ?? p.current_price ?? p.avg_cost;
        const mv = price * p.quantity;
        const pl = mv - p.avg_cost * p.quantity;
        const plPct = p.avg_cost > 0 ? (pl / (p.avg_cost * p.quantity)) * 100 : 0;
        return {
          ticker: p.ticker,
          quantity: p.quantity,
          avg_cost: p.avg_cost,
          current_price: price,
          market_value: mv,
          unrealized_pl: pl,
          unrealized_pl_percent: plPct,
          direction: live?.direction ?? null,
          version: tickVersion[p.ticker] ?? 0,
        };
      })
      .sort((a, b) => b.market_value - a.market_value);
  }, [portfolio, prices, tickVersion]);

  return (
    <section className="panel flex flex-col h-full" data-testid="positions-table">
      <header className="panel-header justify-between">
        <span className="panel-title">Positions</span>
        <span className="pill">{rows.length}</span>
      </header>

      <div className="grid grid-cols-[1fr_72px_88px_88px_92px_72px] gap-0 px-3 py-1.5 text-2xs uppercase tracking-[0.16em] text-ink-faint border-b border-line">
        <div>Symbol</div>
        <div className="text-right">Qty</div>
        <div className="text-right">Avg</div>
        <div className="text-right">Last</div>
        <div className="text-right">P/L</div>
        <div className="text-right">%</div>
      </div>

      <ul className="flex-1 overflow-y-auto divide-y divide-line-subtle">
        {rows.map((r) => {
          const isSelected = r.ticker === selected;
          return (
            <li
              key={r.ticker}
              data-testid={`position-row-${r.ticker}`}
              onClick={() => setSelected(r.ticker)}
              className={`grid grid-cols-[1fr_72px_88px_88px_92px_72px] items-center gap-0 px-3 py-2 cursor-pointer hover:bg-bg-raised/60 transition-colors ${
                isSelected ? "bg-accent-blue/5" : ""
              }`}
            >
              <div className="font-mono text-sm text-ink font-medium">{r.ticker}</div>
              <div
                className="text-right num text-sm"
                data-testid={`position-quantity-${r.ticker}`}
              >
                {fmt.qty(r.quantity)}
              </div>
              <div className="text-right num text-xs text-ink-muted">{fmt.price(r.avg_cost)}</div>
              <div
                key={r.version}
                className={`text-right num text-sm px-1.5 ${
                  r.direction === "up" ? "flash-up" : r.direction === "down" ? "flash-down" : ""
                } ${directionClass(r.direction)}`}
              >
                {fmt.price(r.current_price)}
              </div>
              <div className={`text-right num text-sm ${pnlClass(r.unrealized_pl)}`}>{fmt.signed(r.unrealized_pl)}</div>
              <div className={`text-right num text-xs ${pnlClass(r.unrealized_pl)}`}>{fmt.pct(r.unrealized_pl_percent)}</div>
            </li>
          );
        })}
        {rows.length === 0 ? (
          <li className="px-3 py-6 text-center text-2xs text-ink-faint">No open positions.</li>
        ) : null}
      </ul>
    </section>
  );
}
