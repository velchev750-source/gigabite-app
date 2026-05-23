import { describe, expect, it } from "vitest";

import {
  getComboCartKey,
  getProductCartKey,
  getWebCartCount,
  getWebCartItemName,
  getWebCartItemPrice,
  getWebCartTotal,
  updateWebCartQuantity,
  type WebCart,
} from "./web-cart";

const cart: WebCart = {
  "product:1": {
    product: {
      id: 1,
      name: "Classic Burger",
      price: 8.99,
    },
    quantity: 2,
  },
  "combo:10": {
    type: "combo",
    comboOfferId: 10,
    name: "Lunch Hot Deal",
    description: "Burger, fries, drink",
    discountPercent: 20,
    originalPrice: 15,
    discountedPrice: 12,
    includedProducts: [
      { id: 1, name: "Classic Burger", price: 8.99, quantity: 1 },
      { id: 2, name: "Classic Fries", price: 3.5, quantity: 1 },
      { id: 3, name: "Coca-Cola", price: 2.51, quantity: 1 },
    ],
    quantity: 1,
  },
};

describe("web cart helpers", () => {
  it("calculates item count and total price for product and hot deal items", () => {
    expect(getWebCartCount(cart)).toBe(3);
    expect(getWebCartTotal(cart)).toBe(29.98);
  });

  it("returns stable cart keys, display names, and unit prices", () => {
    expect(getProductCartKey(1)).toBe("product:1");
    expect(getComboCartKey(10)).toBe("combo:10");
    expect(getWebCartItemName(cart["product:1"])).toBe("Classic Burger");
    expect(getWebCartItemName(cart["combo:10"])).toBe("Lunch Hot Deal");
    expect(getWebCartItemPrice(cart["product:1"])).toBe(8.99);
    expect(getWebCartItemPrice(cart["combo:10"])).toBe(12);
  });

  it("updates or removes cart quantities without mutating the original cart", () => {
    const updated = updateWebCartQuantity(cart, "product:1", 4);
    const removed = updateWebCartQuantity(cart, "product:1", 0);

    expect(updated["product:1"].quantity).toBe(4);
    expect(cart["product:1"].quantity).toBe(2);
    expect(removed["product:1"]).toBeUndefined();
    expect(removed["combo:10"]).toBeDefined();
  });
});
