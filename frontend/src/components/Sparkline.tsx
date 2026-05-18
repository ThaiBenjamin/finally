"use client";

import { useMemo } from "react";

interface SparklineProps {
  data: { t: number; p: number }[];
  width?: number;
  height?: number;
  direction?: "up" | "down" | "flat" | null;
}

export function Sparkline({ data, width = 96, height = 28, direction }: SparklineProps) {
  const { path, area, color } = useMemo(() => {
    if (data.length < 2) return { path: "", area: "", color: "#6b7380" };

    const xs = data.map((_, i) => i);
    const ys = data.map((d) => d.p);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const range = maxY - minY || 1;
    const minX = xs[0];
    const maxX = xs[xs.length - 1];
    const xRange = maxX - minX || 1;

    const pad = 1.5;
    const sx = (x: number) => pad + ((x - minX) / xRange) * (width - pad * 2);
    const sy = (y: number) => pad + (1 - (y - minY) / range) * (height - pad * 2);

    const pts = data.map((d, i) => `${sx(xs[i]).toFixed(2)},${sy(d.p).toFixed(2)}`);
    const line = `M ${pts.join(" L ")}`;
    const fill = `${line} L ${sx(maxX).toFixed(2)},${(height - pad).toFixed(2)} L ${sx(minX).toFixed(2)},${(height - pad).toFixed(2)} Z`;

    const trend = data[data.length - 1].p - data[0].p;
    const c = direction === "down" || trend < 0 ? "#f85149" : trend > 0 ? "#3fb950" : "#6b7380";

    return { path: line, area: fill, color: c };
  }, [data, width, height, direction]);

  if (data.length < 2) {
    return (
      <svg width={width} height={height} className="overflow-visible">
        <line
          x1={1}
          y1={height / 2}
          x2={width - 1}
          y2={height / 2}
          stroke="#2a3340"
          strokeWidth={1}
          strokeDasharray="2 3"
        />
      </svg>
    );
  }

  const gradId = `sg-${color.replace("#", "")}`;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
