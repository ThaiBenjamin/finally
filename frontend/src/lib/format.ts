const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const pct = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const qty = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

export const fmt = {
  price(v: number | null | undefined): string {
    if (v == null || Number.isNaN(v)) return "—";
    return usd.format(v);
  },
  money(v: number | null | undefined): string {
    if (v == null || Number.isNaN(v)) return "—";
    return usdCompact.format(v);
  },
  pct(v: number | null | undefined, signed = true): string {
    if (v == null || Number.isNaN(v)) return "—";
    const s = pct.format(Math.abs(v));
    if (!signed) return `${s}%`;
    return `${v > 0 ? "+" : v < 0 ? "-" : ""}${s}%`;
  },
  qty(v: number | null | undefined): string {
    if (v == null || Number.isNaN(v)) return "—";
    return qty.format(v);
  },
  signed(v: number | null | undefined): string {
    if (v == null || Number.isNaN(v)) return "—";
    const s = usd.format(Math.abs(v));
    return `${v > 0 ? "+" : v < 0 ? "-" : ""}${s}`;
  },
  time(iso: string): string {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return iso;
    }
  },
};

export function directionClass(direction: string | null | undefined): string {
  if (direction === "up") return "text-up";
  if (direction === "down") return "text-down";
  return "text-flat";
}

export function pnlClass(v: number | null | undefined): string {
  if (v == null || v === 0) return "text-flat";
  return v > 0 ? "text-up" : "text-down";
}
