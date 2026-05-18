"use client";

import { useMemo } from "react";
import { usePortfolio } from "@/lib/portfolio-context";
import { useSelection } from "@/lib/selection-context";
import { fmt } from "@/lib/format";

interface TreeRect {
  x: number;
  y: number;
  w: number;
  h: number;
  ticker: string;
  weight: number;
  pl_pct: number;
}

function squarify(items: { ticker: string; weight: number; pl_pct: number }[], W: number, H: number): TreeRect[] {
  const total = items.reduce((s, i) => s + Math.max(i.weight, 0.0001), 0);
  if (total <= 0) return [];
  const sorted = [...items].sort((a, b) => b.weight - a.weight);

  const result: TreeRect[] = [];
  let area = W * H;
  let x = 0;
  let y = 0;
  let cw = W;
  let ch = H;

  const values = sorted.map((i) => (Math.max(i.weight, 0.0001) / total) * area);
  const data = sorted.map((s, i) => ({ ...s, v: values[i] }));

  function worst(row: number[], side: number): number {
    const s = row.reduce((a, b) => a + b, 0);
    const rmax = Math.max(...row);
    const rmin = Math.min(...row);
    return Math.max((side * side * rmax) / (s * s), (s * s) / (side * side * rmin));
  }

  let row: typeof data = [];
  const stack = [...data];

  while (stack.length > 0) {
    const side = Math.min(cw, ch);
    const next = stack[0];
    const trial = [...row, next].map((d) => d.v);
    const cur = row.map((d) => d.v);
    const wNew = worst(trial, side);
    const wCur = cur.length > 0 ? worst(cur, side) : Infinity;

    if (cur.length === 0 || wNew <= wCur) {
      row.push(next);
      stack.shift();
    } else {
      layoutRow();
      row = [];
    }
  }
  if (row.length > 0) layoutRow();
  return result;

  function layoutRow() {
    const side = Math.min(cw, ch);
    const rowSum = row.reduce((s, d) => s + d.v, 0);
    const rowSide = rowSum / side;
    let off = 0;
    const horizontal = cw >= ch;

    for (const d of row) {
      const len = d.v / rowSide;
      if (horizontal) {
        result.push({ x: x, y: y + off, w: rowSide, h: len, ticker: d.ticker, weight: d.weight, pl_pct: d.pl_pct });
        off += len;
      } else {
        result.push({ x: x + off, y: y, w: len, h: rowSide, ticker: d.ticker, weight: d.weight, pl_pct: d.pl_pct });
        off += len;
      }
    }

    if (horizontal) {
      x += rowSide;
      cw -= rowSide;
    } else {
      y += rowSide;
      ch -= rowSide;
    }
    area = cw * ch;
  }
}

function colorForPnl(pct: number): string {
  // Diverging green/red, clamped at ±5%
  const clamp = Math.max(-5, Math.min(5, pct));
  const t = Math.abs(clamp) / 5;
  if (clamp >= 0) {
    // 0% → dim line, 5% → strong green
    const alpha = 0.12 + t * 0.7;
    return `rgba(63, 185, 80, ${alpha.toFixed(3)})`;
  }
  const alpha = 0.12 + t * 0.7;
  return `rgba(248, 81, 73, ${alpha.toFixed(3)})`;
}

const VIEWBOX_W = 100;
const VIEWBOX_H = 100;

export function Heatmap() {
  const { portfolio } = usePortfolio();
  const { setSelected } = useSelection();

  const rects = useMemo(() => {
    if (!portfolio || portfolio.positions.length === 0) return [];
    const positions = portfolio.positions.filter((p) => p.market_value != null && p.market_value > 0);
    const totalMV = positions.reduce((s, p) => s + (p.market_value ?? 0), 0);
    if (totalMV <= 0) return [];

    const items = positions.map((p) => ({
      ticker: p.ticker,
      weight: (p.market_value ?? 0) / totalMV,
      pl_pct: p.unrealized_pl_percent ?? 0,
    }));
    return squarify(items, VIEWBOX_W, VIEWBOX_H);
  }, [portfolio]);

  return (
    <section className="panel flex flex-col h-full" data-testid="portfolio-heatmap">
      <header className="panel-header justify-between">
        <div className="flex items-center gap-3">
          <span className="panel-title">Portfolio Heatmap</span>
          <span className="pill">{rects.length} positions</span>
        </div>
        <div className="flex items-center gap-2 text-2xs text-ink-dim">
          <span className="inline-block h-2 w-3" style={{ background: colorForPnl(-5) }} /> loss
          <span className="inline-block h-2 w-3" style={{ background: colorForPnl(5) }} /> gain
        </div>
      </header>
      <div className="flex-1 p-2">
        {rects.length === 0 ? (
          <div className="h-full flex items-center justify-center text-2xs text-ink-faint">No positions yet.</div>
        ) : (
          <svg viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`} preserveAspectRatio="none" className="w-full h-full block">
            {rects.map((r) => {
              const fontSize = Math.max(1.4, Math.min(5, Math.sqrt(r.w * r.h) / 3.5));
              return (
                <g
                  key={r.ticker}
                  onClick={() => setSelected(r.ticker)}
                  className="cursor-pointer"
                  data-testid={`heatmap-cell-${r.ticker}`}
                >
                  <rect
                    x={r.x}
                    y={r.y}
                    width={r.w}
                    height={r.h}
                    fill={colorForPnl(r.pl_pct)}
                    stroke="#0d1117"
                    strokeWidth={0.4}
                  />
                  <text
                    x={r.x + r.w / 2}
                    y={r.y + r.h / 2 - fontSize * 0.1}
                    fill="#e6edf3"
                    fontSize={fontSize}
                    fontFamily="var(--font-mono), monospace"
                    fontWeight={600}
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{ pointerEvents: "none" }}
                  >
                    {r.ticker}
                  </text>
                  <text
                    x={r.x + r.w / 2}
                    y={r.y + r.h / 2 + fontSize * 1.1}
                    fill={r.pl_pct >= 0 ? "#bef0c6" : "#fbcbc8"}
                    fontSize={fontSize * 0.7}
                    fontFamily="var(--font-mono), monospace"
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{ pointerEvents: "none" }}
                  >
                    {fmt.pct(r.pl_pct)}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </section>
  );
}
