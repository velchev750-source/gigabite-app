"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, MapPin, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const CART_STORAGE_KEY = "gigabite_cart";

type StoredCartItem = {
  product: {
    id: number;
    name: string;
    price: number;
  };
  quantity: number;
};

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
  const [cartItems, setCartItems] = useState<StoredCartItem[]>([]);
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState(prefilledDeliveryAddress);
  const [customerNote, setCustomerNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!savedCart) {
      return;
    }

    try {
      const parsedCart = JSON.parse(savedCart) as Record<string, StoredCartItem>;
      queueMicrotask(() => setCartItems(Object.values(parsedCart)));
    } catch {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, []);

  const totalPrice = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0,
      ),
    [cartItems],
  );

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
          items: cartItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setMessage(result.message ?? "Order creation failed.");
        return;
      }

      window.localStorage.removeItem(CART_STORAGE_KEY);
      router.push("/account");
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
                  <div
                    key={item.product.id}
                    className="flex justify-between gap-4 rounded-md bg-white/[0.04] p-3"
                  >
                    <div>
                      <p className="text-sm font-black text-white">
                        {item.product.name}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        Qty {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-black text-emerald-200">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-md border border-dashed border-white/15 p-5 text-sm leading-6 text-zinc-400">
                  Your cart is empty.
                </p>
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
