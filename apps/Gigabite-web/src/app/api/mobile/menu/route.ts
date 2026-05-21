import { NextResponse } from "next/server";

import { getPublicImageUrl } from "@/lib/get-public-image-url";
import { withNoStore } from "@/lib/no-store-response";
import { getActiveMenu } from "@/services/menu";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await getActiveMenu();

    return withNoStore(
      withCors(
        NextResponse.json({
          categories: categories.map((category) => ({
            id: category.id,
            name: category.name,
            description: category.description,
            sort_order: category.sortOrder,
            products: category.products.map((product) => ({
              id: product.id,
              name: product.name,
              description: product.description,
              price: product.price,
              image_url: getPublicImageUrl(product.imageUrl),
              is_promo: product.isPromo,
              category_id: product.categoryId,
              category_name: category.name,
              sort_order: product.sortOrder,
            })),
          })),
        }),
      ),
    );
  } catch {
    return withNoStore(
      withCors(
        NextResponse.json({ message: "Menu is temporarily unavailable." }, { status: 500 }),
      ),
    );
  }
}

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

function withCors(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}
