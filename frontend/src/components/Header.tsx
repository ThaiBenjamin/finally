"use client";

import { useMarket } from "@/lib/market-context";
import { usePortfolio } from "@/lib/portfolio-context";
import { fmt, pnlClass } from "@/lib/format";
import { ConnectionDot } from "./ConnectionDot";
import { LiveClock } from "./LiveClock";

export function Header() {
  const { connection } = useMarket();
  const { portfolio } = usePortfolio();

  const total = portfolio?.total_value ?? null;
  const cash = portfolio?.cash_balance ?? null;
  const pnl = portfolio?.unrealized_pl ?? null;
  const positionsValue = portfolio?.positions_value ?? null;

  return (
    <header className="relative border-b border-line bg-bg-base/80 backdrop-blur">
      <div className="flex items-stretch">
        <div className="flex items-center gap-3 px-5 py-3 border-r border-line">
          <div className="flex h-9 w-9 items-center justify-center bg-accent-yellow text-bg-base font-display text-2xl leading-none">
            F
          </div>
          <div className="leading-tight">
            <div className="font-display text-2xl text-ink tracking-tight">FinAlly</div>
            <div className="label-2xs text-accent-yellow/80">Finance · Ally</div>
          </div>
        </div>

        <Metric label="Total Value" value={fmt.money(total)} accent testId="header-total-value" />
        <Metric label="Cash" value={fmt.money(cash)} testId="header-cash-balance" />
        <Metric label="Positions" value={fmt.money(positionsValue)} />
        <Metric
          label="Unrealized P/L"
          value={fmt.signed(pnl)}
          valueClass={pnlClass(pnl)}
          sub={portfolio && portfolio.total_value > 0 ? fmt.pct((pnl ?? 0) / (portfolio.total_value - (pnl ?? 0)) * 100, true) : undefined}
        />

        <div className="ml-auto flex items-center gap-6 px-5 py-3 border-l border-line">
          <LiveClock />
          <ConnectionDot state={connection} />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-accent-yellow/40 to-transparent" />
    </header>
  );
}

function Metric({
  label,
  value,
  sub,
  accent,
  valueClass,
  testId,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  valueClass?: string;
  testId?: string;
}) {
  return (
    <div className="flex flex-col justify-center px-5 py-3 border-r border-line min-w-[160px]">
      <div className="label-2xs">{label}</div>
      <div
        data-testid={testId}
        className={`num text-lg ${accent ? "text-accent-yellow" : "text-ink"} ${valueClass ?? ""}`}
      >
        {value}
      </div>
      {sub ? <div className={`num text-2xs ${valueClass ?? "text-ink-muted"}`}>{sub}</div> : null}
    </div>
  );
}
