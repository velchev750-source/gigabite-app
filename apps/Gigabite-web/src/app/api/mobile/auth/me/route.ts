import { NextResponse } from "next/server";

import { getMobileAuthUser, mobileOptionsResponse, withMobileCors } from "../utils";

export async function GET(request: Request) {
  const user = await getMobileAuthUser(request);

  return withMobileCors(NextResponse.json({ user }));
}

export function OPTIONS() {
  return mobileOptionsResponse();
}
