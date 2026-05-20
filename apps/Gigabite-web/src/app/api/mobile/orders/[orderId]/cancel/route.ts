import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getValidationMessage } from "@/lib/validations/form";
import { orderIdSchema } from "@/lib/validations/orders";
import {
  OrderValidationError,
  requestOrderCancellationForAuthenticatedCustomer,
} from "@/services/orders";
import { getMobileAuthUser, mobileOptionsResponse, withMobileCors } from "../../../auth/utils";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const user = await getMobileAuthUser(request);

  if (!user) {
    return withMobileCors(
      NextResponse.json({ message: "Please log in to cancel an order." }, { status: 401 }),
    );
  }

  if (user.role !== "user") {
    return withMobileCors(
      NextResponse.json(
        { message: "Only customer accounts can cancel mobile orders." },
        { status: 403 },
      ),
    );
  }

  try {
    const params = await context.params;
    const orderId = orderIdSchema.parse(params.orderId);
    const order = await requestOrderCancellationForAuthenticatedCustomer(user, orderId);

    return withMobileCors(
      NextResponse.json({
        order_id: order.id,
        status: order.status,
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
      NextResponse.json({ message: "Order cancellation failed." }, { status: 500 }),
    );
  }
}

export function OPTIONS() {
  return mobileOptionsResponse();
}
