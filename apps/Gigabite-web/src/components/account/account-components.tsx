import Link from "next/link";
import { ArrowRight, Ban, Clock3, ReceiptText, UserRound } from "lucide-react";

import { requestCancellationAction } from "@/app/account/actions";
import type { AuthUser } from "@/services/auth";
import {
  CANCELLABLE_ORDER_STATUSES,
  type OrderStatus,
} from "@/services/orders";
import type { Order, OrderItem } from "@/db/schema";

type OrderWithItems = Order & {
  items: OrderItem[];
};

const statusLabels: Record<OrderStatus, string> = {
  pending_approval: "Pending approval",
  approved: "Approved",
  in_progress: "In progress",
  completed: "Completed",
  cancel_requested: "Cancel requested",
  cancelled: "Cancelled",
};

const statusClasses: Record<OrderStatus, string> = {
  pending_approval: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  approved: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
  in_progress: "border-sky-300/30 bg-sky-400/10 text-sky-100",
  completed: "border-zinc-300/20 bg-white/10 text-zinc-100",
  cancel_requested: "border-orange-300/30 bg-orange-400/10 text-orange-100",
  cancelled: "border-rose-300/30 bg-rose-400/10 text-rose-100",
};

export function formatMoney(value: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));
}

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex rounded-md border px-3 py-1 text-xs font-black ${statusClasses[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

export function AccountSummary({ user }: { user: AuthUser }) {
  return (
    <section className="rounded-lg border border-white/10 bg-zinc-900 p-6 shadow-2xl shadow-black/25">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-lg bg-amber-400 text-zinc-950">
          <UserRound className="size-6" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase text-amber-300">
            Account
          </p>
          <h2 className="text-2xl font-black text-white">Your details</h2>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <AccountField label="Name" value={user.name} />
        <AccountField label="Email" value={user.email} />
        <AccountField label="Phone" value={user.phone ?? "Not added"} />
        <AccountField
          label="Default delivery address"
          value={user.defaultDeliveryAddress ?? "Not added"}
        />
      </div>
    </section>
  );
}

export function ActiveOrderCard({ order }: { order: Order | null }) {
  if (!order) {
    return (
      <section className="rounded-lg border border-dashed border-white/15 bg-zinc-900 p-6">
        <h2 className="text-2xl font-black text-white">Current active order</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          No active order right now. Your next meal can always be started from the menu.
        </p>
        <Link
          href="/menu"
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-amber-400 px-4 py-3 text-sm font-black text-zinc-950"
        >
          Browse menu <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-white/10 bg-zinc-900 p-6 shadow-2xl shadow-black/25">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold uppercase text-amber-300">
            Current active order
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">Order #{order.id}</h2>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <OrderMetaGrid order={order} />
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/account/orders/${order.id}`}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-black text-zinc-950 transition hover:bg-amber-300"
        >
          View details <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <CancelRequestForm order={order} />
      </div>
    </section>
  );
}

export function OrderHistory({ orders }: { orders: Order[] }) {
  return (
    <section className="rounded-lg border border-white/10 bg-zinc-900 p-6 shadow-2xl shadow-black/25">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-lg bg-emerald-400/15 text-emerald-200">
          <ReceiptText className="size-6" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase text-emerald-300">
            History
          </p>
          <h2 className="text-2xl font-black text-white">Your orders</h2>
        </div>
      </div>
      <div className="grid gap-3">
        {orders.length ? (
          orders.map((order) => (
            <article
              key={order.id}
              className="grid gap-4 rounded-md border border-white/10 bg-white/[0.04] p-4 lg:grid-cols-[90px_1fr_1fr_1fr_auto]"
            >
              <p className="text-sm font-black text-white">#{order.id}</p>
              <StatusBadge status={order.status} />
              <p className="text-sm font-black text-emerald-200">
                {formatMoney(order.totalPrice)}
              </p>
              <div>
                <p className="text-sm font-semibold capitalize text-zinc-200">
                  {order.deliveryType}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {formatDate(order.createdAt)}
                </p>
              </div>
              <Link
                href={`/account/orders/${order.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 px-4 py-2 text-sm font-bold text-zinc-100 transition hover:border-amber-300/60 hover:text-amber-200"
              >
                View Details
              </Link>
            </article>
          ))
        ) : (
          <p className="rounded-md border border-dashed border-white/15 p-5 text-sm leading-6 text-zinc-400">
            Your order history will appear here after checkout.
          </p>
        )}
      </div>
    </section>
  );
}

export function OrderDetails({ order }: { order: OrderWithItems }) {
  return (
    <section className="rounded-lg border border-white/10 bg-zinc-900 p-6 shadow-2xl shadow-black/25">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold uppercase text-amber-300">
            Order details
          </p>
          <h1 className="mt-2 text-4xl font-black text-white">Order #{order.id}</h1>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <OrderMetaGrid order={order} />
      <div className="mt-8 overflow-hidden rounded-lg border border-white/10">
        <div className="grid grid-cols-[1fr_80px_110px_110px] bg-white/5 px-4 py-3 text-xs font-black uppercase text-zinc-400">
          <span>Product</span>
          <span>Qty</span>
          <span>Unit</span>
          <span>Total</span>
        </div>
        {order.items.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[1fr_80px_110px_110px] border-t border-white/10 px-4 py-4 text-sm"
          >
            <span className="font-black text-white">{item.productName}</span>
            <span className="text-zinc-300">{item.quantity}</span>
            <span className="text-zinc-300">{formatMoney(item.unitPrice)}</span>
            <span className="font-black text-emerald-200">
              {formatMoney(item.lineTotal)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Note label="Customer note" value={order.customerNote} />
        <Note label="Manager note" value={order.managerNote} />
      </div>
      <div className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
        <p className="text-3xl font-black text-white">
          {formatMoney(order.totalPrice)}
        </p>
        <CancelRequestForm order={order} />
      </div>
    </section>
  );
}

function AccountField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/[0.04] p-4">
      <p className="text-xs font-semibold uppercase text-zinc-500">{label}</p>
      <p className="mt-2 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function OrderMetaGrid({ order }: { order: Order }) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <AccountField label="Total" value={formatMoney(order.totalPrice)} />
      <AccountField label="Delivery type" value={order.deliveryType} />
      <AccountField label="Created" value={formatDate(order.createdAt)} />
      {order.deliveryType === "delivery" ? (
        <AccountField
          label="Delivery address"
          value={order.deliveryAddress ?? "Not provided"}
        />
      ) : (
        <AccountField label="Pickup" value="Restaurant counter" />
      )}
    </div>
  );
}

function CancelRequestForm({ order }: { order: Order }) {
  const canCancel = CANCELLABLE_ORDER_STATUSES.includes(
    order.status as (typeof CANCELLABLE_ORDER_STATUSES)[number],
  );

  if (!canCancel) {
    return (
      <span className="inline-flex items-center gap-2 rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-zinc-400">
        <Clock3 className="size-4" aria-hidden="true" />
        Cancellation unavailable
      </span>
    );
  }

  return (
    <form action={requestCancellationAction}>
      <input type="hidden" name="orderId" value={order.id} />
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-md border border-rose-300/40 bg-rose-400/10 px-4 py-3 text-sm font-black text-rose-100 transition hover:bg-rose-400/20"
      >
        <Ban className="size-4" aria-hidden="true" />
        Request cancellation
      </button>
    </form>
  );
}

function Note({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-md bg-white/[0.04] p-4">
      <p className="text-xs font-semibold uppercase text-zinc-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-200">{value || "None"}</p>
    </div>
  );
}
