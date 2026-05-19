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
import {
  createStaffByManager,
  createUserByManager,
  ManagerUserError,
} from "@/services/manager-users";

export type AdminFormState = {
  message: string;
  ok: boolean;
};

const emptyState: AdminFormState = {
  message: "",
  ok: false,
};

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

export async function createUserByManagerAction(
  _state: AdminFormState = emptyState,
  formData: FormData,
): Promise<AdminFormState> {
  void _state;
  await requireRole("manager");

  try {
    await createUserByManager({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      defaultDeliveryAddress: String(formData.get("defaultDeliveryAddress") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    });
    revalidatePath("/admin");
    return { ok: true, message: "User account created." };
  } catch (error) {
    if (error instanceof ManagerUserError) {
      return { ok: false, message: error.message };
    }

    return { ok: false, message: "Unable to create user account." };
  }
}

export async function createStaffByManagerAction(
  _state: AdminFormState = emptyState,
  formData: FormData,
): Promise<AdminFormState> {
  void _state;
  await requireRole("manager");

  try {
    await createStaffByManager({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      workLocation: String(formData.get("workLocation") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    });
    revalidatePath("/admin");
    return { ok: true, message: "Staff account created." };
  } catch (error) {
    if (error instanceof ManagerUserError) {
      return { ok: false, message: error.message };
    }

    return { ok: false, message: "Unable to create staff account." };
  }
}
