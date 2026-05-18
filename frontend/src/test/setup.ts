import "@testing-library/jest-dom/vitest";
import { vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => cleanup());

class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  readyState = 0;
  onopen: ((this: MockEventSource, ev: Event) => unknown) | null = null;
  onmessage: ((this: MockEventSource, ev: MessageEvent) => unknown) | null = null;
  onerror: ((this: MockEventSource, ev: Event) => unknown) | null = null;
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;
  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }
  close() {
    this.readyState = MockEventSource.CLOSED;
  }
  emit(data: unknown) {
    this.onmessage?.call(this, { data: JSON.stringify(data) } as MessageEvent);
  }
}

(globalThis as unknown as { EventSource: typeof MockEventSource }).EventSource = MockEventSource;

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: typeof MockResizeObserver }).ResizeObserver = MockResizeObserver;

if (!HTMLCanvasElement.prototype.getContext) {
  HTMLCanvasElement.prototype.getContext = vi.fn() as unknown as HTMLCanvasElement["getContext"];
}
