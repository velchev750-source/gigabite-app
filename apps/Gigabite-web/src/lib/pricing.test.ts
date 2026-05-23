import { describe, expect, it } from "vitest";

import {
  calculateHotDealPricing,
  calculateOrderTotal,
  formatCents,
  toCents,
} from "./pricing";

describe("pricing helpers", () => {
  it("calculates hot deal original price, discount, and final price", () => {
    const pricing = calculateHotDealPricing(
      [
        { price: 8.99, quantity: 1 },
        { price: "4.50", quantity: 2 },
        { price: 2.01, quantity: 1 },
      ],
      20,
    );

    expect(pricing).toEqual({
      originalPrice: 20,
      discountAmount: 4,
      finalPrice: 16,
    });
  });

  it("calculates order totals from prepared line totals", () => {
    expect(
      calculateOrderTotal([
        { lineTotal: "8.99" },
        { lineTotal: "10.50" },
        { lineTotal: "0.51" },
      ]),
    ).toBe("20.00");
  });

  it("converts string prices to cents and formats cents back to money strings", () => {
    expect(toCents("12.30")).toBe(BigInt(1230));
    expect(toCents("12")).toBe(BigInt(1200));
    expect(formatCents(BigInt(1230))).toBe("12.30");
  });
});
