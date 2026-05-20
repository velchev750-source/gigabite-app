import { NextRequest, NextResponse } from "next/server";

import {
  getStaffOrdersByStatus,
  STAFF_ORDER_PAGE_SIZE,
  type StaffOrderStatus,
} from "@/services/staff-orders";

const staffOrderStatuses = ["approved", "in_progress", "completed"] as const;

function isStaffOrderStatus(status: string | null): status is StaffOrderStatus {
  return staffOrderStatuses.some((allowedStatus) => allowedStatus === status);
}

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");

  if (!isStaffOrderStatus(status)) {
    return NextResponse.json({ error: "Invalid staff order status." }, { status: 400 });
  }

  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const ordersPage = await getStaffOrdersByStatus({
    status,
    page: Number.isInteger(page) ? page : 1,
    pageSize: STAFF_ORDER_PAGE_SIZE,
  });

  return NextResponse.json(ordersPage);
}
