import { loadEnvConfig } from "@next/env";
import bcrypt from "bcryptjs";
import { count, eq, inArray, like } from "drizzle-orm";

loadEnvConfig(process.cwd());

import { orderItems, orders, products, roles, users } from "./schema";

let db: typeof import(".").db;

const STRESS_PREFIX = "GB-STRESS-LARGE";
const TARGET_CUSTOMERS = 500;
const TARGET_STAFF = 40;
const TARGET_MANAGERS = 8;
const TARGET_ORDERS = 10000;
const USER_BATCH_SIZE = 250;
const ORDER_BATCH_SIZE = 500;
const ORDER_ITEM_BATCH_SIZE = 1500;

const roleNames = ["user", "staff", "manager"] as const;

const statusPlan = [
  { status: "completed", count: 7600 },
  { status: "approved", count: 900 },
  { status: "in_progress", count: 700 },
  { status: "pending_approval", count: 400 },
  { status: "cancelled", count: 250 },
  { status: "cancel_requested", count: 150 },
] as const;

const customerNotes = [
  "Please add napkins.",
  "No onions, please.",
  "Call when arriving.",
  "Leave at reception.",
  "Extra sauce on the side.",
  "No cutlery needed.",
  "Pack drinks separately.",
  "Ring the doorbell once.",
  "Less spicy if possible.",
  "Pickup under my name.",
];

const managerNotes = [
  "Approved during stress validation.",
  "Handled by manager queue.",
  "Demo operational workflow.",
  "Customer details confirmed.",
  "Prepared for pagination testing.",
];

const sofiaAddresses = [
  "12 Vitosha Blvd, Sofia",
  "44 Patriarh Evtimiy Blvd, Sofia",
  "18 Graf Ignatiev Street, Sofia",
  "7 Shishman Street, Sofia",
  "62 Bulgaria Blvd, Sofia",
  "25 Cherni Vrah Blvd, Sofia",
  "9 Tsarigradsko Shose Blvd, Sofia",
  "31 Hristo Botev Blvd, Sofia",
  "5 Oborishte Street, Sofia",
  "73 Aleksandar Malinov Blvd, Sofia",
  "16 Solunska Street, Sofia",
  "28 Rakovski Street, Sofia",
];

type RoleName = (typeof roleNames)[number];
type OrderStatus = (typeof statusPlan)[number]["status"];
type ProductRow = {
  id: number;
  name: string;
  price: string;
};
type StressOrderPlan = {
  sequence: number;
  status: OrderStatus;
  customerNote: string;
  customerId: number;
  managerId: number | null;
  deliveryType: "pickup" | "delivery";
  deliveryAddress: string | null;
  managerNote: string | null;
  totalPrice: string;
  cancelRequestedAt: Date | null;
  cancelApprovedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    productId: number;
    productName: string;
    unitPrice: string;
    quantity: number;
    lineTotal: string;
  }>;
};

async function main() {
  const startedAt = Date.now();
  ({ db } = await import("."));

  const plannedOrderCount = statusPlan.reduce((sum, item) => sum + item.count, 0);
  if (plannedOrderCount !== TARGET_ORDERS) {
    throw new Error(
      `Stress status plan must total ${TARGET_ORDERS} orders. Received ${plannedOrderCount}.`,
    );
  }

  await ensureRoles();
  const roleIds = await getRoleIds();
  const passwordHash = await bcrypt.hash("StressPass123", 12);

  const insertedCustomers = await insertStressUsers(
    buildStressUsers("user", TARGET_CUSTOMERS, roleIds.get("user")!, passwordHash),
  );
  const insertedStaff = await insertStressUsers(
    buildStressUsers("staff", TARGET_STAFF, roleIds.get("staff")!, passwordHash),
  );
  const insertedManagers = await insertStressUsers(
    buildStressUsers("manager", TARGET_MANAGERS, roleIds.get("manager")!, passwordHash),
  );

  const [customerRows, managerRows, productRows, existingOrderRows] = await Promise.all([
    getStressUserIds("user", TARGET_CUSTOMERS),
    getStressUserIds("manager", TARGET_MANAGERS),
    getProductsForOrders(),
    db
      .select({ customerNote: orders.customerNote })
      .from(orders)
      .where(like(orders.customerNote, `${STRESS_PREFIX}-%`)),
  ]);

  if (!customerRows.length) {
    throw new Error("Stress customers are missing.");
  }

  if (!productRows.length) {
    throw new Error("No products found. Run npm run db:seed before stress seeding.");
  }

  const existingOrderNotes = new Set(existingOrderRows.map((order) => order.customerNote));
  const orderPlans = buildStressOrders(customerRows, managerRows, productRows).filter(
    (order) => !existingOrderNotes.has(order.customerNote),
  );
  const insertedOrders = await insertStressOrders(orderPlans);
  const totals = await getStressTotals();
  const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);

  console.log(
    JSON.stringify(
      {
        inserted: {
          customers: insertedCustomers,
          staff: insertedStaff,
          managers: insertedManagers,
          orders: insertedOrders.orders,
          orderItems: insertedOrders.orderItems,
        },
        totals,
        elapsedSeconds,
      },
      null,
      2,
    ),
  );
}

