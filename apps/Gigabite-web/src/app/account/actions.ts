"use server";

import { revalidatePath } from "next/cache";

import { formDataToObject } from "@/lib/validations/form";
import { orderIdSchema } from "@/lib/validations/orders";
import { requireRole } from "@/services/auth";
import { requestOrderCancellation } from "@/services/orders";

export async function requestCancellationAction(formData: FormData) {
  const user = await requireRole("user");
  const orderId = orderIdSchema.parse(formDataToObject(formData).orderId);

  await requestOrderCancellation(user.id, orderId);
  revalidatePath("/account");
  revalidatePath(`/account/orders/${orderId}`);
}
