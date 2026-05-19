import { NextResponse } from "next/server";

import {
  AuthError,
  createAuthToken,
  getDashboardPath,
  registerCustomer,
  setAuthCookie,
} from "@/services/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await registerCustomer({
      name: String(body.name ?? ""),
      email: String(body.email ?? ""),
      phone: body.phone ? String(body.phone) : null,
      deliveryAddress: body.deliveryAddress ? String(body.deliveryAddress) : null,
      password: String(body.password ?? ""),
      confirmPassword: String(body.confirmPassword ?? ""),
    });
    const token = createAuthToken(user);

    await setAuthCookie(token);

    return NextResponse.json({
      user,
      redirectTo: getDashboardPath(user.role),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json({ message: "Registration failed." }, { status: 500 });
  }
}
