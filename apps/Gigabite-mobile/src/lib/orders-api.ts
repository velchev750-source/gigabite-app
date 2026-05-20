import { apiPost } from './api-client';

export type MobileOrderPayload = {
  delivery_type: 'pickup' | 'delivery';
  delivery_address: string | null;
  customer_note: string | null;
  items: {
    product_id: number;
    quantity: number;
  }[];
};

export type MobileOrderResponse = {
  order_id: number;
  status: 'pending_approval';
};

export async function createMobileOrder(payload: MobileOrderPayload, token: string) {
  return apiPost<MobileOrderResponse>('/api/mobile/orders', payload, { token });
}
