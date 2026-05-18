/**
 * Centralized data-testid selectors expected on the frontend.
 *
 * If the frontend needs to add or rename a test id, update it here in one place
 * and ping the frontend-engineer to keep the contract in sync.
 */
export const TID = {
  // Header
  totalValue: "header-total-value",
  cashBalance: "header-cash-balance",
  connectionStatus: "connection-status",

  // Watchlist
  watchlistRow: (ticker: string) => `watchlist-row-${ticker}`,
  watchlistPrice: (ticker: string) => `watchlist-price-${ticker}`,
  watchlistRemove: (ticker: string) => `watchlist-remove-${ticker}`,
  watchlistAddInput: "watchlist-add-input",
  watchlistAddButton: "watchlist-add-button",

  // Trade bar
  tradeTicker: "trade-ticker-input",
  tradeQuantity: "trade-quantity-input",
  tradeBuy: "trade-buy-button",
  tradeSell: "trade-sell-button",

  // Positions table
  positionRow: (ticker: string) => `position-row-${ticker}`,
  positionQuantity: (ticker: string) => `position-quantity-${ticker}`,

  // Portfolio visualizations
  heatmap: "portfolio-heatmap",
  heatmapCell: (ticker: string) => `heatmap-cell-${ticker}`,
  pnlChart: "pnl-chart",

  // Chat
  chatInput: "chat-input",
  chatSend: "chat-send-button",
  chatMessage: "chat-message",
  chatTradeConfirmation: "chat-trade-confirmation",
} as const;

export const DEFAULT_TICKERS = [
  "AAPL",
  "GOOGL",
  "MSFT",
  "AMZN",
  "TSLA",
  "NVDA",
  "META",
  "JPM",
  "V",
  "NFLX",
] as const;
