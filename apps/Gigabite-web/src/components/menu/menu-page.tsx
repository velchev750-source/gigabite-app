"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  loadWebCart,
  getComboCartKey,
  getProductCartKey,
  getWebCartItemKey,
  getWebCartItemName,
  getWebCartItemPrice,
  saveWebCart,
  updateWebCartQuantity,
  type WebCart,
  type WebCartItem,
} from "@/lib/web-cart";
import type { ComboOfferView } from "@/services/combo-offers";
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

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

function getProductImage(product: MenuProduct, categoryName: string) {
  return product.imageUrl || fallbackImages[categoryName] || fallbackImages.Burgers;
}

export function MenuPage({
  categories,
  comboOffers,
  initialCategoryName,
  initialSection,
  userRole,
}: {
  categories: MenuCategory[];
  comboOffers: ComboOfferView[];
  initialCategoryName?: string;
  initialSection?: string;
  userRole: "user" | "staff" | "manager" | null;
}) {
  const router = useRouter();
  const [activeCategoryId, setActiveCategoryId] = useState<number | "all" | "hotDeals">(() =>
    getInitialActiveCategoryId(categories, initialCategoryName, initialSection),
  );
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [comboQuantities, setComboQuantities] = useState<Record<number, number>>({});
  const [cart, setCart] = useState<WebCart>({});
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [cartMessage, setCartMessage] = useState<string | null>(null);

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

    if (activeCategoryId === "hotDeals") {
      return [];
    }

    return products.filter((product) => product.categoryId === activeCategoryId);
  }, [activeCategoryId, products]);

  const cartItems = Object.values(cart);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + getWebCartItemPrice(item) * item.quantity,
    0,
  );
  const shouldShowHotDeals = comboOffers.length > 0 && (
    activeCategoryId === "all" || activeCategoryId === "hotDeals"
  );

  useEffect(() => {
    queueMicrotask(() => {
      setCart(loadWebCart());
      queueMicrotask(() => setIsCartLoaded(true));
    });
  }, []);

  useEffect(() => {
    if (!isCartLoaded) {
      return;
    }

    saveWebCart(cart);
  }, [cart, isCartLoaded]);

  function getQuantity(productId: number) {
    return quantities[productId] ?? 1;
  }

  function setProductQuantity(productId: number, quantity: number) {
    setQuantities((current) => ({
      ...current,
      [productId]: Math.min(12, Math.max(1, quantity)),
    }));
  }

  function getComboQuantity(comboOfferId: number) {
    return comboQuantities[comboOfferId] ?? 1;
  }

  function setComboQuantity(comboOfferId: number, quantity: number) {
    setComboQuantities((current) => ({
      ...current,
      [comboOfferId]: Math.min(12, Math.max(1, quantity)),
    }));
  }

  function addToCart(product: MenuProduct) {
    const quantity = getQuantity(product.id);

    setCart((current) => {
      const cartKey = getProductCartKey(product.id);
      const existing = current[cartKey];

      return {
        ...current,
        [cartKey]: {
          product,
          quantity: (existing?.quantity ?? 0) + quantity,
        },
      };
    });
    setCartMessage(`${product.name} added to your cart.`);
  }

  function addComboToCart(comboOffer: ComboOfferView) {
    const quantity = getComboQuantity(comboOffer.id);

    setCart((current) => {
      const cartKey = getComboCartKey(comboOffer.id);
      const existing = current[cartKey];

      return {
        ...current,
        [cartKey]: {
          type: "combo",
          comboOfferId: comboOffer.id,
          name: comboOffer.name,
          description: comboOffer.description,
          discountPercent: comboOffer.discountPercent,
          originalPrice: comboOffer.originalPrice,
          discountedPrice: comboOffer.finalPrice,
          includedProducts: comboOffer.products,
          quantity: (existing?.quantity ?? 0) + quantity,
        },
      };
    });
    setCartMessage(`${comboOffer.name} added to your cart.`);
  }

  function updateCartItemQuantity(item: WebCartItem, quantity: number) {
    setCart((current) => updateWebCartQuantity(current, getWebCartItemKey(item), quantity));
  }

  function removeCartItem(item: WebCartItem) {
    setCart((current) => updateWebCartQuantity(current, getWebCartItemKey(item), 0));
  }

  function goToCheckout() {
    if (!userRole) {
      router.push("/login?next=/checkout");
      return;
    }

    if (userRole !== "user") {
      setCartMessage("Staff and manager accounts should use their role dashboard.");
      return;
    }

    router.push("/checkout");
  }

  return (
    <>
      <main>
        <section className="relative overflow-hidden bg-zinc-950 px-4 py-20 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.24),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(244,63,94,0.22),transparent_34%)]" />
          <div className="relative mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-black leading-tight text-white sm:text-6xl">
                Our Menu
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
                Choose your favorite Gigabite meals, tune the quantity, and
                build a quick local cart before checkout arrives.
              </p>
            </div>
            {cartMessage ? (
              <div className="mt-6 max-w-xl rounded-md border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-100">
                {cartMessage}
              </div>
            ) : null}
          </div>
        </section>

        <section className="bg-zinc-950 px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
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
              {comboOffers.length ? (
                <button
                  onClick={() => setActiveCategoryId("hotDeals")}
                  className={`shrink-0 rounded-md px-5 py-3 text-sm font-black transition ${
                    activeCategoryId === "hotDeals"
                      ? "bg-amber-400 text-zinc-950"
                      : "border border-white/10 bg-white/5 text-zinc-200 hover:border-amber-300/60 hover:text-amber-200"
                  }`}
                >
                  Hot Deal
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section id="cart" className="scroll-mt-24 bg-zinc-900 px-4 pb-28 pt-8 sm:px-6 lg:px-8 lg:pb-20">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_360px]">
            <div id="hot-deals" className="grid scroll-mt-24 gap-5 md:grid-cols-2 xl:grid-cols-3">
              <span id="combo-deals" className="sr-only" aria-hidden="true" />
              {shouldShowHotDeals
                ? comboOffers.map((comboOffer) => (
                  <ComboOfferCard
                    key={comboOffer.id}
                    comboOffer={comboOffer}
                    quantity={getComboQuantity(comboOffer.id)}
                    onDecrease={() =>
                      setComboQuantity(comboOffer.id, getComboQuantity(comboOffer.id) - 1)
                    }
                    onIncrease={() =>
                      setComboQuantity(comboOffer.id, getComboQuantity(comboOffer.id) + 1)
                    }
                    onAdd={() => addComboToCart(comboOffer)}
                  />
                ))
                : null}
              {visibleProducts.length ? visibleProducts.map((product) => (
                <article
                  key={product.id}
                  className="group flex h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-zinc-950 shadow-xl shadow-black/25 transition duration-300 hover:-translate-y-2 hover:border-rose-400/40"
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
                    {product.isPromo ? (
                      <span className="absolute right-4 top-4 rounded-md bg-rose-500/90 px-3 py-1 text-xs font-black text-white backdrop-blur">
                        Promo
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
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
                    <div className="mt-auto flex items-center justify-between gap-3 pt-5">
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
              )) : !shouldShowHotDeals ? (
                <div className="rounded-md border border-dashed border-white/15 p-5 text-sm leading-6 text-zinc-400">
                  Choose a menu category or add a hot deal.
                </div>
              ) : null}
            </div>

            <aside className="hidden lg:block">
              <div className="rounded-lg border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/30 lg:sticky lg:top-24">
                <CartSummary
                  cartItems={cartItems}
                  totalItems={totalItems}
                  totalPrice={totalPrice}
                  userRole={userRole}
                  onDecrease={(item) => updateCartItemQuantity(item, item.quantity - 1)}
                  onIncrease={(item) => updateCartItemQuantity(item, item.quantity + 1)}
                  onRemove={(item) => removeCartItem(item)}
                  onCheckout={goToCheckout}
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
                {totalItems} items / {formatPrice(totalPrice)}
              </p>
              {!userRole ? (
                <p className="mt-1 text-xs font-semibold text-zinc-400">
                  Sign in to place your order.
                </p>
              ) : null}
            </div>
            <button
              onClick={goToCheckout}
              className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-4 py-3 text-sm font-black text-zinc-950"
            >
              {userRole ? "Checkout" : "Sign In"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function ComboOfferCard({
  comboOffer,
  quantity,
  onDecrease,
  onIncrease,
  onAdd,
}: {
  comboOffer: ComboOfferView;
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onAdd: () => void;
}) {
  const imageUrl =
    comboOffer.imageUrl ||
    "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=1200&q=90";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-zinc-950 shadow-xl shadow-black/25 transition duration-300 hover:-translate-y-2 hover:border-rose-400/40">
      <div className="relative h-56 overflow-hidden">
        <Image
          src={imageUrl}
          alt={comboOffer.name}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-110"
        />
        <span className="absolute left-4 top-4 rounded-md bg-zinc-950/80 px-3 py-1 text-xs font-black text-amber-200 backdrop-blur">
          Hot Deal
        </span>
        <span className="absolute right-4 top-4 rounded-md bg-rose-500/90 px-3 py-1 text-xs font-black text-white backdrop-blur">
          -{comboOffer.discountPercent}%
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-black text-white">{comboOffer.name}</h2>
          <div className="shrink-0 rounded-md bg-emerald-400/15 px-3 py-1 text-right">
            <p className="text-xs font-bold text-zinc-400 line-through">
              {formatPrice(comboOffer.originalPrice)}
            </p>
            <p className="text-sm font-black text-emerald-200">
              {formatPrice(comboOffer.finalPrice)}
            </p>
          </div>
        </div>
        <p className="mt-3 min-h-16 text-sm leading-6 text-zinc-300">{comboOffer.description}</p>
        <ul className="mt-4 grid gap-1 text-sm font-semibold text-zinc-300">
          {comboOffer.products.map((product) => (
            <li key={product.id}>- {product.name} x{product.quantity}</li>
          ))}
        </ul>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <div className="grid grid-cols-3 overflow-hidden rounded-md border border-white/10">
            <button
              onClick={onDecrease}
              className="grid size-11 place-items-center text-zinc-200 transition hover:bg-white/10"
              aria-label={`Decrease ${comboOffer.name} quantity`}
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <span className="grid size-11 place-items-center bg-white/5 text-sm font-black text-white">
              {quantity}
            </span>
            <button
              onClick={onIncrease}
              className="grid size-11 place-items-center text-zinc-200 transition hover:bg-white/10"
              aria-label={`Increase ${comboOffer.name} quantity`}
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-rose-500 px-4 py-3 text-sm font-black text-white transition hover:bg-rose-400"
          >
            <ShoppingCart className="size-4" aria-hidden="true" />
            Add
          </button>
        </div>
      </div>
    </article>
  );
}

function getCategoryIdByName(categories: MenuCategory[], categoryName?: string) {
  if (!categoryName) {
    return "all";
  }

  const normalizedCategoryName = categoryName.trim().toLowerCase();
  const matchingCategory = categories.find(
    (category) => category.name.trim().toLowerCase() === normalizedCategoryName,
  );

  return matchingCategory?.id ?? "all";
}

function getInitialActiveCategoryId(
  categories: MenuCategory[],
  categoryName?: string,
  sectionName?: string,
) {
  const normalizedSectionName = sectionName?.trim().toLowerCase();

  if (normalizedSectionName === "hot-deals" || normalizedSectionName === "combo-deals") {
    return "hotDeals";
  }

  return getCategoryIdByName(categories, categoryName);
}

function CartSummary({
  cartItems,
  totalItems,
  totalPrice,
  userRole,
  onDecrease,
  onIncrease,
  onRemove,
  onCheckout,
}: {
  cartItems: WebCartItem[];
  totalItems: number;
  totalPrice: number;
  userRole: "user" | "staff" | "manager" | null;
  onDecrease: (item: WebCartItem) => void;
  onIncrease: (item: WebCartItem) => void;
  onRemove: (item: WebCartItem) => void;
  onCheckout: () => void;
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
              key={getWebCartItemKey(item)}
              className="grid gap-3 rounded-md bg-white/[0.04] p-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-white">{getWebCartItemName(item)}</p>
                  {item.type === "combo" ? (
                    <p className="mt-1 text-xs font-black uppercase text-amber-200">Hot Deal</p>
                  ) : null}
                  <p className="mt-1 text-xs text-zinc-400">Qty {item.quantity}</p>
                  {item.type === "combo" ? (
                    <ul className="mt-2 grid gap-1 text-xs font-semibold text-zinc-400">
                      {item.includedProducts.map((product) => (
                        <li key={product.id}>- {product.name} x{product.quantity}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <p className="text-sm font-black text-emerald-200">
                  {formatPrice(getWebCartItemPrice(item) * item.quantity)}
                </p>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="grid grid-cols-3 overflow-hidden rounded-md border border-white/10">
                  <button
                    type="button"
                    onClick={() => onDecrease(item)}
                    className="grid size-9 place-items-center text-zinc-200 transition hover:bg-white/10"
                    aria-label={`Decrease ${getWebCartItemName(item)} quantity`}
                  >
                    <Minus className="size-4" aria-hidden="true" />
                  </button>
                  <span className="grid size-9 place-items-center bg-white/5 text-sm font-black text-white">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onIncrease(item)}
                    className="grid size-9 place-items-center text-zinc-200 transition hover:bg-white/10"
                    aria-label={`Increase ${getWebCartItemName(item)} quantity`}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(item)}
                  className="rounded-md px-3 py-2 text-xs font-black text-rose-200 transition hover:bg-rose-500/10"
                >
                  Remove
                </button>
              </div>
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
        {!userRole ? (
          <>
            <p className="mt-5 text-sm font-semibold text-zinc-400">
              Sign in to place your order.
            </p>
            <Link
              href="/login?next=/checkout"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-amber-400 px-5 py-4 text-sm font-black text-zinc-950 transition hover:bg-amber-300"
            >
              Sign In <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </>
        ) : (
          <button
            onClick={onCheckout}
            disabled={!cartItems.length}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-amber-400 px-5 py-4 text-sm font-black text-zinc-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Go to Checkout <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
