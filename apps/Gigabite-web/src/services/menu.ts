import { and, asc, eq, inArray } from "drizzle-orm";

import { categories, products } from "@/db/schema";

export type MenuProduct = {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  sortOrder: number;
};

export type MenuCategory = {
  id: number;
  name: string;
  description: string;
  sortOrder: number;
  products: MenuProduct[];
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
