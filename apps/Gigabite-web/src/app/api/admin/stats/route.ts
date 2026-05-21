import { NextResponse } from "next/server";

import { withNoStore } from "@/lib/no-store-response";
import { getManagerMetrics } from "@/services/manager-orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const metrics = await getManagerMetrics();

  return withNoStore(NextResponse.json(metrics));
}
