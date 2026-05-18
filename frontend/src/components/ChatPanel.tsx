"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { usePortfolio } from "@/lib/portfolio-context";
import { fmt } from "@/lib/format";
import type { ChatMessage, ChatTrade, ChatWatchlistChange } from "@/lib/types";

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface ChatPanelProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function ChatPanel({ collapsed, onToggle }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "FinAlly online. I can see your watchlist and positions. Ask me to analyze the book, suggest a hedge, or place a trade.",
      created_at: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const { refreshAll } = usePortfolio();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && typeof el.scrollTo === "function") {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, pending]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || pending) return;

    const userMsg: ChatMessage = { id: makeId(), role: "user", content: text, created_at: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setPending(true);

    try {
      const res = await api.chat(text);
      const assistantMsg: ChatMessage = {
        id: makeId(),
        role: "assistant",
        content: res.message,
        trades: res.trades,
        watchlist_changes: res.watchlist_changes,
        created_at: res.created_at ?? new Date().toISOString(),
      };
      setMessages((m) => [...m, assistantMsg]);
      const hadEffect = (res.trades?.length ?? 0) > 0 || (res.watchlist_changes?.length ?? 0) > 0;
      if (hadEffect) await refreshAll();
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: makeId(),
          role: "assistant",
          content: `Connection error: ${(err as Error).message}`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        data-testid="chat-toggle"
        className="panel flex flex-col items-center gap-3 py-4 px-2 hover:bg-bg-raised transition-colors h-full w-full"
        aria-label="Open AI copilot"
      >
        <span className="label-2xs text-accent-purple [writing-mode:vertical-rl] rotate-180">AI Copilot</span>
        <span className="text-accent-purple">›</span>
      </button>
    );
  }

  return (
    <section className="panel flex flex-col h-full" data-testid="chat-panel">
      <header className="panel-header justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-purple animate-pulse-dot" />
          <span className="panel-title">FinAlly · Copilot</span>
        </div>
        <button
          data-testid="chat-collapse"
          onClick={onToggle}
          className="text-ink-muted hover:text-ink text-xs"
          aria-label="Collapse chat"
        >
          ‹
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.map((m) => (
          <ChatBubble key={m.id} msg={m} />
        ))}
        {pending ? <PendingBubble /> : null}
      </div>

      <form onSubmit={send} className="flex items-stretch gap-2 p-2 border-t border-line">
        <input
          data-testid="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask FinAlly to analyze, hedge, or trade…"
          className="input-bare flex-1"
          disabled={pending}
        />
        <button
          data-testid="chat-send-button"
          type="submit"
          disabled={pending || !input.trim()}
          className="btn-submit min-w-[72px]"
        >
          Send
        </button>
      </form>
    </section>
  );
}

function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div
      data-testid="chat-message"
      data-role={msg.role}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[90%] ${
          isUser
            ? "bg-accent-blue/10 border border-accent-blue/30 text-ink"
            : "bg-bg-raised border border-line text-ink"
        } px-3 py-2 text-sm font-sans leading-snug`}
      >
        <div className={`label-2xs mb-1 ${isUser ? "text-accent-blue" : "text-accent-yellow"}`}>
          {isUser ? "You" : "FinAlly"}
        </div>
        <div className="whitespace-pre-wrap">{msg.content}</div>
        {msg.trades && msg.trades.length > 0 ? (
          <div className="mt-2 space-y-1">
            {msg.trades.map((t, i) => (
              <TradeRow key={`t-${i}`} trade={t} />
            ))}
          </div>
        ) : null}
        {msg.watchlist_changes && msg.watchlist_changes.length > 0 ? (
          <div className="mt-2 space-y-1">
            {msg.watchlist_changes.map((w, i) => (
              <WatchRow key={`w-${i}`} change={w} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TradeRow({ trade }: { trade: ChatTrade }) {
  const ok = trade.status === "executed";
  const detail = ok
    ? `${trade.side.toUpperCase()} ${trade.quantity} ${trade.ticker}${trade.price != null ? ` @ ${fmt.price(trade.price)}` : ""}`
    : `${trade.side.toUpperCase()} ${trade.quantity} ${trade.ticker} — ${trade.error ?? "failed"}`;
  return (
    <div
      data-testid="chat-trade-confirmation"
      data-status={trade.status}
      className={`flex items-center gap-2 px-2 py-1 text-2xs uppercase tracking-[0.14em] border ${
        ok
          ? "border-signal-up/40 bg-signal-up/5 text-signal-up"
          : "border-signal-down/40 bg-signal-down/5 text-signal-down"
      }`}
    >
      <span className="font-mono">{ok ? "FILLED" : "REJECTED"}</span>
      <span className="text-ink-muted">·</span>
      <span className="text-ink font-mono normal-case tracking-normal">{detail}</span>
    </div>
  );
}

function WatchRow({ change }: { change: ChatWatchlistChange }) {
  const ok = change.status === "applied";
  const detail = ok
    ? `${change.action.toUpperCase()} ${change.ticker}`
    : `${change.action.toUpperCase()} ${change.ticker} — ${change.error ?? "failed"}`;
  return (
    <div
      data-testid="chat-watchlist-confirmation"
      data-status={change.status}
      className={`flex items-center gap-2 px-2 py-1 text-2xs uppercase tracking-[0.14em] border ${
        ok
          ? "border-accent-blue/40 bg-accent-blue/5 text-accent-blue"
          : "border-signal-down/40 bg-signal-down/5 text-signal-down"
      }`}
    >
      <span className="font-mono">{ok ? "WATCHLIST" : "REJECTED"}</span>
      <span className="text-ink-muted">·</span>
      <span className="text-ink font-mono normal-case tracking-normal">{detail}</span>
    </div>
  );
}

function PendingBubble() {
  return (
    <div className="flex justify-start" data-testid="chat-pending">
      <div className="bg-bg-raised border border-line px-3 py-2 text-sm">
        <div className="label-2xs text-accent-yellow mb-1">FinAlly</div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-yellow animate-pulse-dot" />
          <span className="h-1.5 w-1.5 rounded-full bg-accent-yellow animate-pulse-dot [animation-delay:200ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-accent-yellow animate-pulse-dot [animation-delay:400ms]" />
        </div>
      </div>
    </div>
  );
}
