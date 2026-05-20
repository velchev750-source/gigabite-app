import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { orderItems, orders, products, type Order } from "@/db/schema";
import { requireRole, type AuthUser } from "@/services/auth";

export const ACTIVE_ORDER_STATUSES = [
  "pending_approval",
  "approved",
  "in_progress",
  "cancel_requested",
] as const;

export const CANCELLABLE_ORDER_STATUSES = ["pending_approval", "approved"] as const;

export type OrderStatus = Order["status"];

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
  const user = await requireRole("user");

  return createOrderForAuthenticatedCustomer(user, input);
}

export async function createOrderForAuthenticatedCustomer(
  user: AuthUser,
  input: CreateOrderInput,
) {
  if (user.role !== "user") {
    throw new OrderValidationError("Only customer accounts can place orders.");
  }

  if (input.userId !== user.id) {
    throw new OrderValidationError("Users can only create orders for their own account.");
  }

  validateCreateOrderInput(input);

  const requestedProductIds = input.items.map((item) => item.productId);
  const dbProducts = await db
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

  const [order] = await db
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

  await db.insert(orderItems).values(
    items.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
  );
  const orderId = order.id;

  return getOrderById(orderId);
}

async function getOrderById(orderId: number) {
  const [order] = await db.query.orders.findMany({
    where: eq(orders.id, orderId),
    with: {
      items: true,
    },
    limit: 1,
  });

  return order ?? null;
}

export async function getOrdersForUser(userId: number) {
  await requireCurrentCustomer(userId);

  return db.query.orders.findMany({
    where: eq(orders.userId, userId),
    orderBy: [desc(orders.createdAt)],
  });
}

export async function getActiveOrderForUser(userId: number) {
  await requireCurrentCustomer(userId);

  const [order] = await db.query.orders.findMany({
    where: and(
      eq(orders.userId, userId),
      inArray(orders.status, [...ACTIVE_ORDER_STATUSES]),
    ),
    orderBy: [desc(orders.createdAt)],
    limit: 1,
  });

  return order ?? null;
}

export async function getOrderDetailsForUser(userId: number, orderId: number) {
  await requireCurrentCustomer(userId);

  const [order] = await db.query.orders.findMany({
    where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
    with: {
      items: true,
    },
    limit: 1,
  });

  return order ?? null;
}

export async function requestOrderCancellation(userId: number, orderId: number) {
  await requireCurrentCustomer(userId);
  const order = await getOrderDetailsForUser(userId, orderId);

  if (!order) {
    throw new OrderValidationError("Order was not found.");
  }

  if (!CANCELLABLE_ORDER_STATUSES.includes(order.status as (typeof CANCELLABLE_ORDER_STATUSES)[number])) {
    throw new OrderValidationError("This order can no longer be cancelled.");
  }

  const [updatedOrder] = await db
    .update(orders)
    .set({
      status: "cancel_requested",
      cancelRequestedAt: new Date(),
    })
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .returning();

  return updatedOrder;
}

async function requireCurrentCustomer(userId: number) {
  const user = await requireRole("user");

  if (user.id !== userId) {
    throw new OrderValidationError("Users can only access their own orders.");
  }

  return user;
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
