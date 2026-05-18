"use client";

import { useState } from "react";
import { MarketProvider } from "@/lib/market-context";
import { PortfolioProvider } from "@/lib/portfolio-context";
import { SelectionProvider } from "@/lib/selection-context";
import { Header } from "./Header";
import { TickerTape } from "./TickerTape";
import { Watchlist } from "./Watchlist";
import { PriceChart } from "./PriceChart";
import { Positions } from "./Positions";
import { Heatmap } from "./Heatmap";
import { PnlChart } from "./PnlChart";
import { TradeBar } from "./TradeBar";
import { ChatPanel } from "./ChatPanel";

export function Workstation() {
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const chatWidth = chatCollapsed ? "38px" : "380px";

  return (
    <MarketProvider>
      <PortfolioProvider>
        <SelectionProvider initial="AAPL">
          <div className="flex flex-col h-screen min-h-[760px]">
            <Header />
            <TickerTape />

            <div className="flex-1 min-h-0 flex gap-px bg-line p-px">
              {/* Left rail: Watchlist */}
              <div className="w-[320px] min-h-0 bg-bg-base">
                <Watchlist />
              </div>

              {/* Center column: chart / row of heatmap+pnl / positions / trade bar */}
              <div className="flex-1 min-h-0 grid gap-px bg-line" style={{ gridTemplateRows: "1.4fr 1fr 1fr auto" }}>
                <div className="min-h-0 bg-bg-base">
                  <PriceChart />
                </div>
                <div className="min-h-0 bg-bg-base grid grid-cols-2 gap-px bg-line">
                  <div className="bg-bg-base min-h-0">
                    <Heatmap />
                  </div>
                  <div className="bg-bg-base min-h-0">
                    <PnlChart />
                  </div>
                </div>
                <div className="min-h-0 bg-bg-base">
                  <Positions />
                </div>
                <div className="bg-bg-base">
                  <TradeBar />
                </div>
              </div>

              {/* Right rail: AI Chat */}
              <div className="min-h-0 bg-bg-base transition-[width] duration-200" style={{ width: chatWidth }}>
                <ChatPanel collapsed={chatCollapsed} onToggle={() => setChatCollapsed((c) => !c)} />
              </div>
            </div>
          </div>
        </SelectionProvider>
      </PortfolioProvider>
    </MarketProvider>
  );
}
