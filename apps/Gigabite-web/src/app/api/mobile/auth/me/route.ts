import { NextResponse } from "next/server";

import { getMobileAuthUser, mobileOptionsResponse, withMobileCors } from "../utils";

export async function GET(request: Request) {
  const user = await getMobileAuthUser(request);

  if (!user) {
    return withMobileCors(
      NextResponse.json({ message: "Mobile session is invalid or expired." }, { status: 401 }),
    );
  }

  if (user.role !== "user") {
    return withMobileCors(
      NextResponse.json(
        { message: "Only customer accounts can use the mobile app." },
        { status: 403 },
      ),
    );
  }

  return withMobileCors(NextResponse.json({ user }));
}

export function OPTIONS() {
  return mobileOptionsResponse();
}
