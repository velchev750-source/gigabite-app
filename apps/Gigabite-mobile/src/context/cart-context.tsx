import React, { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { useAuth } from '@/context/auth-context';
import type { MobileHotDeal } from '@/lib/hot-deals-api';
import type { MobileMenuProduct } from '@/lib/menu-api';

export type ProductCartItem = {
  type: 'product';
  product: MobileMenuProduct;
  quantity: number;
};

export type HotDealCartItem = {
  type: 'hotDeal';
  hotDeal: MobileHotDeal;
  quantity: number;
};

export type CartItem = ProductCartItem | HotDealCartItem;

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  getQuantity: (productId: number) => number;
  addItem: (product: MobileMenuProduct, quantity?: number) => void;
  addHotDeal: (hotDeal: MobileHotDeal, quantity?: number) => void;
  increaseItem: (product: MobileMenuProduct) => void;
  decreaseItem: (product: MobileMenuProduct) => void;
  removeItem: (productId: number) => void;
  increaseCartItem: (item: CartItem) => void;
  decreaseCartItem: (item: CartItem) => void;
  removeCartItem: (item: CartItem) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isRestoringSession, token, user } = useAuth();
  const [itemsByKey, setItemsByKey] = useState<Record<string, CartItem>>({});
  const previousCartOwnerKey = useRef<string | null>(null);

  useEffect(() => {
    if (isRestoringSession) {
      return;
    }

    const cartOwnerKey = user && token ? `${user.id}:${token}` : 'guest';

    if (previousCartOwnerKey.current === null) {
      previousCartOwnerKey.current = cartOwnerKey;
      return;
    }

    if (previousCartOwnerKey.current !== cartOwnerKey) {
      previousCartOwnerKey.current = cartOwnerKey;
      setItemsByKey({});
    }
  }, [isRestoringSession, token, user]);

  const value = useMemo<CartContextValue>(() => {
    const items = Object.values(itemsByKey);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce(
      (sum, item) => sum + getCartItemUnitPrice(item) * item.quantity,
      0,
    );

    function setQuantity(product: MobileMenuProduct, quantity: number) {
      setItemsByKey((current) => {
        const updated = { ...current };
        const key = getProductCartKey(product.id);

        if (quantity <= 0) {
          delete updated[key];
          return updated;
        }

        updated[key] = { type: 'product', product, quantity };
        return updated;
      });
    }

    function setHotDealQuantity(hotDeal: MobileHotDeal, quantity: number) {
      setItemsByKey((current) => {
        const updated = { ...current };
        const key = getHotDealCartKey(hotDeal.id);

        if (quantity <= 0) {
          delete updated[key];
          return updated;
        }

        updated[key] = { type: 'hotDeal', hotDeal, quantity };
        return updated;
      });
    }

    return {
      items,
      itemCount,
      totalPrice,
      getQuantity: (productId) => itemsByKey[getProductCartKey(productId)]?.quantity ?? 0,
      addItem: (product, quantity = 1) =>
        setQuantity(
          product,
          (itemsByKey[getProductCartKey(product.id)]?.quantity ?? 0) + Math.max(1, quantity),
        ),
      addHotDeal: (hotDeal, quantity = 1) =>
        setHotDealQuantity(
          hotDeal,
          (itemsByKey[getHotDealCartKey(hotDeal.id)]?.quantity ?? 0) + Math.max(1, quantity),
        ),
      increaseItem: (product) =>
        setQuantity(product, (itemsByKey[getProductCartKey(product.id)]?.quantity ?? 0) + 1),
      decreaseItem: (product) =>
        setQuantity(product, (itemsByKey[getProductCartKey(product.id)]?.quantity ?? 0) - 1),
      removeItem: (productId) =>
        setItemsByKey((current) => {
          const updated = { ...current };
          delete updated[getProductCartKey(productId)];
          return updated;
        }),
      increaseCartItem: (item) => {
        if (item.type === 'hotDeal') {
          setHotDealQuantity(item.hotDeal, item.quantity + 1);
          return;
        }

        setQuantity(item.product, item.quantity + 1);
      },
      decreaseCartItem: (item) => {
        if (item.type === 'hotDeal') {
          setHotDealQuantity(item.hotDeal, item.quantity - 1);
          return;
        }

        setQuantity(item.product, item.quantity - 1);
      },
      removeCartItem: (item) =>
        setItemsByKey((current) => {
          const updated = { ...current };
          delete updated[getCartItemKey(item)];
          return updated;
        }),
      clearCart: () => setItemsByKey({}),
    };
  }, [itemsByKey]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);

  if (!value) {
    throw new Error('useCart must be used within CartProvider');
  }

  return value;
}

export function getCartItemKey(item: CartItem) {
  return item.type === 'hotDeal' ? getHotDealCartKey(item.hotDeal.id) : getProductCartKey(item.product.id);
}

export function getCartItemName(item: CartItem) {
  return item.type === 'hotDeal' ? item.hotDeal.name : item.product.name;
}

export function getCartItemUnitPrice(item: CartItem) {
  return item.type === 'hotDeal' ? item.hotDeal.discounted_price : item.product.price;
}

function getProductCartKey(productId: number) {
  return `product:${productId}`;
}

function getHotDealCartKey(hotDealId: number) {
  return `hotDeal:${hotDealId}`;
}
