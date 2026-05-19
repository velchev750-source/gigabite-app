"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import {
  customerNoteActionSchema,
  deliveryAddressActionSchema,
  managerNoteActionSchema,
  managerOrderActionSchema,
} from "@/lib/validations/admin";
import { formDataToObject, getValidationMessage } from "@/lib/validations/form";
import { orderIdSchema } from "@/lib/validations/orders";
import {
  createStaffByManagerSchema,
  createUserByManagerSchema,
} from "@/lib/validations/users";
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
  const orderId = orderIdSchema.parse(formDataToObject(formData).orderId);

  await approveOrder(orderId, manager.id);
  revalidatePath("/admin");
}

export async function cancelOrderAction(formData: FormData) {
  await requireRole("manager");
  const { orderId, managerNote } = managerOrderActionSchema.parse(
    formDataToObject(formData),
  );

  await cancelOrder(orderId, managerNote);
  revalidatePath("/admin");
}

export async function approveCancellationAction(formData: FormData) {
  await requireRole("manager");
  const { orderId, managerNote } = managerOrderActionSchema.parse(
    formDataToObject(formData),
  );

  await approveCancellation(orderId, managerNote);
  revalidatePath("/admin");
}

export async function updateManagerNoteAction(formData: FormData) {
  await requireRole("manager");
  const { orderId, managerNote } = managerNoteActionSchema.parse(
    formDataToObject(formData),
  );

  await updateManagerOrderNote(orderId, managerNote);
  revalidatePath("/admin");
}

export async function updateDeliveryAddressAction(formData: FormData) {
  await requireRole("manager");
  const { orderId, deliveryAddress } = deliveryAddressActionSchema.parse(
    formDataToObject(formData),
  );

  await updateDeliveryAddress(orderId, deliveryAddress);
  revalidatePath("/admin");
}

export async function updateCustomerNoteAction(formData: FormData) {
  await requireRole("manager");
  const { orderId, customerNote } = customerNoteActionSchema.parse(
    formDataToObject(formData),
  );

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
    const payload = createUserByManagerSchema.parse(formDataToObject(formData));
    await createUserByManager(payload);
    revalidatePath("/admin");
    return { ok: true, message: "User account created." };
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, message: getValidationMessage(error) };
    }

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
    const payload = createStaffByManagerSchema.parse(formDataToObject(formData));
    await createStaffByManager(payload);
    revalidatePath("/admin");
    return { ok: true, message: "Staff account created." };
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, message: getValidationMessage(error) };
    }

    if (error instanceof ManagerUserError) {
      return { ok: false, message: error.message };
    }

    return { ok: false, message: "Unable to create staff account." };
  }
}
