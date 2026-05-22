import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const roleNameEnum = pgEnum("role_name", ["user", "staff", "manager"]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending_approval",
  "approved",
  "in_progress",
  "completed",
  "cancel_requested",
  "cancelled",
]);

export const deliveryTypeEnum = pgEnum("delivery_type", ["pickup", "delivery"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

export const roles = pgTable(
  "roles",
  {
    id: serial("id").primaryKey(),
    name: roleNameEnum("name").notNull(),
  },
  (table) => [uniqueIndex("roles_name_idx").on(table.name)],
);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    defaultDeliveryAddress: text("default_delivery_address"),
    workLocation: text("work_location"),
    roleId: integer("role_id")
      .notNull()
      .references(() => roles.id),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    index("users_role_id_idx").on(table.roleId),
  ],
);

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    name: text("name").notNull(),
    description: text("description"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").default(true).notNull(),
    isPromo: boolean("is_promo").default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    ...timestamps,
  },
  (table) => [index("products_category_id_idx").on(table.categoryId)],
);

export const comboOffers = pgTable(
  "combo_offers",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    discountPercent: integer("discount_percent").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    index("combo_offers_is_active_idx").on(table.isActive),
    check(
      "combo_offers_discount_percent_range",
      sql`${table.discountPercent} between 1 and 90`,
    ),
  ],
);

export const comboOfferItems = pgTable(
  "combo_offer_items",
  {
    id: serial("id").primaryKey(),
    comboOfferId: integer("combo_offer_id")
      .notNull()
      .references(() => comboOffers.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id),
    quantity: integer("quantity").default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("combo_offer_items_combo_offer_id_idx").on(table.comboOfferId),
    index("combo_offer_items_product_id_idx").on(table.productId),
    check("combo_offer_items_quantity_positive", sql`${table.quantity} > 0`),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    status: orderStatusEnum("status").default("pending_approval").notNull(),
    deliveryType: deliveryTypeEnum("delivery_type").notNull(),
    deliveryAddress: text("delivery_address"),
    customerNote: text("customer_note"),
    managerNote: text("manager_note"),
    totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
    approvedByManagerId: integer("approved_by_manager_id").references(() => users.id, {
      onDelete: "set null",
    }),
    cancelRequestedAt: timestamp("cancel_requested_at", { withTimezone: true }),
    cancelApprovedAt: timestamp("cancel_approved_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("orders_user_id_idx").on(table.userId),
    index("orders_status_idx").on(table.status),
    index("orders_created_at_idx").on(table.createdAt),
    check(
      "orders_delivery_address_required_for_delivery",
      sql`${table.deliveryType} <> 'delivery' OR ${table.deliveryAddress} IS NOT NULL`,
    ),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id),
    comboOfferId: integer("combo_offer_id").references(() => comboOffers.id, {
      onDelete: "set null",
    }),
    comboGroupKey: text("combo_group_key"),
    comboName: text("combo_name"),
    comboDiscountPercent: integer("combo_discount_percent"),
    comboOriginalPrice: numeric("combo_original_price", { precision: 10, scale: 2 }),
    comboFinalPrice: numeric("combo_final_price", { precision: 10, scale: 2 }),
    productName: text("product_name").notNull(),
    unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: numeric("line_total", { precision: 10, scale: 2 }).notNull(),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
    check("order_items_quantity_positive", sql`${table.quantity} > 0`),
  ],
);

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  orders: many(orders, { relationName: "customer_orders" }),
  approvedOrders: many(orders, { relationName: "approved_orders" }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ many, one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
  comboOfferItems: many(comboOfferItems),
}));

export const comboOffersRelations = relations(comboOffers, ({ many }) => ({
  items: many(comboOfferItems),
  orderItems: many(orderItems),
}));

export const comboOfferItemsRelations = relations(comboOfferItems, ({ one }) => ({
  comboOffer: one(comboOffers, {
    fields: [comboOfferItems.comboOfferId],
    references: [comboOffers.id],
  }),
  product: one(products, {
    fields: [comboOfferItems.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
    relationName: "customer_orders",
  }),
  approvedByManager: one(users, {
    fields: [orders.approvedByManagerId],
    references: [users.id],
    relationName: "approved_orders",
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  comboOffer: one(comboOffers, {
    fields: [orderItems.comboOfferId],
    references: [comboOffers.id],
  }),
}));

export type Role = typeof roles.$inferSelect;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ComboOffer = typeof comboOffers.$inferSelect;
export type ComboOfferItem = typeof comboOfferItems.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
