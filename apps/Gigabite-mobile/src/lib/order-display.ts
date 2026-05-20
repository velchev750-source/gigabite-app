import type { MobileOrderItem, MobileOrderStatus } from './orders-api';

export function formatOrderStatus(status: MobileOrderStatus) {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getOrderStatusTone(status: MobileOrderStatus) {
  if (status === 'completed') {
    return 'emerald' as const;
  }

  if (status === 'cancelled') {
    return 'rose' as const;
  }

  if (status === 'in_progress') {
    return 'sky' as const;
  }

  if (status === 'cancel_requested') {
    return 'zinc' as const;
  }

  return 'amber' as const;
}

export function isCancellableOrder(status: MobileOrderStatus) {
  return status === 'pending_approval' || status === 'approved';
}

export function formatPrice(value: string | number) {
  const price = typeof value === 'number' ? value : Number(value);
  return `$${Number.isFinite(price) ? price.toFixed(2) : '0.00'}`;
}

export function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

export function getItemsSummary(items: MobileOrderItem[]) {
  if (!items.length) {
    return 'No items';
  }

  const [firstItem, ...remainingItems] = items;
  const firstSummary = `${firstItem.quantity}x ${firstItem.product_name}`;

  if (!remainingItems.length) {
    return firstSummary;
  }

  return `${firstSummary} + ${remainingItems.length} more`;
}
