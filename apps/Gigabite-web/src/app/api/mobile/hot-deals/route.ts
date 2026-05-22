import { NextResponse } from "next/server";

import { getPublicImageUrl } from "@/lib/get-public-image-url";
import { withNoStore } from "@/lib/no-store-response";
import { getActiveComboOffers } from "@/services/combo-offers";
import { mobileOptionsResponse, withMobileCors } from "../auth/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const hotDeals = await getActiveComboOffers();

    return withNoStore(
      withMobileCors(
        NextResponse.json({
          hot_deals: hotDeals.map((hotDeal) => ({
            id: hotDeal.id,
            name: hotDeal.name,
            description: hotDeal.description,
            image_url: getPublicImageUrl(hotDeal.imageUrl),
            discount_percent: hotDeal.discountPercent,
            original_price: hotDeal.originalPrice,
            discounted_price: hotDeal.finalPrice,
            included_products: hotDeal.products.map((product) => ({
              id: product.id,
              name: product.name,
              quantity: product.quantity,
              price: product.price,
            })),
          })),
        }),
      ),
    );
  } catch {
    return withNoStore(
      withMobileCors(
        NextResponse.json({ message: "Hot Deal is temporarily unavailable." }, { status: 500 }),
      ),
    );
  }
}

export function OPTIONS() {
  return mobileOptionsResponse();
}