async function ensureRoles() {
  await db
    .insert(roles)
    .values(roleNames.map((name) => ({ name })))
    .onConflictDoNothing({ target: roles.name });
}

async function getRoleIds() {
  const rows = await db
    .select({ id: roles.id, name: roles.name })
    .from(roles)
    .where(inArray(roles.name, [...roleNames]));

  const roleIds = new Map<RoleName, number>(rows.map((role) => [role.name, role.id]));

  for (const roleName of roleNames) {
    if (!roleIds.has(roleName)) {
      throw new Error(`Missing role: ${roleName}`);
    }
  }

  return roleIds;
}

function buildStressUsers(
  role: RoleName,
  countToCreate: number,
  roleId: number,
  passwordHash: string,
) {
  return Array.from({ length: countToCreate }, (_, index) => {
    const sequence = index + 1;
    const padded = sequence.toString().padStart(4, "0");
    const isCustomer = role === "user";
    const isStaff = role === "staff";

    return {
      email: `stress-${role}-${padded}@gigabite.demo`,
      passwordHash,
      name: `Stress ${capitalize(role)} ${padded}`,
      phone: formatBulgarianPhone(role === "manager" ? 87 : isStaff ? 89 : 88, sequence),
      defaultDeliveryAddress: isCustomer
        ? `${sofiaAddresses[index % sofiaAddresses.length]}, entrance ${
            String.fromCharCode(65 + (index % 4))
          }`
        : null,
      workLocation: isStaff || role === "manager" ? getWorkLocation(index) : null,
      roleId,
    };
  });
}

async function insertStressUsers(values: ReturnType<typeof buildStressUsers>) {
  let insertedCount = 0;

  for (const chunk of chunkArray(values, USER_BATCH_SIZE)) {
    const inserted = await db
      .insert(users)
      .values(chunk)
      .onConflictDoNothing({ target: users.email })
      .returning({ id: users.id });

    insertedCount += inserted.length;
  }

  return insertedCount;
}

async function getStressUserIds(role: RoleName, expectedCount: number) {
  const rows = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(inArray(users.email, buildStressEmails(role, expectedCount)))
    .orderBy(users.email);

  return rows.map((row) => row.id);
}

function buildStressEmails(role: RoleName, countToCreate: number) {
  return Array.from({ length: countToCreate }, (_, index) => {
    const padded = (index + 1).toString().padStart(4, "0");
    return `stress-${role}-${padded}@gigabite.demo`;
  });
}

async function getProductsForOrders() {
  const productRows = await db
    .select({ id: products.id, name: products.name, price: products.price })
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(products.id);

  return productRows;
}

function buildStressOrders(
  customerIds: number[],
  managerIds: number[],
  productRows: ProductRow[],
) {
  const plans: StressOrderPlan[] = [];
  let sequence = 1;

  for (const statusEntry of statusPlan) {
    for (let index = 0; index < statusEntry.count; index += 1) {
      const status = statusEntry.status;
      const createdAt = getCreatedAt(sequence, status);
      const updatedAt = getUpdatedAt(createdAt, status, sequence);
      const deliveryType = sequence % 3 === 0 ? "pickup" : "delivery";
      const items = buildOrderItems(sequence, productRows);
      const totalPrice = formatCents(
        items.reduce((sum, item) => sum + toCents(item.lineTotal), BigInt(0)),
      );
      const managerId =
        managerIds.length && ["approved", "in_progress", "completed"].includes(status)
          ? managerIds[sequence % managerIds.length]
          : null;

      plans.push({
        sequence,
        status,
        customerNote: `${STRESS_PREFIX}-${sequence.toString().padStart(5, "0")} - ${
          customerNotes[sequence % customerNotes.length]
        }`,
        customerId: customerIds[sequence % customerIds.length],
        managerId,
        deliveryType,
        deliveryAddress:
          deliveryType === "delivery"
            ? `${sofiaAddresses[sequence % sofiaAddresses.length]}, floor ${(sequence % 8) + 1}`
            : null,
        managerNote:
          status === "pending_approval" || status === "cancel_requested"
            ? null
            : managerNotes[sequence % managerNotes.length],
        totalPrice,
        cancelRequestedAt:
          status === "cancel_requested" || status === "cancelled" ? updatedAt : null,
        cancelApprovedAt: status === "cancelled" ? updatedAt : null,
        createdAt,
        updatedAt,
        items,
      });
      sequence += 1;
    }
  }

  return plans;
}

