import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { registerSchema } from "@/lib/validations/auth";
import { getValidationMessage } from "@/lib/validations/form";
import {
  AuthError,
  createAuthToken,
  getDashboardPath,
  registerCustomer,
  setAuthCookie,
} from "@/services/auth";

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json());
    const user = await registerCustomer(body);
    const token = createAuthToken(user);

    await setAuthCookie(token);

    return NextResponse.json({
      user,
      redirectTo: getDashboardPath(user.role),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ message: getValidationMessage(error) }, { status: 400 });
    }

    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json({ message: "Registration failed." }, { status: 500 });
  }
}
