import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { registerSchema } from "@/lib/validations/auth";
import { getValidationMessage } from "@/lib/validations/form";
import { AuthError, createAuthToken, registerCustomer } from "@/services/auth";
import { mobileOptionsResponse, withMobileCors } from "../utils";

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json());
    const user = await registerCustomer(body);

    return withMobileCors(
      NextResponse.json({
        token: createAuthToken(user),
        user,
      }),
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return withMobileCors(
        NextResponse.json({ message: getValidationMessage(error) }, { status: 400 }),
      );
    }

    if (error instanceof AuthError) {
      return withMobileCors(
        NextResponse.json({ message: error.message }, { status: error.status }),
      );
    }

    return withMobileCors(
      NextResponse.json({ message: "Registration failed." }, { status: 500 }),
    );
  }
}

export function OPTIONS() {
  return mobileOptionsResponse();
}
