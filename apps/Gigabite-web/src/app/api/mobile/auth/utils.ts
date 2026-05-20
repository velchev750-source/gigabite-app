import { NextResponse } from "next/server";

import { getCurrentUserFromBearerToken } from "@/services/auth";

export function withMobileCors(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  return response;
}

export function mobileOptionsResponse() {
  return withMobileCors(new NextResponse(null, { status: 204 }));
}

export function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();
  return token || null;
}

export async function getMobileAuthUser(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  return getCurrentUserFromBearerToken(token);
}
