"use client";

import { useEffect, useMemo, useRef } from "react";
import { createChart, type IChartApi, type ISeriesApi, type LineData, type UTCTimestamp } from "lightweight-charts";
import { usePortfolio } from "@/lib/portfolio-context";
import { fmt } from "@/lib/format";

export function PnlChart() {
  const { history, portfolio } = usePortfolio();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  const points: LineData[] = useMemo(() => {
    if (!history) return [];
    const seen = new Set<number>();
    return history.snapshots
      .map((s) => ({
        time: Math.floor(new Date(s.recorded_at).getTime() / 1000) as UTCTimestamp,
        value: s.total_value,
      }))
      .filter((p) => {
        const t = p.time as number;
        if (seen.has(t)) return false;
        seen.add(t);
        return true;
      });
  }, [history]);

  const first = points[0]?.value ?? null;
  const last = points[points.length - 1]?.value ?? portfolio?.total_value ?? null;
  const sessionPl = first != null && last != null ? last - first : null;
  const sessionPct = first ? ((sessionPl ?? 0) / first) * 100 : null;
  const positive = (sessionPl ?? 0) >= 0;

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: { background: { color: "transparent" }, textColor: "#8b949e", fontFamily: "var(--font-mono), monospace", fontSize: 10 },
      rightPriceScale: { borderColor: "#1f2630", textColor: "#6b7380" },
      timeScale: { borderColor: "#1f2630", timeVisible: true, secondsVisible: false },
      grid: { vertLines: { color: "#171c25" }, horzLines: { color: "#171c25" } },
      crosshair: { vertLine: { color: "#ecad0a55", style: 3 }, horzLine: { color: "#ecad0a55", style: 3 } },
      autoSize: true,
    });
    const series = chart.addAreaSeries({
      lineColor: "#ecad0a",
      topColor: "#ecad0a44",
      bottomColor: "#ecad0a00",
      lineWidth: 2,
      lastValueVisible: true,
    });
    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => chart.applyOptions({}));
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.setData(points);
    if (points.length > 0) chartRef.current?.timeScale().fitContent();
  }, [points]);

  return (
    <section className="panel flex flex-col h-full" data-testid="pnl-chart">
      <header className="panel-header justify-between">
        <div className="flex items-center gap-3">
          <span className="panel-title">Portfolio · Total Value</span>
          <span className="pill">{points.length} pts</span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="num text-base text-ink">{fmt.money(last)}</span>
          <span className={`num text-2xs ${positive ? "text-up" : "text-down"}`}>
            {fmt.signed(sessionPl)} ({fmt.pct(sessionPct)})
          </span>
        </div>
      </header>
      <div ref={containerRef} className="flex-1" />
    </section>
  );
}
