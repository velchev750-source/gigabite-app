import { NextRequest, NextResponse } from "next/server";

import {
  getManageableStaff,
  MANAGER_STAFF_PAGE_SIZE,
} from "@/services/manager-users";

export async function GET(request: NextRequest) {
  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const staffPage = await getManageableStaff({
    page: Number.isInteger(page) ? page : 1,
    pageSize: MANAGER_STAFF_PAGE_SIZE,
  });

  return NextResponse.json(staffPage);
}
