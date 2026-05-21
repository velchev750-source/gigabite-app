import { NextResponse } from "next/server";

import { withNoStore } from "@/lib/no-store-response";
import { getStaffStats } from "@/services/staff-orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const stats = await getStaffStats();

  return withNoStore(NextResponse.json(stats));
}
