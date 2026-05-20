import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { loginSchema } from "@/lib/validations/auth";
import { getValidationMessage } from "@/lib/validations/form";
import { AuthError, createAuthToken, loginUser } from "@/services/auth";
import { mobileOptionsResponse, withMobileCors } from "../utils";

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const user = await loginUser(body);

    if (user.role !== "user") {
      return withMobileCors(
        NextResponse.json(
          { message: "Only customer accounts can use the mobile app." },
          { status: 403 },
        ),
      );
    }

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

    return withMobileCors(NextResponse.json({ message: "Login failed." }, { status: 500 }));
  }
}

export function OPTIONS() {
  return mobileOptionsResponse();
}
