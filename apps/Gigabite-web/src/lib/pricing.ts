export type HotDealPricingProduct = {
  price: number | string;
  quantity: number;
};

export type OrderTotalItem = {
  lineTotal: string;
};

export function calculateHotDealPricing(
  products: HotDealPricingProduct[],
  discountPercent: number,
) {
  const originalPrice = products.reduce(
    (sum, product) => sum + Number(product.price) * product.quantity,
    0,
  );
  const discountAmount = originalPrice * (discountPercent / 100);
  const finalPrice = originalPrice - discountAmount;

  return {
    originalPrice,
    discountAmount,
    finalPrice,
  };
}

export function calculateOrderTotal(items: OrderTotalItem[]) {
  return formatCents(items.reduce((sum, item) => sum + toCents(item.lineTotal), BigInt(0)));
}

export function toCents(value: string) {
  const [whole = "0", fraction = ""] = value.split(".");
  return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0").slice(0, 2));
}

export function formatCents(value: bigint) {
  const zero = BigInt(0);
  const centsPerUnit = BigInt(100);
  const sign = value < zero ? "-" : "";
  const absoluteValue = value < zero ? -value : value;
  const whole = absoluteValue / centsPerUnit;
  const fraction = (absoluteValue % centsPerUnit).toString().padStart(2, "0");

  return `${sign}${whole}.${fraction}`;
}
