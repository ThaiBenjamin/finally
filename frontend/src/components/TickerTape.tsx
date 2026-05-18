"use client";

import { useMemo } from "react";
import { useMarket } from "@/lib/market-context";
import { usePortfolio } from "@/lib/portfolio-context";
import { directionClass, fmt } from "@/lib/format";

export function TickerTape() {
  const { prices } = useMarket();
  const { watchlist } = usePortfolio();

  const items = useMemo(() => {
    const tickers = watchlist.map((w) => w.ticker);
    return tickers
      .map((t) => prices[t])
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
  }, [watchlist, prices]);

  if (items.length === 0) {
    return (
      <div className="h-9 border-b border-line bg-bg-base/60 flex items-center px-4 text-2xs text-ink-faint uppercase tracking-[0.16em]">
        Awaiting stream…
      </div>
    );
  }

  const doubled = [...items, ...items];

  return (
    <div className="relative h-9 border-b border-line overflow-hidden bg-bg-base/60" aria-hidden>
      <div className="absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-bg-base to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-bg-base to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 flex items-center gap-8 whitespace-nowrap" style={{ animation: "tape 60s linear infinite" }}>
        {doubled.map((t, i) => (
          <span key={`${t.ticker}-${i}`} className="flex items-center gap-2 text-xs font-mono">
            <span className="text-ink-muted">{t.ticker}</span>
            <span className="text-ink num">{fmt.price(t.price)}</span>
            <span className={`num ${directionClass(t.direction)}`}>{fmt.pct(t.change_percent)}</span>
          </span>
        ))}
      </div>
      <style jsx global>{`
        @keyframes tape {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
