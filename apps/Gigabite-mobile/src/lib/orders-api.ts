import { apiGet, apiPatch, apiPost } from './api-client';

export type MobileOrderStatus =
  | 'pending_approval'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'cancel_requested'
  | 'cancelled';

export type MobileDeliveryType = 'pickup' | 'delivery';

export type MobileOrderItem = {
  product_name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
};

export type MobileOrderSummary = {
  id: number;
  status: MobileOrderStatus;
  delivery_type: MobileDeliveryType;
  total_price: string;
  created_at: string;
  updated_at: string;
  items: MobileOrderItem[];
};

export type MobileOrderDetails = MobileOrderSummary & {
  delivery_address: string | null;
  customer_note: string | null;
  manager_note: string | null;
};

export type MobileOrdersResponse = {
  active_orders: MobileOrderSummary[];
  history_orders: MobileOrderSummary[];
};

export type MobileOrderPayload = {
  delivery_type: 'pickup' | 'delivery';
  delivery_address: string | null;
  customer_note: string | null;
  items: {
    product_id: number;
    quantity: number;
  }[];
  hot_deals?: {
    hot_deal_id: number;
    quantity: number;
  }[];
};

export type MobileOrderResponse = {
  order_id: number;
  status: 'pending_approval';
};

export async function createMobileOrder(payload: MobileOrderPayload, token?: string) {
  return apiPost<MobileOrderResponse>('/api/mobile/orders', payload, { token });
}

export async function getMobileOrders(token?: string) {
  return apiGet<MobileOrdersResponse>('/api/mobile/orders', { token });
}

export async function getMobileOrderDetails(orderId: number, token?: string) {
  return apiGet<{ order: MobileOrderDetails }>(`/api/mobile/orders/${orderId}`, { token });
}

export async function requestMobileOrderCancellation(orderId: number, token?: string) {
  return apiPatch<{ order_id: number; status: 'cancel_requested' }>(
    `/api/mobile/orders/${orderId}/cancel`,
    {},
    { token },
  );
}
