"use client";

import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";

import {
  getProductCartKey,
  loadWebCart,
  saveWebCart,
  type WebCartItem,
} from "@/lib/web-cart";
import type { PromoProduct } from "@/services/menu";

const fallbackImages: Record<string, string> = {
  Burgers:
    "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=85",
  Pizzas:
    "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=900&q=85",
  "Fries & Sides":
    "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=85",
  Drinks:
    "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=85",
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

function getProductImage(product: PromoProduct) {
  return (
    product.imageUrl ||
    fallbackImages[product.categoryName] ||
    fallbackImages.Burgers
  );
}

function addPromoProductToCart(product: PromoProduct) {
  const cart = loadWebCart();
  const cartKey = getProductCartKey(product.id);
  const existing = cart[cartKey];
  const cartItem: WebCartItem = {
    product: {
      id: product.id,
      name: product.name,
      price: product.price,
    },
    quantity: (existing?.quantity ?? 0) + 1,
  };

  saveWebCart({
    ...cart,
    [cartKey]: cartItem,
  });
}

function PromoProductCard({
  product,
  onAdded,
}: {
  product: PromoProduct;
  onAdded: (productName: string) => void;
}) {
  return (
    <article className="group overflow-hidden rounded-lg border border-white/10 bg-zinc-900 shadow-xl shadow-black/25 transition duration-300 hover:-translate-y-2 hover:border-rose-400/40">
      <div className="relative h-56 overflow-hidden">
        <Image
          src={getProductImage(product)}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-110"
        />
        <span className="absolute left-4 top-4 rounded-md bg-zinc-950/80 px-3 py-1 text-xs font-black text-amber-200 backdrop-blur">
          {product.categoryName}
        </span>
        {product.isPromo ? (
          <span className="absolute right-4 top-4 rounded-md bg-rose-500/90 px-3 py-1 text-xs font-black text-white backdrop-blur">
            Promo
          </span>
        ) : null}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-black text-white">{product.name}</h3>
          <span className="rounded-md bg-emerald-400/15 px-3 py-1 text-sm font-black text-emerald-200">
            {formatPrice(product.price)}
          </span>
        </div>
        <p className="mt-3 min-h-12 text-sm leading-6 text-zinc-300">
          {product.description}
        </p>
        <button
          onClick={() => {
            addPromoProductToCart(product);
            onAdded(product.name);
          }}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-rose-500 px-4 py-3 text-sm font-black text-white transition hover:bg-rose-400"
        >
          <ShoppingCart className="size-4" aria-hidden="true" />
          Add to Cart
        </button>
      </div>
    </article>
  );
}

export function PromoDealsSection({ products }: { products: PromoProduct[] }) {
  const [cartMessage, setCartMessage] = useState<string | null>(null);

  if (!products.length) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-white/10 bg-zinc-950 p-8 text-center">
        <p className="text-lg font-black text-white">No promo deals yet.</p>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Check back soon for active Gigabite offers.
        </p>
      </div>
    );
  }

  return (
    <>
      {cartMessage ? (
        <p className="mx-auto mb-5 max-w-7xl rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100">
          {cartMessage}
        </p>
      ) : null}
      <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <PromoProductCard
            key={product.id}
            product={product}
            onAdded={(productName) => setCartMessage(`${productName} added to your cart.`)}
          />
        ))}
      </div>
    </>
  );
}
