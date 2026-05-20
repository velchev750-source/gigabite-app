import { NextRequest, NextResponse } from "next/server";

import {
  getManagerOrdersByTab,
  MANAGER_ORDER_PAGE_SIZE,
  type ManagerOrderTab,
} from "@/services/manager-orders";

const managerOrderTabs = [
  "pendingApproval",
  "cancellationRequests",
  "activeOrders",
  "completed",
  "cancelled",
] as const;

function isManagerOrderTab(tab: string | null): tab is ManagerOrderTab {
  return managerOrderTabs.some((allowedTab) => allowedTab === tab);
}

export async function GET(request: NextRequest) {
  const tab = request.nextUrl.searchParams.get("tab");

  if (!isManagerOrderTab(tab)) {
    return NextResponse.json({ error: "Invalid manager order tab." }, { status: 400 });
  }

  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const ordersPage = await getManagerOrdersByTab({
    tab,
    page: Number.isInteger(page) ? page : 1,
    pageSize: MANAGER_ORDER_PAGE_SIZE,
  });

  return NextResponse.json(ordersPage);
}
