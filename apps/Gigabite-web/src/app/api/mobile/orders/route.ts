import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

import type { Order, OrderItem } from "@/db/schema";
import { withNoStore } from "@/lib/no-store-response";
import { getValidationMessage } from "@/lib/validations/form";
import {
  ACTIVE_ORDER_STATUSES,
  createOrderForAuthenticatedCustomer,
  getOrdersForAuthenticatedCustomer,
  OrderValidationError,
} from "@/services/orders";
import { getMobileAuthUser, mobileOptionsResponse, withMobileCors } from "../auth/utils";

const mobileOrderItemSchema = z.object({
  product_id: z.coerce
    .number({ invalid_type_error: "Every order item must reference a valid product." })
    .int("Every order item must reference a valid product.")
    .positive("Every order item must reference a valid product."),
  quantity: z.coerce
    .number({ invalid_type_error: "Order item quantity must be a positive integer." })
    .int("Order item quantity must be a positive integer.")
    .min(1, "Order item quantity must be a positive integer.")
    .max(50, "Order item quantity is too large."),
});

const mobileHotDealItemSchema = z.object({
  hot_deal_id: z.coerce
    .number({ invalid_type_error: "Every Hot Deal item must reference a valid Hot Deal." })
    .int("Every Hot Deal item must reference a valid Hot Deal.")
    .positive("Every Hot Deal item must reference a valid Hot Deal."),
  quantity: z.coerce
    .number({ invalid_type_error: "Hot Deal quantity must be a positive integer." })
    .int("Hot Deal quantity must be a positive integer.")
    .min(1, "Hot Deal quantity must be a positive integer.")
    .max(20, "Hot Deal quantity is too large."),
});

const mobileCreateOrderSchema = z
  .object({
    delivery_type: z.enum(["pickup", "delivery"], {
      required_error: "Choose pickup or delivery.",
    }),
    delivery_address: z
      .string()
      .trim()
      .max(240, "Delivery address is too long.")
      .optional()
      .nullable()
      .transform((value) => value || null),
    customer_note: z
      .string()
      .trim()
      .max(500, "Customer note is too long.")
      .optional()
      .nullable()
      .transform((value) => value || null),
    items: z.array(mobileOrderItemSchema).default([]),
    hot_deals: z.array(mobileHotDealItemSchema).default([]),
  })
  .refine((data) => data.items.length > 0 || data.hot_deals.length > 0, {
    message: "At least one order item is required.",
    path: ["items"],
  })
  .refine((data) => data.delivery_type !== "delivery" || Boolean(data.delivery_address), {
    message: "Delivery address is required for delivery orders.",
    path: ["delivery_address"],
  });

type OrderWithItems = Order & { items: OrderItem[] };

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getMobileAuthUser(request);

  if (!user) {
    return withNoStore(
      withMobileCors(
        NextResponse.json({ message: "Please log in to view orders." }, { status: 401 }),
      ),
    );
  }

  if (user.role !== "user") {
    return withNoStore(
      withMobileCors(
        NextResponse.json(
          { message: "Only customer accounts can view mobile orders." },
          { status: 403 },
        ),
      ),
    );
  }

  try {
    const userOrders = await getOrdersForAuthenticatedCustomer(user);
    const activeStatusSet = new Set<string>(ACTIVE_ORDER_STATUSES);
    const activeOrders = userOrders.filter((order) => activeStatusSet.has(order.status));
    const historyOrders = userOrders.filter((order) =>
      ["completed", "cancelled"].includes(order.status),
    );

    return withNoStore(
      withMobileCors(
        NextResponse.json({
          active_orders: activeOrders.map(toMobileOrderSummary),
          history_orders: historyOrders.map(toMobileOrderSummary),
        }),
      ),
    );
  } catch {
    return withNoStore(
      withMobileCors(
        NextResponse.json({ message: "Orders are temporarily unavailable." }, { status: 500 }),
      ),
    );
  }
}

export async function POST(request: Request) {
  const user = await getMobileAuthUser(request);

  if (!user) {
    return withMobileCors(
      NextResponse.json({ message: "Please log in to place an order." }, { status: 401 }),
    );
  }

  if (user.role !== "user") {
    return withMobileCors(
      NextResponse.json(
        { message: "Only customer accounts can place mobile orders." },
        { status: 403 },
      ),
    );
  }

  try {
    const body = mobileCreateOrderSchema.parse(await request.json());
    const order = await createOrderForAuthenticatedCustomer(user, {
      userId: user.id,
      deliveryType: body.delivery_type,
      deliveryAddress: body.delivery_address,
      customerNote: body.customer_note,
      items: body.items.map((item) => ({
        productId: item.product_id,
        quantity: item.quantity,
      })),
      combos: body.hot_deals.map((item) => ({
        comboOfferId: item.hot_deal_id,
        quantity: item.quantity,
      })),
    });

    return withMobileCors(
      NextResponse.json({
        order_id: order?.id,
        status: order?.status ?? "pending_approval",
      }),
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return withMobileCors(
        NextResponse.json({ message: getValidationMessage(error) }, { status: 400 }),
      );
    }

    if (error instanceof OrderValidationError) {
      return withMobileCors(
        NextResponse.json({ message: error.message }, { status: 400 }),
      );
    }

    return withMobileCors(
      NextResponse.json({ message: "Order creation failed." }, { status: 500 }),
    );
  }
}

export function OPTIONS() {
  return mobileOptionsResponse();
}

function toMobileOrderSummary(order: OrderWithItems) {
  return {
    id: order.id,
    status: order.status,
    delivery_type: order.deliveryType,
    total_price: order.totalPrice,
    created_at: order.createdAt.toISOString(),
    updated_at: order.updatedAt.toISOString(),
    items: order.items.map((item) => ({
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.lineTotal,
    })),
  };
}
