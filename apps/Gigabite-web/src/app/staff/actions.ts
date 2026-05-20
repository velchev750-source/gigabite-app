"use server";

import { revalidatePath } from "next/cache";

import { formDataToObject } from "@/lib/validations/form";
import { orderIdSchema } from "@/lib/validations/orders";
import { requireRole } from "@/services/auth";
import { completeOrder, startOrderPreparation } from "@/services/staff-orders";

export type StaffActionState = {
  ok: boolean;
  message: string | null;
};

export async function startPreparationAction(
  _previousState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  await requireRole("staff");
  const orderId = orderIdSchema.parse(formDataToObject(formData).orderId);

  await startOrderPreparation(orderId);
  revalidatePath("/staff");

  return { ok: true, message: "Order moved to in progress." };
}

export async function completeOrderAction(
  _previousState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  await requireRole("staff");
  const orderId = orderIdSchema.parse(formDataToObject(formData).orderId);

  await completeOrder(orderId);
  revalidatePath("/staff");

  return { ok: true, message: "Order marked completed." };
}
