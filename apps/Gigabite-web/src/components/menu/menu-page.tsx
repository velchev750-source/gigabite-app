"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";

import type { MenuCategory, MenuProduct } from "@/services/menu";

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

type CartItem = {
  product: MenuProduct;
  quantity: number;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

function getProductImage(product: MenuProduct, categoryName: string) {
  return product.imageUrl || fallbackImages[categoryName] || fallbackImages.Burgers;
}

export function MenuPage({ categories }: { categories: MenuCategory[] }) {
  const [activeCategoryId, setActiveCategoryId] = useState<number | "all">("all");
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [cart, setCart] = useState<Record<number, CartItem>>({});

  const products = useMemo(() => {
    return categories.flatMap((category) =>
      category.products.map((product) => ({
        ...product,
        categoryName: category.name,
      })),
    );
  }, [categories]);

  const visibleProducts = useMemo(() => {
    if (activeCategoryId === "all") {
      return products;
    }

    return products.filter((product) => product.categoryId === activeCategoryId);
  }, [activeCategoryId, products]);

  const cartItems = Object.values(cart);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  function getQuantity(productId: number) {
    return quantities[productId] ?? 1;
  }

  function setProductQuantity(productId: number, quantity: number) {
    setQuantities((current) => ({
      ...current,
      [productId]: Math.min(12, Math.max(1, quantity)),
    }));
  }

  function addToCart(product: MenuProduct) {
    const quantity = getQuantity(product.id);

    setCart((current) => {
      const existing = current[product.id];

      return {
        ...current,
        [product.id]: {
          product,
          quantity: (existing?.quantity ?? 0) + quantity,
        },
      };
    });
  }

  return (
    <>
      <main>
        <section className="relative overflow-hidden bg-zinc-950 px-4 py-20 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.24),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(244,63,94,0.22),transparent_34%)]" />
          <div className="relative mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm font-bold text-amber-200">
                <Sparkles className="size-4" aria-hidden="true" />
                Fresh from the Gigabite kitchen
              </div>
              <h1 className="text-5xl font-black leading-tight text-white sm:text-6xl">
                Our Menu
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
                Choose your favorite Gigabite meals, tune the quantity, and
                build a quick local cart before checkout arrives.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-zinc-950 px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-center gap-3 text-zinc-300">
              <SlidersHorizontal className="size-5 text-amber-300" aria-hidden="true" />
              <p className="text-sm font-semibold uppercase">Filter by category</p>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-3">
              <button
                onClick={() => setActiveCategoryId("all")}
                className={`shrink-0 rounded-md px-5 py-3 text-sm font-black transition ${
                  activeCategoryId === "all"
                    ? "bg-amber-400 text-zinc-950"
                    : "border border-white/10 bg-white/5 text-zinc-200 hover:border-amber-300/60 hover:text-amber-200"
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategoryId(category.id)}
                  className={`shrink-0 rounded-md px-5 py-3 text-sm font-black transition ${
                    activeCategoryId === category.id
                      ? "bg-amber-400 text-zinc-950"
                      : "border border-white/10 bg-white/5 text-zinc-200 hover:border-amber-300/60 hover:text-amber-200"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-zinc-900 px-4 pb-28 pt-8 sm:px-6 lg:px-8 lg:pb-20">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_360px]">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((product) => (
                <article
                  key={product.id}
                  className="group overflow-hidden rounded-lg border border-white/10 bg-zinc-950 shadow-xl shadow-black/25 transition duration-300 hover:-translate-y-2 hover:border-rose-400/40"
                >
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={getProductImage(product, product.categoryName)}
                      alt={product.name}
                      fill
                      sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-110"
                    />
                    <span className="absolute left-4 top-4 rounded-md bg-zinc-950/80 px-3 py-1 text-xs font-black text-amber-200 backdrop-blur">
                      {product.categoryName}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="text-lg font-black text-white">
                        {product.name}
                      </h2>
                      <span className="rounded-md bg-emerald-400/15 px-3 py-1 text-sm font-black text-emerald-200">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                    <p className="mt-3 min-h-16 text-sm leading-6 text-zinc-300">
                      {product.description}
                    </p>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <div className="grid grid-cols-3 overflow-hidden rounded-md border border-white/10">
                        <button
                          onClick={() =>
                            setProductQuantity(product.id, getQuantity(product.id) - 1)
                          }
                          className="grid size-11 place-items-center text-zinc-200 transition hover:bg-white/10"
                          aria-label={`Decrease ${product.name} quantity`}
                        >
                          <Minus className="size-4" aria-hidden="true" />
                        </button>
                        <span className="grid size-11 place-items-center bg-white/5 text-sm font-black text-white">
                          {getQuantity(product.id)}
                        </span>
                        <button
                          onClick={() =>
                            setProductQuantity(product.id, getQuantity(product.id) + 1)
                          }
                          className="grid size-11 place-items-center text-zinc-200 transition hover:bg-white/10"
                          aria-label={`Increase ${product.name} quantity`}
                        >
                          <Plus className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-rose-500 px-4 py-3 text-sm font-black text-white transition hover:bg-rose-400"
                      >
                        <ShoppingCart className="size-4" aria-hidden="true" />
                        Add
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-lg border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/30">
                <CartSummary
                  cartItems={cartItems}
                  totalItems={totalItems}
                  totalPrice={totalPrice}
                />
              </div>
            </aside>
          </div>
        </section>
      </main>
      <div className="fixed inset-x-4 bottom-4 z-40 lg:hidden">
        <div className="rounded-lg border border-white/10 bg-zinc-950/95 p-4 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-zinc-400">Cart total</p>
              <p className="text-xl font-black text-white">
                {totalItems} items · {formatPrice(totalPrice)}
              </p>
            </div>
            <Link
              href="/checkout"
              className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-4 py-3 text-sm font-black text-zinc-950"
            >
              Checkout
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function CartSummary({
  cartItems,
  totalItems,
  totalPrice,
}: {
  cartItems: CartItem[];
  totalItems: number;
  totalPrice: number;
}) {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-lg bg-amber-400 text-zinc-950">
          <ShoppingBag className="size-6" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-black text-white">Your Cart</h2>
          <p className="text-sm text-zinc-400">{totalItems} items selected</p>
        </div>
      </div>
      <div className="grid gap-3">
        {cartItems.length ? (
          cartItems.map((item) => (
            <div
              key={item.product.id}
              className="flex items-start justify-between gap-4 rounded-md bg-white/[0.04] p-3"
            >
              <div>
                <p className="text-sm font-black text-white">{item.product.name}</p>
                <p className="mt-1 text-xs text-zinc-400">Qty {item.quantity}</p>
              </div>
              <p className="text-sm font-black text-emerald-200">
                {formatPrice(item.product.price * item.quantity)}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-md border border-dashed border-white/15 p-5 text-sm leading-6 text-zinc-400">
            Add products from the menu to see your quick order summary.
          </div>
        )}
      </div>
      <div className="mt-6 border-t border-white/10 pt-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-300">Total</span>
          <span className="text-2xl font-black text-white">
            {formatPrice(totalPrice)}
          </span>
        </div>
        <Link
          href="/checkout"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-amber-400 px-5 py-4 text-sm font-black text-zinc-950 transition hover:bg-amber-300"
        >
          Go to Checkout <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
