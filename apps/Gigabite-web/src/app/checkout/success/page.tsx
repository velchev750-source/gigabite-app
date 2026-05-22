import Link from "next/link";
import { CheckCircle2, ShoppingBag, Utensils } from "lucide-react";

import { Footer, Header } from "@/components/home/home-page";
import { orderIdSchema } from "@/lib/validations/orders";
import { getCurrentUser } from "@/services/auth";
import { getOrderDetailsForAuthenticatedCustomer } from "@/services/orders";

export const dynamic = "force-dynamic";

type ConfirmationState =
  | {
      isLoaded: true;
      orderId: number;
      deliveryType: "pickup" | "delivery";
    }
  | {
      isLoaded: false;
    };

export default async function CheckoutSuccessRoute({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const confirmation = await getConfirmationState(searchParams);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />
      <main className="bg-zinc-950 px-4 py-16 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl">
          <div className="rounded-lg border border-white/10 bg-zinc-900 p-6 text-center shadow-2xl shadow-black/30 sm:p-10">
            <div className="mx-auto grid size-16 place-items-center rounded-lg bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20">
              {confirmation.isLoaded ? (
                <CheckCircle2 className="size-9" aria-hidden="true" />
              ) : (
                <ShoppingBag className="size-9" aria-hidden="true" />
              )}
            </div>

            <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-amber-300">
              Checkout
            </p>
            <h1 className="mt-3 text-4xl font-black text-white sm:text-5xl">
              {confirmation.isLoaded ? "Order accepted" : "Confirmation unavailable"}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg">
              {confirmation.isLoaded
                ? getConfirmationMessage(confirmation.deliveryType)
                : "We could not load this order confirmation."}
            </p>

            {confirmation.isLoaded ? (
              <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-zinc-200">
                <Utensils className="size-4 text-amber-300" aria-hidden="true" />
                Order #{confirmation.orderId}
              </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/account"
                className="inline-flex items-center justify-center rounded-md bg-amber-400 px-6 py-3 text-sm font-black text-zinc-950 transition hover:bg-amber-300"
              >
                View My Orders
              </Link>
              <Link
                href="/menu"
                className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-6 py-3 text-sm font-black text-zinc-100 transition hover:bg-white/10"
              >
                Back to Menu
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

async function getConfirmationState(
  searchParamsPromise: Promise<{ orderId?: string }>,
): Promise<ConfirmationState> {
  const [{ orderId }, user] = await Promise.all([searchParamsPromise, getCurrentUser()]);
  const parsedOrderId = orderIdSchema.safeParse(orderId);

  if (!user || user.role !== "user" || !parsedOrderId.success) {
    return { isLoaded: false };
  }

  const order = await getOrderDetailsForAuthenticatedCustomer(user, parsedOrderId.data);

  if (!order) {
    return { isLoaded: false };
  }

  return {
    isLoaded: true,
    orderId: order.id,
    deliveryType: order.deliveryType,
  };
}

function getConfirmationMessage(deliveryType: "pickup" | "delivery") {
  if (deliveryType === "delivery") {
    return "Your order has been accepted. Your order will be on its way soon.";
  }

  return "Your order has been accepted. Your order will be waiting for you at our place.";
}
