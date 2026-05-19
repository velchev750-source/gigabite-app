import { and, count, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";

import { db } from "@/db";
import { orders } from "@/db/schema";

export class ManagerOrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManagerOrderError";
  }
}

export async function getManagerOrders() {
  const [pendingApproval, cancellationRequests, activeOrders, completed, cancelled] =
    await Promise.all([
      getOrdersByStatus(["pending_approval"]),
      getOrdersByStatus(["cancel_requested"]),
      getOrdersByStatus(["approved", "in_progress"]),
      getOrdersByStatus(["completed"]),
      getOrdersByStatus(["cancelled"]),
    ]);

  return {
    pendingApproval,
    cancellationRequests,
    activeOrders,
    completed,
    cancelled,
  };
}

export async function getManagerMetrics() {
  const now = new Date();
  const startOfToday = startOfDay(now);
  const startOfTomorrow = addDays(startOfToday, 1);
  const startOfWeek = getMonday(startOfToday);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [
    salesToday,
    salesThisWeek,
    salesThisMonth,
    completedOrdersToday,
    pendingApprovalCount,
    cancellationRequestsCount,
  ] = await Promise.all([
    sumCompletedSales(startOfToday, startOfTomorrow),
    sumCompletedSales(startOfWeek, startOfTomorrow),
    sumCompletedSales(startOfMonth, startOfNextMonth),
    countOrders("completed", startOfToday, startOfTomorrow),
    countOrders("pending_approval"),
    countOrders("cancel_requested"),
  ]);

  return {
    salesToday,
    salesThisWeek,
    salesThisMonth,
    completedOrdersToday,
    pendingApprovalCount,
    cancellationRequestsCount,
  };
}

export async function approveOrder(orderId: number, managerId: number) {
  validateOrderId(orderId);

  const [updatedOrder] = await db
    .update(orders)
    .set({
      status: "approved",
      approvedByManagerId: managerId,
    })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending_approval")))
    .returning();

  if (!updatedOrder) {
    throw new ManagerOrderError("Only pending orders can be approved.");
  }

  return updatedOrder;
}

export async function cancelOrder(orderId: number, managerNote?: string | null) {
  validateOrderId(orderId);

  const [updatedOrder] = await db
    .update(orders)
    .set({
      status: "cancelled",
      managerNote: normalizeOptionalText(managerNote),
    })
    .where(and(eq(orders.id, orderId), inArray(orders.status, ["pending_approval", "approved"])))
    .returning();

  if (!updatedOrder) {
    throw new ManagerOrderError("Only pending or approved orders can be cancelled by manager.");
  }

  return updatedOrder;
}

export async function approveCancellation(orderId: number, managerNote?: string | null) {
  validateOrderId(orderId);
  const now = new Date();

  const [updatedOrder] = await db
    .update(orders)
    .set({
      status: "cancelled",
      managerNote: normalizeOptionalText(managerNote),
      cancelApprovedAt: now,
    })
    .where(and(eq(orders.id, orderId), eq(orders.status, "cancel_requested")))
    .returning();

  if (!updatedOrder) {
    throw new ManagerOrderError("Only cancellation requests can be approved.");
  }

  return updatedOrder;
}

export async function updateManagerOrderNote(orderId: number, managerNote?: string | null) {
  validateOrderId(orderId);

  const [updatedOrder] = await db
    .update(orders)
    .set({ managerNote: normalizeOptionalText(managerNote) })
    .where(and(eq(orders.id, orderId), inArray(orders.status, editableStatuses)))
    .returning();

  if (!updatedOrder) {
    throw new ManagerOrderError("Completed and cancelled orders cannot be edited.");
  }

  return updatedOrder;
}

export async function updateDeliveryAddress(orderId: number, deliveryAddress?: string | null) {
  validateOrderId(orderId);
  const nextAddress = normalizeRequiredText(deliveryAddress, "Delivery address is required.");

  const [updatedOrder] = await db
    .update(orders)
    .set({ deliveryAddress: nextAddress })
    .where(
      and(
        eq(orders.id, orderId),
        eq(orders.deliveryType, "delivery"),
        inArray(orders.status, editableStatuses),
      ),
    )
    .returning();

  if (!updatedOrder) {
    throw new ManagerOrderError("Only editable delivery orders can have their address changed.");
  }

  return updatedOrder;
}

export async function updateCustomerNote(orderId: number, customerNote?: string | null) {
  validateOrderId(orderId);

  const [updatedOrder] = await db
    .update(orders)
    .set({ customerNote: normalizeOptionalText(customerNote) })
    .where(and(eq(orders.id, orderId), inArray(orders.status, editableStatuses)))
    .returning();

  if (!updatedOrder) {
    throw new ManagerOrderError("Completed and cancelled orders cannot be edited.");
  }

  return updatedOrder;
}

const editableStatuses = ["pending_approval", "approved", "cancel_requested"] as const;

async function getOrdersByStatus(statuses: Array<typeof orders.$inferSelect.status>) {
  return db.query.orders.findMany({
    where: inArray(orders.status, statuses),
    orderBy: [desc(orders.createdAt)],
    with: {
      user: {
        columns: {
          name: true,
          email: true,
          phone: true,
        },
      },
      items: {
        columns: {
          id: true,
          productName: true,
          quantity: true,
          unitPrice: true,
          lineTotal: true,
        },
      },
    },
  });
}

async function sumCompletedSales(start: Date, end: Date) {
  const [result] = await db
    .select({
      total: sql<string>`coalesce(sum(${orders.totalPrice}), 0)::text`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.status, "completed"),
        gte(orders.updatedAt, start),
        lt(orders.updatedAt, end),
      ),
    );

  return result?.total ?? "0";
}

async function countOrders(status: typeof orders.$inferSelect.status, start?: Date, end?: Date) {
  const conditions = [eq(orders.status, status)];

  if (start && end) {
    conditions.push(gte(orders.updatedAt, start), lt(orders.updatedAt, end));
  }

  const [result] = await db
    .select({ count: count() })
    .from(orders)
    .where(and(...conditions));

  return result?.count ?? 0;
}

function validateOrderId(orderId: number) {
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new ManagerOrderError("A valid order id is required.");
  }
}

function normalizeOptionalText(value?: string | null) {
  return value?.trim() || null;
}

function normalizeRequiredText(value: string | null | undefined, message: string) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    throw new ManagerOrderError(message);
  }

  return trimmedValue;
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function getMonday(value: Date) {
  const date = startOfDay(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}
