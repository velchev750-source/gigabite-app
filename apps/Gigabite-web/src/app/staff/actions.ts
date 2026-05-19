"use server";

import { revalidatePath } from "next/cache";

import { formDataToObject } from "@/lib/validations/form";
import { orderIdSchema } from "@/lib/validations/orders";
import { requireRole } from "@/services/auth";
import { completeOrder, startOrderPreparation } from "@/services/staff-orders";

export async function startPreparationAction(formData: FormData) {
  await requireRole("staff");
  const orderId = orderIdSchema.parse(formDataToObject(formData).orderId);

  await startOrderPreparation(orderId);
  revalidatePath("/staff");
}

export async function completeOrderAction(formData: FormData) {
  await requireRole("staff");
  const orderId = orderIdSchema.parse(formDataToObject(formData).orderId);

  await completeOrder(orderId);
  revalidatePath("/staff");
}
