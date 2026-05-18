export type PriceDirection = "up" | "down" | "flat";

export interface PriceTick {
  ticker: string;
  price: number;
  previous_price: number;
  timestamp: number;
  change: number;
  change_percent: number;
  direction: PriceDirection;
}

export type PriceMap = Record<string, PriceTick>;

export interface WatchlistItem {
  ticker: string;
  added_at: string;
  price: number | null;
  previous_price: number | null;
  change: number | null;
  change_percent: number | null;
  direction: PriceDirection | null;
}

export interface Position {
  ticker: string;
  quantity: number;
  avg_cost: number;
  current_price: number | null;
  market_value: number | null;
  unrealized_pl: number | null;
  unrealized_pl_percent: number | null;
}

export interface PortfolioResponse {
  cash_balance: number;
  positions: Position[];
  positions_value: number;
  total_value: number;
  unrealized_pl: number;
}

export type TradeSide = "buy" | "sell";

export interface TradeRequest {
  ticker: string;
  quantity: number;
  side: TradeSide;
}

export interface TradeResponse {
  ticker: string;
  side: TradeSide;
  quantity: number;
  price: number;
  executed_at: string;
  portfolio: PortfolioResponse;
}

export interface SnapshotPoint {
  total_value: number;
  recorded_at: string;
}

export interface PortfolioHistoryResponse {
  snapshots: SnapshotPoint[];
}

export interface ChatTrade {
  ticker: string;
  side: TradeSide;
  quantity: number;
  status: "executed" | "failed";
  price: number | null;
  executed_at: string | null;
  error: string | null;
}

export interface ChatWatchlistChange {
  ticker: string;
  action: "add" | "remove";
  status: "applied" | "failed";
  error: string | null;
}

export interface ChatResponse {
  message: string;
  trades: ChatTrade[];
  watchlist_changes: ChatWatchlistChange[];
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  trades?: ChatTrade[];
  watchlist_changes?: ChatWatchlistChange[];
  created_at: string;
}

export type ConnectionState = "connecting" | "connected" | "reconnecting" | "disconnected";
