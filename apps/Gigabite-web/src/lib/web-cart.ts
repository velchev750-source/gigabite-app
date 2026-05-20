export const CART_STORAGE_KEY = "gigabite_cart";
export const CART_UPDATED_EVENT = "gigabite:cart-updated";

export type WebCartItem = {
  product: {
    id: number;
    name: string;
    price: number;
  };
  quantity: number;
};

export type WebCart = Record<number, WebCartItem>;

export function loadWebCart() {
  if (typeof window === "undefined") {
    return {};
  }

  const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);

  if (!savedCart) {
    return {};
  }

  try {
    return JSON.parse(savedCart) as WebCart;
  } catch {
    window.localStorage.removeItem(CART_STORAGE_KEY);
    return {};
  }
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

export function updateWebCartQuantity(cart: WebCart, productId: number, quantity: number) {
  const updatedCart = { ...cart };

  if (quantity <= 0) {
    delete updatedCart[productId];
    return updatedCart;
  }

  const item = updatedCart[productId];

  if (!item) {
    return updatedCart;
  }

  updatedCart[productId] = {
    ...item,
    quantity,
  };

  return updatedCart;
}
