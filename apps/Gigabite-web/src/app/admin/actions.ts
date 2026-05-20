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
  updateStaffByManagerSchema,
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
  updateStaffByManager,
} from "@/services/manager-users";

export type AdminFormState = {
  message: string;
  ok: boolean;
};

const emptyState: AdminFormState = {
  message: "",
  ok: false,
};

export async function approveOrderAction(
  _state: AdminFormState = emptyState,
  formData: FormData,
): Promise<AdminFormState> {
  void _state;

  try {
    const manager = await requireRole("manager");
    const orderId = orderIdSchema.parse(formDataToObject(formData).orderId);

    await approveOrder(orderId, manager.id);
    revalidatePath("/admin");
    return { ok: true, message: "Order approved." };
  } catch {
    return { ok: false, message: "Unable to approve order." };
  }
}

export async function cancelOrderAction(
  _state: AdminFormState = emptyState,
  formData: FormData,
): Promise<AdminFormState> {
  void _state;

  try {
    await requireRole("manager");
    const { orderId, managerNote } = managerOrderActionSchema.parse(
      formDataToObject(formData),
    );

    await cancelOrder(orderId, managerNote);
    revalidatePath("/admin");
    return { ok: true, message: "Order cancelled." };
  } catch {
    return { ok: false, message: "Unable to cancel order." };
  }
}

export async function approveCancellationAction(
  _state: AdminFormState = emptyState,
  formData: FormData,
): Promise<AdminFormState> {
  void _state;

  try {
    await requireRole("manager");
    const { orderId, managerNote } = managerOrderActionSchema.parse(
      formDataToObject(formData),
    );

    await approveCancellation(orderId, managerNote);
    revalidatePath("/admin");
    return { ok: true, message: "Cancellation approved." };
  } catch {
    return { ok: false, message: "Unable to approve cancellation." };
  }
}

export async function updateManagerNoteAction(
  _state: AdminFormState = emptyState,
  formData: FormData,
): Promise<AdminFormState> {
  void _state;

  try {
    await requireRole("manager");
    const { orderId, managerNote } = managerNoteActionSchema.parse(
      formDataToObject(formData),
    );

    await updateManagerOrderNote(orderId, managerNote);
    revalidatePath("/admin");
    return { ok: true, message: "Manager note saved." };
  } catch {
    return { ok: false, message: "Unable to save manager note." };
  }
}

export async function updateDeliveryAddressAction(
  _state: AdminFormState = emptyState,
  formData: FormData,
): Promise<AdminFormState> {
  void _state;

  try {
    await requireRole("manager");
    const { orderId, deliveryAddress } = deliveryAddressActionSchema.parse(
      formDataToObject(formData),
    );

    await updateDeliveryAddress(orderId, deliveryAddress);
    revalidatePath("/admin");
    return { ok: true, message: "Delivery address saved." };
  } catch {
    return { ok: false, message: "Unable to save delivery address." };
  }
}

export async function updateCustomerNoteAction(
  _state: AdminFormState = emptyState,
  formData: FormData,
): Promise<AdminFormState> {
  void _state;

  try {
    await requireRole("manager");
    const { orderId, customerNote } = customerNoteActionSchema.parse(
      formDataToObject(formData),
    );

    await updateCustomerNote(orderId, customerNote);
    revalidatePath("/admin");
    return { ok: true, message: "Customer note saved." };
  } catch {
    return { ok: false, message: "Unable to save customer note." };
  }
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

export async function updateStaffByManagerAction(
  _state: AdminFormState = emptyState,
  formData: FormData,
): Promise<AdminFormState> {
  void _state;
  await requireRole("manager");

  try {
    const payload = updateStaffByManagerSchema.parse(formDataToObject(formData));
    await updateStaffByManager(payload);
    revalidatePath("/admin");
    return { ok: true, message: "Staff account updated." };
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, message: getValidationMessage(error) };
    }

    if (error instanceof ManagerUserError) {
      return { ok: false, message: error.message };
    }

    return { ok: false, message: "Unable to update staff account." };
  }
}
