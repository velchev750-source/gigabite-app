import { apiGet } from './api-client';

export type MobileMenuProduct = {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  is_promo: boolean;
  category_id: number;
  category_name: string;
  sort_order: number;
};

export type MobileMenuCategory = {
  id: number;
  name: string;
  description: string;
  sort_order: number;
  products: MobileMenuProduct[];
};

export type MobileMenuResponse = {
  categories: MobileMenuCategory[];
};

export async function getMobileMenu() {
  return apiGet<MobileMenuResponse>('/api/mobile/menu', { skipAuth: true });
}

export async function getMobilePromoProducts(limit = 6) {
  const menu = await getMobileMenu();

  return menu.categories
    .flatMap((category) => category.products)
    .filter((product) => product.is_promo)
    .sort((firstProduct, secondProduct) => firstProduct.sort_order - secondProduct.sort_order)
    .slice(0, limit);
}
