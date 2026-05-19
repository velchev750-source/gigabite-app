import type { ZodError } from "zod";

export function formDataToObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export function getValidationMessage(error: ZodError) {
  return error.issues[0]?.message ?? "Invalid input.";
}
