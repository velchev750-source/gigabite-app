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

export const managerProductUpdateSchema = z.object({
  categoryId: z.coerce
    .number({ invalid_type_error: "Choose a valid category." })
    .int("Choose a valid category.")
    .positive("Choose a valid category."),
  name: z.string().trim().min(1, "Product name is required.").max(120),
  description: z
    .string()
    .trim()
    .max(500, "Product description is too long.")
    .optional()
    .nullable()
    .transform((value) => value || null),
  price: z.string().trim().min(1, "Product price is required."),
  imageUrl: z
    .string()
    .trim()
    .max(1000, "Image URL is too long.")
    .optional()
    .nullable()
    .transform((value) => value || null),
  isPromo: z.boolean(),
  isActive: z.boolean(),
});
