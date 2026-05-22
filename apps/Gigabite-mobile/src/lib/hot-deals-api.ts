import { apiGet } from './api-client';

export type MobileHotDealProduct = {
  id: number;
  name: string;
  quantity: number;
  price: number;
};

export type MobileHotDeal = {
  id: number;
  name: string;
  description: string;
  image_url: string | null;
  discount_percent: number;
  original_price: number;
  discounted_price: number;
  included_products: MobileHotDealProduct[];
};

export type MobileHotDealsResponse = {
  hot_deals: MobileHotDeal[];
};

export async function getMobileHotDeals() {
  return apiGet<MobileHotDealsResponse>('/api/mobile/hot-deals', { skipAuth: true });
}
