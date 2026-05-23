import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { comboOfferItems, comboOffers, products } from "@/db/schema";
import { calculateHotDealPricing } from "@/lib/pricing";
import { requireRole } from "@/services/auth";

export type ComboOfferProduct = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

export type ComboOfferView = {
  id: number;
  name: string;
  description: string;
  discountPercent: number;
  imageUrl: string | null;
  isActive: boolean;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  products: ComboOfferProduct[];
};

export type ComboOfferInput = {
  name: string;
  description?: string | null;
  discountPercent: number;
  imageUrl?: string | null;
  isActive: boolean;
  productIds: number[];
};

export class ComboOfferError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "ComboOfferError";
  }
}

export async function getActiveComboOffers() {
  const offers = await getComboOfferRows(true);

  return mapComboOffers(offers);
}

export async function getManagerComboOffers() {
  await requireRole("manager");

  const [offers, activeProducts] = await Promise.all([
    getComboOfferRows(false),
    db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        isActive: products.isActive,
      })
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(asc(products.name)),
  ]);

  return {
    comboOffers: mapComboOffers(offers),
    products: activeProducts.map((product) => ({
      ...product,
      price: Number(product.price),
    })),
  };
}

export async function createManagerComboOffer(input: ComboOfferInput) {
  await requireRole("manager");
  const validated = await validateComboOfferInput(input);

  const [comboOffer] = await db
    .insert(comboOffers)
    .values({
      name: validated.name,
      description: validated.description,
      discountPercent: validated.discountPercent,
      imageUrl: validated.imageUrl,
      isActive: validated.isActive,
    })
    .returning({ id: comboOffers.id });

  await db.insert(comboOfferItems).values(
    validated.productIds.map((productId) => ({
      comboOfferId: comboOffer.id,
      productId,
      quantity: 1,
    })),
  );

  return comboOffer;
}

export async function updateManagerComboOffer(comboOfferId: number, input: ComboOfferInput) {
  await requireRole("manager");

  if (!Number.isInteger(comboOfferId) || comboOfferId <= 0) {
    throw new ComboOfferError("A valid hot deal id is required.");
  }

  const validated = await validateComboOfferInput(input);

  const [updatedComboOffer] = await db
    .update(comboOffers)
    .set({
      name: validated.name,
      description: validated.description,
      discountPercent: validated.discountPercent,
      imageUrl: validated.imageUrl,
      isActive: validated.isActive,
    })
    .where(eq(comboOffers.id, comboOfferId))
    .returning({ id: comboOffers.id });

  if (!updatedComboOffer) {
    throw new ComboOfferError("Hot deal was not found.", 404);
  }

  await db.delete(comboOfferItems).where(eq(comboOfferItems.comboOfferId, comboOfferId));
  await db.insert(comboOfferItems).values(
    validated.productIds.map((productId) => ({
      comboOfferId,
      productId,
      quantity: 1,
    })),
  );

  return updatedComboOffer;
}

async function getComboOfferRows(activeOnly: boolean) {
  return db.query.comboOffers.findMany({
    where: activeOnly ? eq(comboOffers.isActive, true) : undefined,
    orderBy: [asc(comboOffers.name)],
    with: {
      items: {
        with: {
          product: {
            columns: {
              id: true,
              name: true,
              price: true,
              isActive: true,
            },
          },
        },
      },
    },
  });
}

async function validateComboOfferInput(input: ComboOfferInput) {
  const name = input.name.trim();
  const description = input.description?.trim() || null;
  const imageUrl = input.imageUrl?.trim() || null;
  const discountPercent = Number(input.discountPercent);
  const productIds = [...new Set(input.productIds.map(Number))];

  if (!name) {
    throw new ComboOfferError("Hot deal name is required.");
  }

  if (name.length > 120) {
    throw new ComboOfferError("Hot deal name is too long.");
  }

  if (description && description.length > 500) {
    throw new ComboOfferError("Hot deal description is too long.");
  }

  if (!Number.isInteger(discountPercent) || discountPercent < 1 || discountPercent > 90) {
    throw new ComboOfferError("Discount percent must be between 1 and 90.");
  }

  if (productIds.length !== 3) {
    throw new ComboOfferError("Choose exactly 3 active products.");
  }

  const matchingProducts = await db
    .select({ id: products.id })
    .from(products)
    .where(and(inArray(products.id, productIds), eq(products.isActive, true)));
  const activeProductIds = new Set(matchingProducts.map((product) => product.id));

  if (productIds.some((productId) => !activeProductIds.has(productId))) {
    throw new ComboOfferError("Selected products must exist and be active.");
  }

  return {
    name,
    description,
    discountPercent,
    imageUrl,
    isActive: input.isActive,
    productIds,
  };
}

function mapComboOffers(
  offers: Array<{
    id: number;
    name: string;
    description: string | null;
    discountPercent: number;
    imageUrl: string | null;
    isActive: boolean;
    items: Array<{
      quantity: number;
      product: {
        id: number;
        name: string;
        price: string;
      };
    }>;
  }>,
): ComboOfferView[] {
  return offers.map((offer) => {
    const offerProducts = offer.items.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      price: Number(item.product.price),
      quantity: item.quantity,
    }));
    const { originalPrice, discountAmount, finalPrice } = calculateHotDealPricing(
      offerProducts,
      offer.discountPercent,
    );

    return {
      id: offer.id,
      name: offer.name,
      description: offer.description ?? "",
      discountPercent: offer.discountPercent,
      imageUrl: offer.imageUrl,
      isActive: offer.isActive,
      originalPrice,
      discountAmount,
      finalPrice,
      products: offerProducts,
    };
  });
}
