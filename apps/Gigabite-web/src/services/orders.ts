import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  comboOfferItems,
  comboOffers,
  orderItems,
  orders,
  products,
  type Order,
} from "@/db/schema";
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

type CreateComboOrderItemInput = {
  comboOfferId: number;
  quantity: number;
};

export type CreateOrderInput = {
  userId: number;
  deliveryType: "pickup" | "delivery";
  deliveryAddress?: string | null;
  customerNote?: string | null;
  items: CreateOrderItemInput[];
  combos?: CreateComboOrderItemInput[];
};

export class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderValidationError";
  }
}

type PreparedOrderItem = {
  productId: number;
  comboOfferId?: number | null;
  comboGroupKey?: string | null;
  comboName?: string | null;
  comboDiscountPercent?: number | null;
  comboOriginalPrice?: string | null;
  comboFinalPrice?: string | null;
  productName: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
};

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
  const dbProducts = requestedProductIds.length
    ? await db
        .select({
          id: products.id,
          name: products.name,
          price: products.price,
        })
        .from(products)
        .where(and(inArray(products.id, requestedProductIds), eq(products.isActive, true)))
    : [];

  const productsById = new Map(dbProducts.map((product) => [product.id, product]));
  const missingProductId = requestedProductIds.find((productId) => !productsById.has(productId));

  if (missingProductId) {
    throw new OrderValidationError(`Product ${missingProductId} was not found.`);
  }

  const items: PreparedOrderItem[] = input.items.map((item) => {
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

  const comboItems = await buildComboOrderItems(input.combos ?? []);
  const allItems = [...items, ...comboItems];

  const totalPrice = formatCents(
    allItems.reduce((sum, item) => sum + toCents(item.lineTotal), BigInt(0)),
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
    allItems.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      comboOfferId: item.comboOfferId ?? null,
      comboGroupKey: item.comboGroupKey ?? null,
      comboName: item.comboName ?? null,
      comboDiscountPercent: item.comboDiscountPercent ?? null,
      comboOriginalPrice: item.comboOriginalPrice ?? null,
      comboFinalPrice: item.comboFinalPrice ?? null,
      productName: item.productName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
  );
  const orderId = order.id;

  return getOrderById(orderId);
}

async function buildComboOrderItems(comboInputs: CreateComboOrderItemInput[]): Promise<PreparedOrderItem[]> {
  if (!comboInputs.length) {
    return [];
  }

  for (const comboInput of comboInputs) {
    if (!Number.isInteger(comboInput.comboOfferId) || comboInput.comboOfferId <= 0) {
      throw new OrderValidationError("Every hot deal item must reference a valid hot deal.");
    }

    if (!Number.isInteger(comboInput.quantity) || comboInput.quantity <= 0) {
      throw new OrderValidationError("Hot deal quantity must be a positive integer.");
    }
  }

  const comboOfferIds = comboInputs.map((comboInput) => comboInput.comboOfferId);
  const rows = await db
    .select({
      comboOfferId: comboOffers.id,
      comboName: comboOffers.name,
      discountPercent: comboOffers.discountPercent,
      productId: products.id,
      productName: products.name,
      unitPrice: products.price,
      itemQuantity: comboOfferItems.quantity,
    })
    .from(comboOffers)
    .innerJoin(comboOfferItems, eq(comboOfferItems.comboOfferId, comboOffers.id))
    .innerJoin(products, eq(products.id, comboOfferItems.productId))
    .where(
      and(
        inArray(comboOffers.id, comboOfferIds),
        eq(comboOffers.isActive, true),
        eq(products.isActive, true),
      ),
    );
  const rowsByComboOfferId = new Map<number, typeof rows>();

  for (const row of rows) {
    rowsByComboOfferId.set(row.comboOfferId, [
      ...(rowsByComboOfferId.get(row.comboOfferId) ?? []),
      row,
    ]);
  }

  return comboInputs.flatMap((comboInput, comboInputIndex) => {
    const comboRows = rowsByComboOfferId.get(comboInput.comboOfferId) ?? [];

    if (comboRows.length !== 3) {
      throw new OrderValidationError(`Hot deal ${comboInput.comboOfferId} was not found.`);
    }

    const originalPriceCents = comboRows.reduce(
      (sum, row) => sum + toCents(row.unitPrice) * BigInt(row.itemQuantity),
      BigInt(0),
    );
    const discountCents = (originalPriceCents * BigInt(comboRows[0].discountPercent)) / BigInt(100);
    const finalPriceCents = originalPriceCents - discountCents;
    const comboItems: PreparedOrderItem[] = [];

    for (let comboIndex = 0; comboIndex < comboInput.quantity; comboIndex += 1) {
      const comboGroupKey = `${comboInput.comboOfferId}:${comboInputIndex}:${comboIndex}:${Date.now()}`;
      let allocatedCents = BigInt(0);

      for (const [index, row] of comboRows.entries()) {
        const isLastItem = index === comboRows.length - 1;
        const originalLineCents = toCents(row.unitPrice) * BigInt(row.itemQuantity);
        const discountedLineCents = isLastItem
          ? finalPriceCents - allocatedCents
          : (finalPriceCents * originalLineCents) / originalPriceCents;
        allocatedCents += discountedLineCents;

        comboItems.push({
          productId: row.productId,
          comboOfferId: row.comboOfferId,
          comboGroupKey,
          comboName: row.comboName,
          comboDiscountPercent: row.discountPercent,
          comboOriginalPrice: formatCents(originalPriceCents),
          comboFinalPrice: formatCents(finalPriceCents),
          productName: row.productName,
          unitPrice: row.unitPrice,
          quantity: row.itemQuantity,
          lineTotal: formatCents(discountedLineCents),
        });
      }
    }

    return comboItems;
  });
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
  const user = await requireCurrentCustomer(userId);

  return getOrdersForAuthenticatedCustomer(user);
}

export async function getOrdersForAuthenticatedCustomer(user: AuthUser) {
  requireCustomerRole(user);

  return db.query.orders.findMany({
    where: eq(orders.userId, user.id),
    orderBy: [desc(orders.createdAt)],
    with: {
      items: true,
    },
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
  const user = await requireCurrentCustomer(userId);

  return getOrderDetailsForAuthenticatedCustomer(user, orderId);
}

export async function getOrderDetailsForAuthenticatedCustomer(user: AuthUser, orderId: number) {
  requireCustomerRole(user);

  const [order] = await db.query.orders.findMany({
    where: and(eq(orders.id, orderId), eq(orders.userId, user.id)),
    with: {
      items: true,
    },
    limit: 1,
  });

  return order ?? null;
}

export async function requestOrderCancellation(userId: number, orderId: number) {
  const user = await requireCurrentCustomer(userId);

  return requestOrderCancellationForAuthenticatedCustomer(user, orderId);
}

export async function requestOrderCancellationForAuthenticatedCustomer(
  user: AuthUser,
  orderId: number,
) {
  requireCustomerRole(user);
  const order = await getOrderDetailsForAuthenticatedCustomer(user, orderId);

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
    .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)))
    .returning();

  return updatedOrder;
}

function requireCustomerRole(user: Pick<AuthUser, "role">) {
  if (user.role !== "user") {
    throw new OrderValidationError("Only customer accounts can access orders.");
  }
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

  if (!input.items.length && !input.combos?.length) {
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
