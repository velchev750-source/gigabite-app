import React, { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { useAuth } from '@/context/auth-context';
import type { MobileMenuProduct } from '@/lib/menu-api';

export type CartItem = {
  product: MobileMenuProduct;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  getQuantity: (productId: number) => number;
  addItem: (product: MobileMenuProduct, quantity?: number) => void;
  increaseItem: (product: MobileMenuProduct) => void;
  decreaseItem: (product: MobileMenuProduct) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isRestoringSession, token, user } = useAuth();
  const [itemsById, setItemsById] = useState<Record<number, CartItem>>({});
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
      setItemsById({});
    }
  }, [isRestoringSession, token, user]);

  const value = useMemo<CartContextValue>(() => {
    const items = Object.values(itemsById);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    function setQuantity(product: MobileMenuProduct, quantity: number) {
      setItemsById((current) => {
        const updated = { ...current };

        if (quantity <= 0) {
          delete updated[product.id];
          return updated;
        }

        updated[product.id] = { product, quantity };
        return updated;
      });
    }

    return {
      items,
      itemCount,
      totalPrice,
      getQuantity: (productId) => itemsById[productId]?.quantity ?? 0,
      addItem: (product, quantity = 1) =>
        setQuantity(product, (itemsById[product.id]?.quantity ?? 0) + Math.max(1, quantity)),
      increaseItem: (product) => setQuantity(product, (itemsById[product.id]?.quantity ?? 0) + 1),
      decreaseItem: (product) => setQuantity(product, (itemsById[product.id]?.quantity ?? 0) - 1),
      removeItem: (productId) =>
        setItemsById((current) => {
          const updated = { ...current };
          delete updated[productId];
          return updated;
        }),
      clearCart: () => setItemsById({}),
    };
  }, [itemsById]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);

  if (!value) {
    throw new Error('useCart must be used within CartProvider');
  }

  return value;
}
