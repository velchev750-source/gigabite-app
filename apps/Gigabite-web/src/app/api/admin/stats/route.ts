import { NextResponse } from "next/server";

import { getManagerMetrics } from "@/services/manager-orders";

export async function GET() {
  const metrics = await getManagerMetrics();

  return NextResponse.json(metrics);
}
