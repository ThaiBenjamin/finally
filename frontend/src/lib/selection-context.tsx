"use client";

import { createContext, useContext, useMemo, useState } from "react";

interface SelectionContextValue {
  selected: string;
  setSelected: (t: string) => void;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children, initial = "AAPL" }: { children: React.ReactNode; initial?: string }) {
  const [selected, setSelected] = useState(initial);
  const value = useMemo(() => ({ selected, setSelected }), [selected]);
  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelection(): SelectionContextValue {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useSelection must be used within SelectionProvider");
  return ctx;
}
