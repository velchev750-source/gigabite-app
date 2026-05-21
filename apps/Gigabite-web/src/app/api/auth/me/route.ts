import { NextResponse } from "next/server";

import { withNoStore } from "@/lib/no-store-response";
import { getCurrentUser } from "@/services/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  return withNoStore(NextResponse.json({ user }));
}
