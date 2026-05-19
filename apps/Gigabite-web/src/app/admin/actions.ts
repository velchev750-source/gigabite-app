"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/services/auth";
import {
  approveCancellation,
  approveOrder,
  cancelOrder,
  updateCustomerNote,
  updateDeliveryAddress,
  updateManagerOrderNote,
} from "@/services/manager-orders";

export async function approveOrderAction(formData: FormData) {
  const manager = await requireRole("manager");
  const orderId = Number(formData.get("orderId"));

  await approveOrder(orderId, manager.id);
  revalidatePath("/admin");
}

export async function cancelOrderAction(formData: FormData) {
  await requireRole("manager");
  const orderId = Number(formData.get("orderId"));
  const managerNote = String(formData.get("managerNote") ?? "");

  await cancelOrder(orderId, managerNote);
  revalidatePath("/admin");
}

export async function approveCancellationAction(formData: FormData) {
  await requireRole("manager");
  const orderId = Number(formData.get("orderId"));
  const managerNote = String(formData.get("managerNote") ?? "");

  await approveCancellation(orderId, managerNote);
  revalidatePath("/admin");
}

export async function updateManagerNoteAction(formData: FormData) {
  await requireRole("manager");
  const orderId = Number(formData.get("orderId"));
  const managerNote = String(formData.get("managerNote") ?? "");

  await updateManagerOrderNote(orderId, managerNote);
  revalidatePath("/admin");
}

export async function updateDeliveryAddressAction(formData: FormData) {
  await requireRole("manager");
  const orderId = Number(formData.get("orderId"));
  const deliveryAddress = String(formData.get("deliveryAddress") ?? "");

  await updateDeliveryAddress(orderId, deliveryAddress);
  revalidatePath("/admin");
}

export async function updateCustomerNoteAction(formData: FormData) {
  await requireRole("manager");
  const orderId = Number(formData.get("orderId"));
  const customerNote = String(formData.get("customerNote") ?? "");

  await updateCustomerNote(orderId, customerNote);
  revalidatePath("/admin");
}