function buildOrderItems(sequence: number, productRows: ProductRow[]) {
  const itemCount = (sequence % 6) + 1;
  const usedProductIds = new Set<number>();
  const items: StressOrderPlan["items"] = [];

  for (let index = 0; index < itemCount; index += 1) {
    let product = productRows[(sequence * 7 + index * 3) % productRows.length];

    if (usedProductIds.has(product.id)) {
      product = productRows[(sequence * 11 + index * 5) % productRows.length];
    }

    usedProductIds.add(product.id);

    const quantity = ((sequence + index) % 4) + 1;
    const lineTotal = formatCents(toCents(product.price) * BigInt(quantity));

    items.push({
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      quantity,
      lineTotal,
    });
  }

  return items;
}

async function insertStressOrders(orderPlans: StressOrderPlan[]) {
  let insertedOrderCount = 0;
  let insertedOrderItemCount = 0;

  for (const orderChunk of chunkArray(orderPlans, ORDER_BATCH_SIZE)) {
    const insertedOrders = await db
      .insert(orders)
      .values(
        orderChunk.map((order) => ({
          userId: order.customerId,
          status: order.status,
          deliveryType: order.deliveryType,
          deliveryAddress: order.deliveryAddress,
          customerNote: order.customerNote,
          managerNote: order.managerNote,
          totalPrice: order.totalPrice,
          approvedByManagerId: order.managerId,
          cancelRequestedAt: order.cancelRequestedAt,
          cancelApprovedAt: order.cancelApprovedAt,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        })),
      )
      .returning({ id: orders.id });

    insertedOrderCount += insertedOrders.length;

    const itemValues = orderChunk.flatMap((order, index) => {
      const insertedOrder = insertedOrders[index];

      if (!insertedOrder) {
        return [];
      }

      return order.items.map((item) => ({
        orderId: insertedOrder.id,
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      }));
    });

    for (const itemChunk of chunkArray(itemValues, ORDER_ITEM_BATCH_SIZE)) {
      const insertedItems = await db
        .insert(orderItems)
        .values(itemChunk)
        .returning({ id: orderItems.id });

      insertedOrderItemCount += insertedItems.length;
    }
  }

  return {
    orders: insertedOrderCount,
    orderItems: insertedOrderItemCount,
  };
}

async function getStressTotals() {
  const [stressUsers, stressOrders, stressOrderItems] = await Promise.all([
    db
      .select({ count: count() })
      .from(users)
      .where(like(users.email, "stress-%@gigabite.demo")),
    db
      .select({ count: count() })
      .from(orders)
      .where(like(orders.customerNote, `${STRESS_PREFIX}-%`)),
    db
      .select({ count: count() })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(like(orders.customerNote, `${STRESS_PREFIX}-%`)),
  ]);

  return {
    stressUsers: stressUsers[0]?.count ?? 0,
    stressOrders: stressOrders[0]?.count ?? 0,
    stressOrderItems: stressOrderItems[0]?.count ?? 0,
  };
}

function getCreatedAt(sequence: number, status: OrderStatus) {
  const now = new Date();
  const daysBack = status === "completed" ? sequence % 180 : sequence % 21;
  const date = new Date(now);
  date.setDate(date.getDate() - daysBack);
  date.setHours(8 + (sequence % 12), (sequence * 7) % 60, 0, 0);
  return date;
}

function getUpdatedAt(createdAt: Date, status: OrderStatus, sequence: number) {
  const date = new Date(createdAt);

  if (status === "completed" || status === "cancelled") {
    date.setHours(date.getHours() + 1 + (sequence % 3));
  }

  if (status === "in_progress") {
    date.setMinutes(date.getMinutes() + 20);
  }

  return date;
}

function formatBulgarianPhone(prefix: 87 | 88 | 89, sequence: number) {
  const suffix = (1000000 + sequence).toString().slice(-7);
  return `+359 ${prefix} ${suffix.slice(0, 3)} ${suffix.slice(3, 5)} ${suffix.slice(5)}`;
}

function getWorkLocation(index: number) {
  return [
    "Gigabite Center",
    "Gigabite Mall Paradise",
    "Gigabite Studentski Grad",
    "Gigabite Mladost",
  ][index % 4];
}

function capitalize(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

function toCents(value: string) {
  const [whole = "0", fraction = ""] = value.split(".");
  return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0").slice(0, 2));
}

function formatCents(value: bigint) {
  const centsPerUnit = BigInt(100);
  const whole = value / centsPerUnit;
  const fraction = (value % centsPerUnit).toString().padStart(2, "0");
  return `${whole}.${fraction}`;
}

function chunkArray<T>(items: T[], chunkSize: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

main().catch((error) => {
  console.error("Failed to run stress seed.");
  console.error(error);
  process.exit(1);
});
