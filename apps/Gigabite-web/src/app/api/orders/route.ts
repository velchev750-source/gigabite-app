import { NextResponse } from "next/server";

import { getCurrentUser } from "@/services/auth";
import { createOrder, OrderValidationError } from "@/services/orders";

type CreateOrderRequest = {
  deliveryType?: "pickup" | "delivery";
  deliveryAddress?: string | null;
  customerNote?: string | null;
  items?: Array<{
    productId?: number;
    quantity?: number;
  }>;
};

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Please log in to place an order." }, { status: 401 });
  }

  if (user.role !== "user") {
    return NextResponse.json(
      { message: "Only customer accounts can place orders from the menu." },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as CreateOrderRequest;

    if (body.deliveryType !== "pickup" && body.deliveryType !== "delivery") {
      return NextResponse.json({ message: "Choose pickup or delivery." }, { status: 400 });
    }

    const order = await createOrder({
      userId: user.id,
      deliveryType: body.deliveryType,
      deliveryAddress: body.deliveryAddress,
      customerNote: body.customerNote,
      items:
        body.items?.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
        })) ?? [],
    });

    return NextResponse.json({ orderId: order?.id });
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Order creation failed." }, { status: 500 });
  }
}
