import { and, asc, eq, inArray } from "drizzle-orm";

import { categories, products } from "@/db/schema";

export type MenuProduct = {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  isPromo: boolean;
  sortOrder: number;
};

export type MenuCategory = {
  id: number;
  name: string;
  description: string;
  sortOrder: number;
  products: MenuProduct[];
};

export type PromoProduct = MenuProduct & {
  categoryName: string;
};

export async function getActiveMenu(): Promise<MenuCategory[]> {
  const { db } = await import("@/db");

  const activeCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      description: categories.description,
      sortOrder: categories.sortOrder,
    })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  if (!activeCategories.length) {
    return [];
  }

  const activeCategoryIds = activeCategories.map((category) => category.id);
  const activeProducts = await db
    .select({
      id: products.id,
      categoryId: products.categoryId,
      name: products.name,
      description: products.description,
      price: products.price,
      imageUrl: products.imageUrl,
      isPromo: products.isPromo,
      sortOrder: products.sortOrder,
    })
    .from(products)
    .where(
      and(
        eq(products.isActive, true),
        inArray(products.categoryId, activeCategoryIds),
      ),
    )
    .orderBy(asc(products.sortOrder), asc(products.name));

  const productsByCategory = new Map<number, MenuProduct[]>();

  for (const product of activeProducts) {
    const categoryProducts = productsByCategory.get(product.categoryId) ?? [];

    categoryProducts.push({
      ...product,
      description: product.description ?? "",
      price: Number(product.price),
    });
    productsByCategory.set(product.categoryId, categoryProducts);
  }

  return activeCategories.map((category) => ({
    ...category,
    description: category.description ?? "",
    products: productsByCategory.get(category.id) ?? [],
  }));
}

export async function getPromoProducts(limit = 6): Promise<PromoProduct[]> {
  const { db } = await import("@/db");

  const promoProducts = await db
    .select({
      id: products.id,
      categoryId: products.categoryId,
      categoryName: categories.name,
      name: products.name,
      description: products.description,
      price: products.price,
      imageUrl: products.imageUrl,
      isPromo: products.isPromo,
      sortOrder: products.sortOrder,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.isActive, true), eq(products.isPromo, true)))
    .orderBy(asc(products.sortOrder), asc(products.name))
    .limit(limit);

  return promoProducts.map((product) => ({
    ...product,
    description: product.description ?? "",
    price: Number(product.price),
  }));
}
