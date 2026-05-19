import { z } from "zod";

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .nullable()
    .transform((value) => value || null);

const managedAccountBaseSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  phone: optionalText(30),
  password: z.string().min(6, "Password must be at least 6 characters.").max(128),
  confirmPassword: z.string().min(1, "Confirm password is required."),
});

const passwordConfirmation = <T extends { password: string; confirmPassword: string }>(
  data: T,
) => data.password === data.confirmPassword;

export const createUserByManagerSchema = managedAccountBaseSchema
  .extend({
    defaultDeliveryAddress: optionalText(240),
  })
  .refine(passwordConfirmation, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const createStaffByManagerSchema = managedAccountBaseSchema
  .extend({
    workLocation: z.string().trim().min(1, "Work location is required for staff users.").max(120),
  })
  .refine(passwordConfirmation, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type CreateUserByManagerPayload = z.infer<typeof createUserByManagerSchema>;
export type CreateStaffByManagerPayload = z.infer<typeof createStaffByManagerSchema>;
