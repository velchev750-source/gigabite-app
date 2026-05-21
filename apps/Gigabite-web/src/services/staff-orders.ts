import { and, asc, count, desc, eq, gte, lt, sql } from "drizzle-orm";

import { db } from "@/db";
import { orders } from "@/db/schema";
import {
  DEFAULT_ORDER_SORT,
  type OrderSortOption,
} from "@/lib/order-sort-options";
import { requireRole } from "@/services/auth";

export type StaffOrderStatus = "approved" | "in_progress" | "completed";
export const STAFF_ORDER_PAGE_SIZE = 4;

export class StaffOrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StaffOrderError";
  }
}

export async function getStaffOrders() {
  await requireRole("staff");

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

export async function getStaffOrdersByStatus({
  status,
  page,
  pageSize = STAFF_ORDER_PAGE_SIZE,
  sortBy = DEFAULT_ORDER_SORT,
}: {
  status: StaffOrderStatus;
  page: number;
  pageSize?: number;
  sortBy?: OrderSortOption;
}) {
  await requireRole("staff");

  const safePageSize = Math.max(1, Math.min(12, pageSize));
  const safePage = Math.max(1, page);
  const where = getStaffOrdersWhere(status);

  const [orderRows, totalRows] = await Promise.all([
    db.query.orders.findMany({
      where,
      orderBy: getOrderSort(sortBy),
      limit: safePageSize,
      offset: (safePage - 1) * safePageSize,
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
    }),
    db.select({ count: count() }).from(orders).where(where),
  ]);

  const totalCount = totalRows[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));

  return {
    orders: orderRows,
    totalCount,
    page: Math.min(safePage, totalPages),
    pageSize: safePageSize,
    totalPages,
    sortBy,
  };
}

export async function getStaffStats() {
  await requireRole("staff");

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
  await requireRole("staff");

  return updateStaffOrderStatus(orderId, "approved", "in_progress");
}

export async function completeOrder(orderId: number) {
  await requireRole("staff");

  return updateStaffOrderStatus(orderId, "in_progress", "completed");
}

async function getOrdersByStatus(status: StaffOrderStatus) {
  return db.query.orders.findMany({
    where: getStaffOrdersWhere(status),
    orderBy: getOrderSort(DEFAULT_ORDER_SORT),
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

function getOrderSort(sortBy: OrderSortOption) {
  const totalPriceNumber = sql<number>`${orders.totalPrice}::numeric`;

  const sortByOption = {
    newest: [desc(orders.createdAt), desc(orders.id)],
    oldest: [asc(orders.createdAt), asc(orders.id)],
    idAsc: [asc(orders.id)],
    idDesc: [desc(orders.id)],
    totalDesc: [desc(totalPriceNumber), desc(orders.id)],
    totalAsc: [asc(totalPriceNumber), asc(orders.id)],
  } satisfies Record<OrderSortOption, ReturnType<typeof desc>[]>;

  return sortByOption[sortBy];
}

async function countOrdersByStatus(status: StaffOrderStatus) {
  const [result] = await db
    .select({ count: count() })
    .from(orders)
    .where(getStaffOrdersWhere(status));

  return result?.count ?? 0;
}

function getTodayRange() {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  return { startOfToday, startOfTomorrow };
}

function getStaffOrdersWhere(status: StaffOrderStatus) {
  if (status !== "completed") {
    return eq(orders.status, status);
  }

  const { startOfToday, startOfTomorrow } = getTodayRange();

  return and(
    eq(orders.status, "completed"),
    gte(orders.updatedAt, startOfToday),
    lt(orders.updatedAt, startOfTomorrow),
  );
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
