import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const chatMock = vi.fn();
vi.mock("@/lib/api", () => ({
  api: {
    chat: (msg: string) => chatMock(msg),
  },
}));

vi.mock("@/lib/portfolio-context", () => ({
  usePortfolio: () => ({ refreshAll: vi.fn() }),
}));

describe("ChatPanel", () => {
  it("renders welcome bubble and toggles loading indicator", async () => {
    let resolveChat: (v: { message: string; trades: []; watchlist_changes: []; created_at: string }) => void = () => undefined;
    chatMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveChat = resolve as typeof resolveChat;
        }),
    );

    const { ChatPanel } = await import("./ChatPanel");
    render(<ChatPanel collapsed={false} onToggle={() => undefined} />);

    expect(screen.getAllByTestId("chat-message").length).toBe(1);

    const input = screen.getByTestId("chat-input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "what's my exposure?" } });
    fireEvent.click(screen.getByTestId("chat-send-button"));

    await waitFor(() => expect(screen.getByTestId("chat-pending")).toBeInTheDocument());

    resolveChat({ message: "Your top exposure is AAPL.", trades: [], watchlist_changes: [], created_at: new Date().toISOString() });

    await waitFor(() => expect(screen.queryByTestId("chat-pending")).toBeNull());

    const bubbles = screen.getAllByTestId("chat-message");
    expect(bubbles.at(-1)?.textContent).toContain("Your top exposure is AAPL.");
  });

  it("renders inline trade confirmation when actions arrive", async () => {
    chatMock.mockResolvedValueOnce({
      message: "Bought 5 AAPL.",
      trades: [
        {
          ticker: "AAPL",
          side: "buy",
          quantity: 5,
          status: "executed",
          price: 190.0,
          executed_at: new Date().toISOString(),
          error: null,
        },
      ],
      watchlist_changes: [],
      created_at: new Date().toISOString(),
    });

    const { ChatPanel } = await import("./ChatPanel");
    render(<ChatPanel collapsed={false} onToggle={() => undefined} />);

    fireEvent.change(screen.getByTestId("chat-input"), { target: { value: "buy 5 aapl" } });
    fireEvent.click(screen.getByTestId("chat-send-button"));

    await waitFor(() => expect(screen.getByTestId("chat-trade-confirmation")).toBeInTheDocument());
    expect(screen.getByTestId("chat-trade-confirmation").textContent).toContain("BUY 5 AAPL");
  });

  it("renders both user and assistant bubbles with the same testid", async () => {
    chatMock.mockResolvedValueOnce({
      message: "Pong.",
      trades: [],
      watchlist_changes: [],
      created_at: new Date().toISOString(),
    });

    const { ChatPanel } = await import("./ChatPanel");
    render(<ChatPanel collapsed={false} onToggle={() => undefined} />);

    fireEvent.change(screen.getByTestId("chat-input"), { target: { value: "ping" } });
    fireEvent.click(screen.getByTestId("chat-send-button"));

    // welcome assistant + user + assistant reply = 3 bubbles, all sharing the testid
    await waitFor(() => expect(screen.getAllByTestId("chat-message")).toHaveLength(3));
    const roles = screen.getAllByTestId("chat-message").map((el) => el.getAttribute("data-role"));
    expect(roles).toContain("user");
    expect(roles).toContain("assistant");
  });
});
