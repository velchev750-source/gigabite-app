"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, MapPin, Minus, Plus, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  clearWebCart,
  getWebCartItemKey,
  getWebCartItemName,
  getWebCartItemPrice,
  loadWebCart,
  saveWebCart,
  updateWebCartQuantity,
  type WebCart,
  type WebCartItem,
} from "@/lib/web-cart";

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export function CheckoutPage({
  prefilledDeliveryAddress,
}: {
  prefilledDeliveryAddress: string;
}) {
  const router = useRouter();
  const [cart, setCart] = useState<WebCart>({});
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState(prefilledDeliveryAddress);
  const [customerNote, setCustomerNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setCart(loadWebCart());
      setIsCartLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!isCartLoaded) {
      return;
    }

    saveWebCart(cart);
  }, [cart, isCartLoaded]);

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const totalPrice = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + getWebCartItemPrice(item) * item.quantity,
        0,
      ),
    [cartItems],
  );

  function updateCartItemQuantity(item: WebCartItem, quantity: number) {
    setCart((current) => updateWebCartQuantity(current, getWebCartItemKey(item), quantity));
  }

  function removeCartItem(item: WebCartItem) {
    setCart((current) => updateWebCartQuantity(current, getWebCartItemKey(item), 0));
  }

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!cartItems.length) {
      setMessage("Add something from the menu before checkout.");
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deliveryType,
          deliveryAddress,
          customerNote,
          items: cartItems
            .filter((item) => item.type !== "combo")
            .map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
            })),
          combos: cartItems
            .filter((item) => item.type === "combo")
            .map((item) => ({
              comboOfferId: item.comboOfferId,
              quantity: item.quantity,
            })),
        }),
      });
      const result = (await response.json()) as { message?: string; orderId?: number };

      if (!response.ok) {
        setMessage(result.message ?? "Order creation failed.");
        return;
      }

      if (!result.orderId) {
        setMessage("Order was created, but the confirmation page could not be opened.");
        return;
      }

      clearWebCart();
      router.push(`/checkout/success?orderId=${result.orderId}`);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main className="bg-zinc-950 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 text-sm font-bold text-amber-200 transition hover:text-amber-100"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to menu
        </Link>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <form
            onSubmit={submitOrder}
            className="rounded-lg border border-white/10 bg-zinc-900 p-6 shadow-2xl shadow-black/30"
          >
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase text-amber-300">
                Checkout
              </p>
              <h1 className="mt-3 text-4xl font-black text-white">
                Confirm your order
              </h1>
            </div>

            <div className="grid gap-5">
              <div>
                <label className="text-sm font-bold text-zinc-200">
                  Delivery type
                </label>
                <div className="mt-3 grid grid-cols-2 overflow-hidden rounded-md border border-white/10">
                  {(["pickup", "delivery"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDeliveryType(type)}
                      className={`px-4 py-3 text-sm font-black capitalize transition ${
                        deliveryType === type
                          ? "bg-amber-400 text-zinc-950"
                          : "bg-white/5 text-zinc-200 hover:bg-white/10"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {deliveryType === "delivery" ? (
                <label className="grid gap-2 text-sm font-bold text-zinc-200">
                  Delivery address
                  <span className="relative">
                    <MapPin className="absolute left-3 top-3 size-5 text-amber-300" />
                    <input
                      value={deliveryAddress}
                      onChange={(event) => setDeliveryAddress(event.target.value)}
                      className="w-full rounded-md border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white outline-none transition placeholder:text-zinc-500 focus:border-amber-300/70"
                      placeholder="Street, building, apartment"
                      required
                    />
                  </span>
                </label>
              ) : null}

              <label className="grid gap-2 text-sm font-bold text-zinc-200">
                Customer note
                <textarea
                  value={customerNote}
                  onChange={(event) => setCustomerNote(event.target.value)}
                  className="min-h-28 rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-amber-300/70"
                  placeholder="Optional kitchen or delivery note"
                />
              </label>
            </div>

            {message ? (
              <p className="mt-5 rounded-md border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-100">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isPending || !cartItems.length}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-md bg-amber-400 px-6 py-4 text-sm font-black text-zinc-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Creating order" : "Place order"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </form>

          <aside className="rounded-lg border border-white/10 bg-zinc-900 p-6 shadow-2xl shadow-black/30">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-lg bg-amber-400 text-zinc-950">
                <ShoppingBag className="size-6" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl font-black text-white">Order summary</h2>
                <p className="text-sm text-zinc-400">{cartItems.length} items</p>
              </div>
            </div>
            <div className="grid gap-3">
              {cartItems.length ? (
                cartItems.map((item) => (
                  <CheckoutSummaryItem
                    key={getWebCartItemKey(item)}
                    item={item}
                    onDecrease={() => updateCartItemQuantity(item, item.quantity - 1)}
                    onIncrease={() => updateCartItemQuantity(item, item.quantity + 1)}
                    onRemove={() => removeCartItem(item)}
                  />
                ))
              ) : (
                <div className="rounded-md border border-dashed border-white/15 p-5 text-sm leading-6 text-zinc-400">
                  <p>Your cart is empty.</p>
                  <Link
                    href="/menu#cart"
                    className="mt-3 inline-flex font-black text-amber-300 transition hover:text-amber-200"
                  >
                    Return to menu
                  </Link>
                </div>
              )}
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
              <span className="text-sm font-semibold text-zinc-300">Total</span>
              <span className="text-2xl font-black text-white">
                {formatPrice(totalPrice)}
              </span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function CheckoutSummaryItem({
  item,
  onDecrease,
  onIncrease,
  onRemove,
}: {
  item: WebCartItem;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-md bg-white/[0.04] p-3">
      <div className="flex justify-between gap-4">
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
            onClick={onDecrease}
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
            onClick={onIncrease}
            className="grid size-9 place-items-center text-zinc-200 transition hover:bg-white/10"
            aria-label={`Increase ${getWebCartItemName(item)} quantity`}
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md px-3 py-2 text-xs font-black text-rose-200 transition hover:bg-rose-500/10"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
