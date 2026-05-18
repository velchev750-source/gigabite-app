import { NextResponse } from "next/server";

import { clearAuthCookie } from "@/services/auth";

export async function POST() {
  await clearAuthCookie();

  return NextResponse.json({ ok: true });
}
