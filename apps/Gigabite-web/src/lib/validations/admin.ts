import { z } from "zod";

import { orderIdSchema } from "@/lib/validations/orders";

export const managerNoteSchema = z
  .string()
  .trim()
  .max(500, "Manager note is too long.")
  .optional()
  .nullable()
  .transform((value) => value || null);

export const customerNoteSchema = z
  .string()
  .trim()
  .max(500, "Customer note is too long.")
  .optional()
  .nullable()
  .transform((value) => value || null);

export const deliveryAddressEditSchema = z
  .string()
  .trim()
  .min(1, "Delivery address is required.")
  .max(240, "Delivery address is too long.");

export const managerOrderActionSchema = z.object({
  orderId: orderIdSchema,
  managerNote: managerNoteSchema,
});

export const managerNoteActionSchema = z.object({
  orderId: orderIdSchema,
  managerNote: managerNoteSchema,
});

export const customerNoteActionSchema = z.object({
  orderId: orderIdSchema,
  customerNote: customerNoteSchema,
});

export const deliveryAddressActionSchema = z.object({
  orderId: orderIdSchema,
  deliveryAddress: deliveryAddressEditSchema,
});
