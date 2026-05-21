import { and, asc, count, eq, ne } from "drizzle-orm";

import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { getPublicImageUrl } from "@/lib/get-public-image-url";
import { requireRole } from "@/services/auth";

export type ManagerProductUpdateInput = {
  productId: number;
  categoryId: number;
  name: string;
  description?: string | null;
  price: string;
  imageUrl?: string | null;
  isPromo: boolean;
  isActive: boolean;
};

export class ManagerProductError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "ManagerProductError";
  }
}

const MAX_PROMO_PRODUCTS = 6;

export async function getManagerProducts() {
  await requireRole("manager");

  const [productRows, categoryRows] = await Promise.all([
    db
      .select({
        id: products.id,
        categoryId: products.categoryId,
        categoryName: categories.name,
        name: products.name,
        description: products.description,
        price: products.price,
        imageUrl: products.imageUrl,
        isPromo: products.isPromo,
        isActive: products.isActive,
        sortOrder: products.sortOrder,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(asc(categories.sortOrder), asc(products.sortOrder), asc(products.name)),
    db
      .select({
        id: categories.id,
        name: categories.name,
        isActive: categories.isActive,
        sortOrder: categories.sortOrder,
      })
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.name)),
  ]);

  return {
    products: productRows.map((product) => ({
      ...product,
      description: product.description ?? "",
      imageUrl: product.imageUrl,
      imagePublicUrl: getPublicImageUrl(product.imageUrl),
      price: product.price,
    })),
    categories: categoryRows,
    totalCount: productRows.length,
  };
}

export async function getManagerProductCount() {
  await requireRole("manager");

  const [result] = await db.select({ count: count() }).from(products);

  return result?.count ?? 0;
}

export async function updateManagerProduct(input: ManagerProductUpdateInput) {
  await requireRole("manager");

  validateProductId(input.productId);

  const name = input.name.trim();
  const description = input.description?.trim() || null;
  const price = normalizePrice(input.price);
  const imageUrl = input.imageUrl?.trim() || null;

  if (!name) {
    throw new ManagerProductError("Product name is required.");
  }

  if (name.length > 120) {
    throw new ManagerProductError("Product name is too long.");
  }

  if (description && description.length > 500) {
    throw new ManagerProductError("Product description is too long.");
  }

  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, input.categoryId))
    .limit(1);

  if (!category) {
    throw new ManagerProductError("Choose a valid category.");
  }

  if (input.isPromo) {
    const [promoCount] = await db
      .select({ count: count() })
      .from(products)
      .where(and(eq(products.isPromo, true), ne(products.id, input.productId)));

    if ((promoCount?.count ?? 0) >= MAX_PROMO_PRODUCTS) {
      throw new ManagerProductError(
        `Promo slots are full. Disable another promo product before adding a new one. Maximum is ${MAX_PROMO_PRODUCTS}.`,
      );
    }
  }

  const [updatedProduct] = await db
    .update(products)
    .set({
      categoryId: input.categoryId,
      name,
      description,
      price,
      imageUrl,
      isPromo: input.isPromo,
      isActive: input.isActive,
    })
    .where(eq(products.id, input.productId))
    .returning({ id: products.id });

  if (!updatedProduct) {
    throw new ManagerProductError("Product was not found.", 404);
  }

  return updatedProduct;
}

function validateProductId(productId: number) {
  if (!Number.isInteger(productId) || productId <= 0) {
    throw new ManagerProductError("A valid product id is required.");
  }
}

function normalizePrice(value: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ManagerProductError("Product price must be greater than zero.");
  }

  if (amount > 9999.99) {
    throw new ManagerProductError("Product price is too large.");
  }

  return amount.toFixed(2);
}
