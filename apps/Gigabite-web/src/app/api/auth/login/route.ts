import { NextResponse } from "next/server";

import {
  AuthError,
  createAuthToken,
  getDashboardPath,
  loginUser,
  setAuthCookie,
} from "@/services/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await loginUser({
      email: String(body.email ?? ""),
      password: String(body.password ?? ""),
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

    return NextResponse.json({ message: "Login failed." }, { status: 500 });
  }
}
