"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/services/auth";
import { requestOrderCancellation } from "@/services/orders";

export async function requestCancellationAction(formData: FormData) {
  const user = await requireRole("user");
  const orderId = Number(formData.get("orderId"));

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return;
  }

  await requestOrderCancellation(user.id, orderId);
  revalidatePath("/account");
  revalidatePath(`/account/orders/${orderId}`);
}
