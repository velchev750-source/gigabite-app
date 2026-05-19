"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/services/auth";
import { completeOrder, startOrderPreparation } from "@/services/staff-orders";

export async function startPreparationAction(formData: FormData) {
  await requireRole("staff");
  const orderId = Number(formData.get("orderId"));

  await startOrderPreparation(orderId);
  revalidatePath("/staff");
}

export async function completeOrderAction(formData: FormData) {
  await requireRole("staff");
  const orderId = Number(formData.get("orderId"));

  await completeOrder(orderId);
  revalidatePath("/staff");
}
