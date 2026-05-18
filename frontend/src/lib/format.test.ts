import { describe, expect, it } from "vitest";
import { fmt, directionClass, pnlClass } from "./format";

describe("formatters", () => {
  it("formats prices and money with USD", () => {
    expect(fmt.price(190.5)).toBe("$190.50");
    expect(fmt.money(10000)).toBe("$10,000");
    expect(fmt.price(null)).toBe("—");
  });

  it("formats percentages with signs", () => {
    expect(fmt.pct(2.345)).toBe("+2.35%");
    expect(fmt.pct(-1)).toBe("-1.00%");
    expect(fmt.pct(0)).toBe("0.00%");
    expect(fmt.pct(null)).toBe("—");
  });

  it("formats signed currency", () => {
    expect(fmt.signed(123.45)).toBe("+$123.45");
    expect(fmt.signed(-50)).toBe("-$50.00");
    expect(fmt.signed(0)).toBe("$0.00");
  });

  it("returns classes for direction and pnl", () => {
    expect(directionClass("up")).toBe("text-up");
    expect(directionClass("down")).toBe("text-down");
    expect(directionClass(null)).toBe("text-flat");
    expect(pnlClass(5)).toBe("text-up");
    expect(pnlClass(-5)).toBe("text-down");
    expect(pnlClass(0)).toBe("text-flat");
  });
});
