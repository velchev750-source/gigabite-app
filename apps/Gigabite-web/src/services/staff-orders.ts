import { and, count, desc, eq, gte, lt } from "drizzle-orm";

import { db } from "@/db";
import { orders } from "@/db/schema";

export type StaffOrderStatus = "approved" | "in_progress" | "completed";

export class StaffOrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StaffOrderError";
  }
}

export async function getStaffOrders() {
  const [waiting, inProgress, completed] = await Promise.all([
    getOrdersByStatus("approved"),
    getOrdersByStatus("in_progress"),
    getOrdersByStatus("completed"),
  ]);

  return {
    waiting,
    inProgress,
    completed,
  };
}

export async function getStaffStats() {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const [approved, inProgress, completedToday] = await Promise.all([
    countOrdersByStatus("approved"),
    countOrdersByStatus("in_progress"),
    db
      .select({ count: count() })
      .from(orders)
      .where(
        and(
          eq(orders.status, "completed"),
          gte(orders.updatedAt, startOfToday),
          lt(orders.updatedAt, startOfTomorrow),
        ),
      ),
  ]);

  return {
    approved,
    inProgress,
    completedToday: completedToday[0]?.count ?? 0,
  };
}

export async function startOrderPreparation(orderId: number) {
  return updateStaffOrderStatus(orderId, "approved", "in_progress");
}

export async function completeOrder(orderId: number) {
  return updateStaffOrderStatus(orderId, "in_progress", "completed");
}

async function getOrdersByStatus(status: StaffOrderStatus) {
  return db.query.orders.findMany({
    where: eq(orders.status, status),
    orderBy: [desc(orders.createdAt)],
    with: {
      user: {
        columns: {
          name: true,
          phone: true,
        },
      },
      items: {
        columns: {
          id: true,
          productName: true,
          quantity: true,
        },
      },
    },
  });
}

async function countOrdersByStatus(status: StaffOrderStatus) {
  const [result] = await db
    .select({ count: count() })
    .from(orders)
    .where(eq(orders.status, status));

  return result?.count ?? 0;
}

async function updateStaffOrderStatus(
  orderId: number,
  currentStatus: "approved" | "in_progress",
  nextStatus: "in_progress" | "completed",
) {
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new StaffOrderError("A valid order id is required.");
  }

  const [updatedOrder] = await db
    .update(orders)
    .set({ status: nextStatus })
    .where(and(eq(orders.id, orderId), eq(orders.status, currentStatus)))
    .returning();

  if (!updatedOrder) {
    throw new StaffOrderError("This order cannot be updated by staff.");
  }

  return updatedOrder;
}
