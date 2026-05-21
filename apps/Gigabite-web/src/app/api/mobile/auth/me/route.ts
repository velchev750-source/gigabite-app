import { NextResponse } from "next/server";

import { withNoStore } from "@/lib/no-store-response";
import { getMobileAuthUser, mobileOptionsResponse, withMobileCors } from "../utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getMobileAuthUser(request);

  if (!user) {
    return withNoStore(
      withMobileCors(
        NextResponse.json({ message: "Mobile session is invalid or expired." }, { status: 401 }),
      ),
    );
  }

  if (user.role !== "user") {
    return withNoStore(
      withMobileCors(
        NextResponse.json(
          { message: "Only customer accounts can use the mobile app." },
          { status: 403 },
        ),
      ),
    );
  }

  return withNoStore(withMobileCors(NextResponse.json({ user })));
}

export function OPTIONS() {
  return mobileOptionsResponse();
}
