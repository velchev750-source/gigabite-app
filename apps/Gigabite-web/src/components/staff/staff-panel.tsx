import { CheckCircle2, ChefHat, Clock3, Flame, ReceiptText, UserRound } from "lucide-react";

import {
  completeOrderAction,
  startPreparationAction,
} from "@/app/staff/actions";
import {
  formatDate,
  formatMoney,
  StatusBadge,
} from "@/components/account/account-components";
import { StaffActionButton } from "@/components/staff/staff-action-button";
import type { AuthUser } from "@/services/auth";
import type { getStaffOrders, getStaffStats } from "@/services/staff-orders";

type StaffOrders = Awaited<ReturnType<typeof getStaffOrders>>;
type StaffStats = Awaited<ReturnType<typeof getStaffStats>>;
type StaffOrder = StaffOrders[keyof StaffOrders][number];

export function StaffPanel({
  user,
  stats,
  orders,
}: {
  user: AuthUser;
  stats: StaffStats;
  orders: StaffOrders;
}) {
  return (
    <main className="bg-zinc-950 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase text-amber-300">
              Kitchen workflow
            </p>
            <h1 className="mt-3 text-5xl font-black text-white">Staff Panel</h1>
            <p className="mt-4 text-lg leading-8 text-zinc-300">
              Manage approved Gigabite orders from preparation to completion.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-zinc-900 px-5 py-4 shadow-xl shadow-black/20">
            <span className="grid size-11 place-items-center rounded-lg bg-amber-400 text-zinc-950">
              <UserRound className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase text-zinc-500">
                Signed in staff
              </p>
              <p className="mt-1 text-sm font-black text-white">{user.name}</p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            icon={ReceiptText}
            label="Approved orders"
            value={stats.approved}
            tone="amber"
          />
          <StatCard
            icon={Flame}
            label="In progress"
            value={stats.inProgress}
            tone="sky"
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed today"
            value={stats.completedToday}
            tone="emerald"
          />
        </section>

        <div className="mt-8 grid gap-6">
          <OrderSection
            title="Waiting"
            subtitle="Approved orders waiting to be prepared"
            orders={orders.waiting}
            emptyText="No approved orders are waiting right now."
            action="start"
          />
          <OrderSection
            title="In Progress"
            subtitle="Orders currently being prepared"
            orders={orders.inProgress}
            emptyText="No orders are currently in progress."
            action="complete"
          />
          <OrderSection
            title="Completed"
            subtitle="Finished orders for staff reference"
            orders={orders.completed}
            emptyText="Completed orders will appear here."
            action="none"
          />
        </div>
      </div>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof ReceiptText;
  label: string;
  value: number;
  tone: "amber" | "sky" | "emerald";
}) {
  const toneClasses = {
    amber: "bg-amber-400 text-zinc-950",
    sky: "bg-sky-400/15 text-sky-200",
    emerald: "bg-emerald-400/15 text-emerald-200",
  };

  return (
    <article className="rounded-lg border border-white/10 bg-zinc-900 p-6 shadow-2xl shadow-black/25">
      <div className="flex items-center justify-between gap-4">
        <span className={`grid size-12 place-items-center rounded-lg ${toneClasses[tone]}`}>
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <p className="text-4xl font-black text-white">{value}</p>
      </div>
      <p className="mt-5 text-sm font-semibold uppercase text-zinc-400">{label}</p>
    </article>
  );
}

function OrderSection({
  title,
  subtitle,
  orders,
  emptyText,
  action,
}: {
  title: string;
  subtitle: string;
  orders: StaffOrder[];
  emptyText: string;
  action: "start" | "complete" | "none";
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-zinc-900 p-5 shadow-2xl shadow-black/25 sm:p-6">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-black text-white">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">{subtitle}</p>
        </div>
        <span className="w-fit rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-zinc-300">
          {orders.length} orders
        </span>
      </div>

      {orders.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {orders.map((order) => (
            <StaffOrderCard key={order.id} order={order} action={action} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-white/15 p-5 text-sm leading-6 text-zinc-400">
          {emptyText}
        </div>
      )}
    </section>
  );
}

function StaffOrderCard({
  order,
  action,
}: {
  order: StaffOrder;
  action: "start" | "complete" | "none";
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-zinc-950 p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold uppercase text-zinc-500">Order</p>
          <h3 className="mt-1 text-2xl font-black text-white">#{order.id}</h3>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Meta label="Customer" value={order.user.name} />
        <Meta label="Phone" value={order.user.phone ?? "Not added"} />
        <Meta label="Delivery type" value={order.deliveryType} />
        <Meta label="Created" value={formatDate(order.createdAt)} />
        <Meta label="Total" value={formatMoney(order.totalPrice)} />
        {order.deliveryType === "delivery" ? (
          <Meta label="Delivery address" value={order.deliveryAddress ?? "Not provided"} />
        ) : (
          <Meta label="Pickup" value="Restaurant counter" />
        )}
      </div>

      <div className="mt-5 rounded-md bg-white/[0.04] p-4">
        <div className="mb-3 flex items-center gap-2">
          <ChefHat className="size-4 text-amber-300" aria-hidden="true" />
          <p className="text-xs font-black uppercase text-zinc-400">Items</p>
        </div>
        <div className="grid gap-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-3 text-sm">
              <span className="font-semibold text-white">{item.productName}</span>
              <span className="font-black text-emerald-200">x{item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      {order.customerNote ? (
        <div className="mt-4 rounded-md border border-amber-300/20 bg-amber-300/10 p-4">
          <p className="text-xs font-black uppercase text-amber-200">Customer note</p>
          <p className="mt-2 text-sm leading-6 text-amber-50">{order.customerNote}</p>
        </div>
      ) : null}

      <div className="mt-5">
        {action === "start" ? (
          <form action={startPreparationAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <StaffActionButton
              icon="play"
              idleLabel="Start Preparation"
              pendingLabel="Starting"
            />
          </form>
        ) : null}
        {action === "complete" ? (
          <form action={completeOrderAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <StaffActionButton
              icon="check-circle"
              idleLabel="Mark as Completed"
              pendingLabel="Completing"
            />
          </form>
        ) : null}
        {action === "none" ? (
          <span className="inline-flex items-center gap-2 rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-zinc-400">
            <Clock3 className="size-4" aria-hidden="true" />
            Read-only
          </span>
        ) : null}
      </div>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/[0.04] p-3">
      <p className="text-xs font-semibold uppercase text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}
