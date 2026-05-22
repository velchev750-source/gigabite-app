import { z } from "zod";

export const orderIdSchema = z.coerce
  .number({ invalid_type_error: "A valid order id is required." })
  .int("A valid order id is required.")
  .positive("A valid order id is required.");

export const orderItemInputSchema = z.object({
  productId: z.coerce
    .number({ invalid_type_error: "Every order item must reference a valid product." })
    .int("Every order item must reference a valid product.")
    .positive("Every order item must reference a valid product."),
  quantity: z.coerce
    .number({ invalid_type_error: "Order item quantity must be a positive integer." })
    .int("Order item quantity must be a positive integer.")
    .min(1, "Order item quantity must be a positive integer.")
    .max(50, "Order item quantity is too large."),
});

export const comboOrderItemInputSchema = z.object({
  comboOfferId: z.coerce
    .number({ invalid_type_error: "Every hot deal item must reference a valid hot deal." })
    .int("Every hot deal item must reference a valid hot deal.")
    .positive("Every hot deal item must reference a valid hot deal."),
  quantity: z.coerce
    .number({ invalid_type_error: "Hot deal quantity must be a positive integer." })
    .int("Hot deal quantity must be a positive integer.")
    .min(1, "Hot deal quantity must be a positive integer.")
    .max(20, "Hot deal quantity is too large."),
});

export const createOrderSchema = z
  .object({
    deliveryType: z.enum(["pickup", "delivery"], {
      required_error: "Choose pickup or delivery.",
    }),
    deliveryAddress: z
      .string()
      .trim()
      .max(240, "Delivery address is too long.")
      .optional()
      .nullable()
      .transform((value) => value || null),
    customerNote: z
      .string()
      .trim()
      .max(500, "Customer note is too long.")
      .optional()
      .nullable()
      .transform((value) => value || null),
    items: z.array(orderItemInputSchema).default([]),
    combos: z.array(comboOrderItemInputSchema).default([]),
  })
  .refine((data) => data.items.length > 0 || data.combos.length > 0, {
    message: "At least one order item is required.",
    path: ["items"],
  })
  .refine((data) => data.deliveryType !== "delivery" || Boolean(data.deliveryAddress), {
    message: "Delivery address is required for delivery orders.",
    path: ["deliveryAddress"],
  });

export type CreateOrderPayload = z.infer<typeof createOrderSchema>;
