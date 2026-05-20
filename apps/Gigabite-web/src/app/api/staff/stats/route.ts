import { NextResponse } from "next/server";

import { getStaffStats } from "@/services/staff-orders";

export async function GET() {
  const stats = await getStaffStats();

  return NextResponse.json(stats);
}
