import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createOrderSchema } from "@/lib/validations/orders";
import { getValidationMessage } from "@/lib/validations/form";
import { getCurrentUser } from "@/services/auth";
import { createOrder, OrderValidationError } from "@/services/orders";

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
    const body = createOrderSchema.parse(await request.json());

    const order = await createOrder({
      userId: user.id,
      deliveryType: body.deliveryType,
      deliveryAddress: body.deliveryAddress,
      customerNote: body.customerNote,
      items: body.items,
      combos: body.combos,
    });

    return NextResponse.json({ orderId: order?.id });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ message: getValidationMessage(error) }, { status: 400 });
    }

    if (error instanceof OrderValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Order creation failed." }, { status: 500 });
  }
}
