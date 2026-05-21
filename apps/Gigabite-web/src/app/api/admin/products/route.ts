import { NextResponse } from "next/server";

import { getManagerProducts } from "@/services/manager-products";

export async function GET() {
  const productsPage = await getManagerProducts();

  return NextResponse.json(productsPage);
}
