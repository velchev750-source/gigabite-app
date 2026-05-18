import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";

type CreateOrderItemInput = {
  productId: number;
  quantity: number;
};

export type CreateOrderInput = {
  userId: number;
  deliveryType: "pickup" | "delivery";
  deliveryAddress?: string | null;
  customerNote?: string | null;
  items: CreateOrderItemInput[];
};

export class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderValidationError";
  }
}

export async function createOrder(input: CreateOrderInput) {
  validateCreateOrderInput(input);

  const requestedProductIds = input.items.map((item) => item.productId);
  const orderId = await db.transaction(async (tx) => {
    const dbProducts = await tx
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
      })
      .from(products)
      .where(and(inArray(products.id, requestedProductIds), eq(products.isActive, true)));

    const productsById = new Map(dbProducts.map((product) => [product.id, product]));
    const missingProductId = requestedProductIds.find((productId) => !productsById.has(productId));

    if (missingProductId) {
      throw new OrderValidationError(`Product ${missingProductId} was not found.`);
    }

    const items = input.items.map((item) => {
      const product = productsById.get(item.productId);

      if (!product) {
        throw new OrderValidationError(`Product ${item.productId} was not found.`);
      }

      const unitPriceCents = toCents(product.price);
      const lineTotalCents = unitPriceCents * BigInt(item.quantity);

      return {
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: item.quantity,
        lineTotal: formatCents(lineTotalCents),
      };
    });

    const totalPrice = formatCents(
      items.reduce((sum, item) => sum + toCents(item.lineTotal), BigInt(0)),
    );

    const [order] = await tx
      .insert(orders)
      .values({
        userId: input.userId,
        deliveryType: input.deliveryType,
        deliveryAddress:
          input.deliveryType === "delivery" ? input.deliveryAddress?.trim() : null,
        customerNote: input.customerNote?.trim() || null,
        totalPrice,
      })
      .returning({ id: orders.id });

    await tx.insert(orderItems).values(
      items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
    );

    return order.id;
  });

  return getOrderById(orderId);
}

export async function getOrderById(orderId: number) {
  const [order] = await db.query.orders.findMany({
    where: eq(orders.id, orderId),
    with: {
      items: true,
    },
    limit: 1,
  });

  return order ?? null;
}

function validateCreateOrderInput(input: CreateOrderInput) {
  if (!Number.isInteger(input.userId) || input.userId <= 0) {
    throw new OrderValidationError("A valid user id is required.");
  }

  if (input.deliveryType === "delivery" && !input.deliveryAddress?.trim()) {
    throw new OrderValidationError("Delivery address is required for delivery orders.");
  }

  if (!input.items.length) {
    throw new OrderValidationError("At least one order item is required.");
  }

  for (const item of input.items) {
    if (!Number.isInteger(item.productId) || item.productId <= 0) {
      throw new OrderValidationError("Every order item must reference a valid product.");
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new OrderValidationError("Order item quantity must be a positive integer.");
    }
  }
}

function toCents(value: string) {
  const [whole = "0", fraction = ""] = value.split(".");
  return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0").slice(0, 2));
}

function formatCents(value: bigint) {
  const zero = BigInt(0);
  const centsPerUnit = BigInt(100);
  const sign = value < zero ? "-" : "";
  const absoluteValue = value < zero ? -value : value;
  const whole = absoluteValue / centsPerUnit;
  const fraction = (absoluteValue % centsPerUnit).toString().padStart(2, "0");

  return `${sign}${whole}.${fraction}`;
}
