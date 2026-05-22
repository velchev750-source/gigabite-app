import { and, asc, count, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";

import { db } from "@/db";
import { orders } from "@/db/schema";
import {
  DEFAULT_ORDER_SORT,
  type OrderSortOption,
} from "@/lib/order-sort-options";
import { requireRole } from "@/services/auth";
import { getManagerProductCount } from "@/services/manager-products";

export type ManagerOrderTab =
  | "pendingApproval"
  | "cancellationRequests"
  | "activeOrders"
  | "completed"
  | "cancelled";

export const MANAGER_ORDER_PAGE_SIZE = 4;

export class ManagerOrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManagerOrderError";
  }
}

export async function getManagerOrders() {
  await requireRole("manager");

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

export async function getManagerOrdersByTab({
  tab,
  page,
  pageSize = MANAGER_ORDER_PAGE_SIZE,
  sortBy = DEFAULT_ORDER_SORT,
}: {
  tab: ManagerOrderTab;
  page: number;
  pageSize?: number;
  sortBy?: OrderSortOption;
}) {
  await requireRole("manager");

  const safePageSize = Math.max(1, Math.min(12, pageSize));
  const safePage = Math.max(1, page);
  const statuses = getStatusesForManagerTab(tab);
  const where = inArray(orders.status, statuses);

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
            email: true,
            phone: true,
          },
        },
        items: {
          columns: {
            id: true,
            comboOfferId: true,
            comboGroupKey: true,
            comboName: true,
            comboDiscountPercent: true,
            comboOriginalPrice: true,
            comboFinalPrice: true,
            productName: true,
            quantity: true,
            unitPrice: true,
            lineTotal: true,
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

export async function getManagerMetrics() {
  await requireRole("manager");

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
    activeOrdersCount,
    completedOrdersCount,
    cancelledOrdersCount,
    productCount,
  ] = await Promise.all([
    sumCompletedSales(startOfToday, startOfTomorrow),
    sumCompletedSales(startOfWeek, startOfTomorrow),
    sumCompletedSales(startOfMonth, startOfNextMonth),
    countOrders("completed", startOfToday, startOfTomorrow),
    countOrders("pending_approval"),
    countOrders("cancel_requested"),
    countOrdersByStatuses(["approved", "in_progress"]),
    countOrders("completed"),
    countOrders("cancelled"),
    getManagerProductCount(),
  ]);

  return {
    salesToday,
    salesThisWeek,
    salesThisMonth,
    completedOrdersToday,
    pendingApprovalCount,
    cancellationRequestsCount,
    activeOrdersCount,
    completedOrdersCount,
    cancelledOrdersCount,
    productCount,
  };
}

export async function approveOrder(orderId: number, managerId: number) {
  const manager = await requireRole("manager");

  if (manager.id !== managerId) {
    throw new ManagerOrderError("Manager id does not match the authenticated manager.");
  }

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
  await requireRole("manager");

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
  await requireRole("manager");

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
  await requireRole("manager");

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
  await requireRole("manager");

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
  await requireRole("manager");

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
    orderBy: getOrderSort(DEFAULT_ORDER_SORT),
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
          comboOfferId: true,
          comboGroupKey: true,
          comboName: true,
          comboDiscountPercent: true,
          comboOriginalPrice: true,
          comboFinalPrice: true,
          productName: true,
          quantity: true,
          unitPrice: true,
          lineTotal: true,
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

function getStatusesForManagerTab(tab: ManagerOrderTab) {
  const statusesByTab = {
    pendingApproval: ["pending_approval"],
    cancellationRequests: ["cancel_requested"],
    activeOrders: ["approved", "in_progress"],
    completed: ["completed"],
    cancelled: ["cancelled"],
  } satisfies Record<ManagerOrderTab, Array<typeof orders.$inferSelect.status>>;

  return statusesByTab[tab];
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

async function countOrdersByStatuses(statuses: Array<typeof orders.$inferSelect.status>) {
  const [result] = await db
    .select({ count: count() })
    .from(orders)
    .where(inArray(orders.status, statuses));

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
