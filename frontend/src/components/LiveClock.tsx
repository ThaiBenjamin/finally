"use client";

import { useEffect, useState } from "react";

export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return <div className="num text-xs text-ink-muted w-[6.5rem]">--:--:--</div>;
  return (
    <div className="text-right leading-tight">
      <div className="num text-xs text-ink">
        {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
      </div>
      <div className="label-2xs">
        {now.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })}
      </div>
    </div>
  );
}
