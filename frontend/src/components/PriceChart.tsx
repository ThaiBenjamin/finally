"use client";

import { useEffect, useRef } from "react";
import { createChart, type IChartApi, type ISeriesApi, type LineData, type UTCTimestamp } from "lightweight-charts";
import { useMarket } from "@/lib/market-context";
import { useSelection } from "@/lib/selection-context";
import { directionClass, fmt } from "@/lib/format";

export function PriceChart() {
  const { selected } = useSelection();
  const { prices, spark, tickVersion } = useMarket();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const lastTickerRef = useRef<string | null>(null);

  const tick = prices[selected];
  const sparkData = spark[selected] ?? [];

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#8b949e",
        fontFamily: "var(--font-mono), monospace",
        fontSize: 10,
      },
      rightPriceScale: {
        borderColor: "#1f2630",
        textColor: "#6b7380",
      },
      timeScale: {
        borderColor: "#1f2630",
        timeVisible: true,
        secondsVisible: true,
        ticksVisible: true,
      },
      grid: {
        vertLines: { color: "#171c25" },
        horzLines: { color: "#171c25" },
      },
      crosshair: {
        vertLine: { color: "#ecad0a55", width: 1, style: 3 },
        horzLine: { color: "#ecad0a55", width: 1, style: 3 },
      },
      autoSize: true,
    });

    const series = chart.addAreaSeries({
      lineColor: "#209dd7",
      topColor: "#209dd755",
      bottomColor: "#209dd700",
      lineWidth: 2,
      priceLineColor: "#ecad0a",
      priceLineWidth: 1,
      priceLineStyle: 2,
      lastValueVisible: true,
      crosshairMarkerBackgroundColor: "#ecad0a",
      crosshairMarkerBorderColor: "#0d1117",
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
    const data: LineData[] = sparkData.map((d) => ({
      time: Math.floor(d.t) as UTCTimestamp,
      value: d.p,
    }));
    // de-dupe by timestamp (lightweight-charts requires strictly increasing time)
    const seen = new Set<number>();
    const unique = data.filter((d) => {
      const t = d.time as number;
      if (seen.has(t)) return false;
      seen.add(t);
      return true;
    });

    seriesRef.current.setData(unique);
    if (lastTickerRef.current !== selected) {
      chartRef.current?.timeScale().fitContent();
      lastTickerRef.current = selected;
    }
  }, [sparkData, selected]);

  return (
    <section className="panel flex flex-col h-full relative overflow-hidden" data-testid="price-chart">
      <header className="panel-header justify-between">
        <div className="flex items-center gap-4">
          <span className="panel-title text-base tracking-tight">{selected}</span>
          <span className="text-2xs text-ink-dim">/ USD</span>
          <span className="pill">Live</span>
        </div>
        <div className="flex items-baseline gap-4">
          <span
            key={tickVersion[selected] ?? 0}
            className={`num text-2xl text-ink ${tick?.direction === "up" ? "flash-up" : tick?.direction === "down" ? "flash-down" : ""}`}
            data-testid={`chart-price-${selected}`}
          >
            {fmt.price(tick?.price)}
          </span>
          <span className={`num text-sm ${directionClass(tick?.direction)}`}>
            {fmt.signed(tick?.change)} ({fmt.pct(tick?.change_percent)})
          </span>
        </div>
      </header>
      <div ref={containerRef} className="flex-1" />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-line/50" />
    </section>
  );
}
