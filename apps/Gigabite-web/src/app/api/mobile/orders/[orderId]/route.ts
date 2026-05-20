import { NextResponse } from "next/server";
import { ZodError } from "zod";

import type { Order, OrderItem } from "@/db/schema";
import { getValidationMessage } from "@/lib/validations/form";
import { orderIdSchema } from "@/lib/validations/orders";
import {
  getOrderDetailsForAuthenticatedCustomer,
  OrderValidationError,
} from "@/services/orders";
import { getMobileAuthUser, mobileOptionsResponse, withMobileCors } from "../../auth/utils";

type OrderWithItems = Order & { items: OrderItem[] };

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const user = await getMobileAuthUser(request);

  if (!user) {
    return withMobileCors(
      NextResponse.json({ message: "Please log in to view order details." }, { status: 401 }),
    );
  }

  if (user.role !== "user") {
    return withMobileCors(
      NextResponse.json(
        { message: "Only customer accounts can view mobile orders." },
        { status: 403 },
      ),
    );
  }

  try {
    const params = await context.params;
    const orderId = orderIdSchema.parse(params.orderId);
    const order = await getOrderDetailsForAuthenticatedCustomer(user, orderId);

    if (!order) {
      return withMobileCors(
        NextResponse.json({ message: "Order was not found." }, { status: 404 }),
      );
    }

    return withMobileCors(NextResponse.json({ order: toMobileOrderDetails(order) }));
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
      NextResponse.json({ message: "Order details are temporarily unavailable." }, { status: 500 }),
    );
  }
}

export function OPTIONS() {
  return mobileOptionsResponse();
}

function toMobileOrderDetails(order: OrderWithItems) {
  return {
    id: order.id,
    status: order.status,
    delivery_type: order.deliveryType,
    delivery_address: order.deliveryAddress,
    customer_note: order.customerNote,
    manager_note: order.managerNote,
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
