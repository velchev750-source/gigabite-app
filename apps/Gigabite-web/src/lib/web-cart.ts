export const CART_STORAGE_KEY = "gigabite_cart";
export const CART_UPDATED_EVENT = "gigabite:cart-updated";

export type WebCartProductItem = {
  type?: "product";
  product: {
    id: number;
    name: string;
    price: number;
  };
  quantity: number;
};

export type WebCartComboItem = {
  type: "combo";
  comboOfferId: number;
  name: string;
  description: string;
  discountPercent: number;
  originalPrice: number;
  discountedPrice: number;
  includedProducts: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
  }>;
  quantity: number;
};

export type WebCartItem = WebCartProductItem | WebCartComboItem;
export type WebCart = Record<string, WebCartItem>;

export function loadWebCart() {
  if (typeof window === "undefined") {
    return {};
  }

  const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);

  if (!savedCart) {
    return {};
  }

  try {
    return normalizeWebCart(JSON.parse(savedCart) as WebCart);
  } catch {
    window.localStorage.removeItem(CART_STORAGE_KEY);
    return {};
  }
}

function normalizeWebCart(cart: WebCart) {
  const normalizedCart: WebCart = {};

  for (const item of Object.values(cart)) {
    normalizedCart[getWebCartItemKey(item)] = item;
  }

  return normalizedCart;
}

export function saveWebCart(cart: WebCart) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
}

export function clearWebCart() {
  window.localStorage.removeItem(CART_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
}

export function getWebCartCount(cart: WebCart) {
  return Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
}

export function getWebCartItemKey(item: WebCartItem) {
  return item.type === "combo" ? `combo:${item.comboOfferId}` : `product:${item.product.id}`;
}

export function getProductCartKey(productId: number) {
  return `product:${productId}`;
}

export function getComboCartKey(comboOfferId: number) {
  return `combo:${comboOfferId}`;
}

export function getWebCartItemPrice(item: WebCartItem) {
  return item.type === "combo" ? item.discountedPrice : item.product.price;
}

export function getWebCartItemName(item: WebCartItem) {
  return item.type === "combo" ? item.name : item.product.name;
}

export function updateWebCartQuantity(cart: WebCart, itemKey: string, quantity: number) {
  const updatedCart = { ...cart };

  if (quantity <= 0) {
    delete updatedCart[itemKey];
    return updatedCart;
  }

  const item = updatedCart[itemKey];

  if (!item) {
    return updatedCart;
  }

  updatedCart[itemKey] = {
    ...item,
    quantity,
  };

  return updatedCart;
}
