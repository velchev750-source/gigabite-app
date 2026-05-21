import { NextRequest, NextResponse } from "next/server";

import { withNoStore } from "@/lib/no-store-response";
import { parseOrderSortOption } from "@/lib/order-sort-options";
import {
  getStaffOrdersByStatus,
  STAFF_ORDER_PAGE_SIZE,
  type StaffOrderStatus,
} from "@/services/staff-orders";

const staffOrderStatuses = ["approved", "in_progress", "completed"] as const;

export const dynamic = "force-dynamic";

function isStaffOrderStatus(status: string | null): status is StaffOrderStatus {
  return staffOrderStatuses.some((allowedStatus) => allowedStatus === status);
}

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");

  if (!isStaffOrderStatus(status)) {
    return withNoStore(
      NextResponse.json({ error: "Invalid staff order status." }, { status: 400 }),
    );
  }

  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const sortBy = parseOrderSortOption(request.nextUrl.searchParams.get("sortBy"));
  const ordersPage = await getStaffOrdersByStatus({
    status,
    page: Number.isInteger(page) ? page : 1,
    pageSize: STAFF_ORDER_PAGE_SIZE,
    sortBy,
  });

  return withNoStore(NextResponse.json(ordersPage));
}
