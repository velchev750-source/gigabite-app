import { NextResponse } from "next/server";

import { getCurrentUser } from "@/services/auth";

export async function GET() {
  const user = await getCurrentUser();

  return NextResponse.json({ user });
}
