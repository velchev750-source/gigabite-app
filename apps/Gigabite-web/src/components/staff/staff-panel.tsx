"use client";

import {
  CheckCircle2,
  ChefHat,
  Clock3,
  Flame,
  ReceiptText,
  UserRound,
} from "lucide-react";
import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  completeOrderAction,
  startPreparationAction,
  type StaffActionState,
} from "@/app/staff/actions";
import type { AuthUser } from "@/services/auth";
import type {
  getStaffOrdersByStatus,
  getStaffStats,
  StaffOrderStatus,
} from "@/services/staff-orders";

type StaffStats = Awaited<ReturnType<typeof getStaffStats>>;
type StaffOrdersPage = Awaited<ReturnType<typeof getStaffOrdersByStatus>>;
type StaffOrder = StaffOrdersPage["orders"][number];

const statusLabels: Record<StaffOrderStatus, string> = {
  approved: "Approved",
  in_progress: "In progress",
  completed: "Completed",
};

const statusClasses: Record<StaffOrderStatus, string> = {
  approved: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
  in_progress: "border-sky-300/30 bg-sky-400/10 text-sky-100",
  completed: "border-zinc-300/20 bg-white/10 text-zinc-100",
};

const tabs = [
  {
    status: "approved",
    label: "Approved Orders",
    description: "Approved orders waiting to be prepared",
    emptyText: "No approved orders are waiting right now.",
    icon: ReceiptText,
    action: "start",
  },
  {
    status: "in_progress",
    label: "In Progress",
    description: "Orders currently being prepared",
    emptyText: "No orders are currently in progress.",
    icon: Flame,
    action: "complete",
  },
  {
    status: "completed",
    label: "Completed Today",
    description: "Finished orders from today",
    emptyText: "Completed orders from today will appear here.",
    icon: CheckCircle2,
    action: "none",
  },
] as const;

const initialActionState: StaffActionState = {
  ok: false,
  message: null,
};

function getStatValue(stats: StaffStats, status: StaffOrderStatus) {
  if (status === "approved") {
    return stats.approved;
  }

  if (status === "in_progress") {
    return stats.inProgress;
  }

  return stats.completedToday;
}

function formatMoney(value: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));
}

function formatStaffDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function StaffStatusBadge({ status }: { status: StaffOrderStatus }) {
  return (
    <span
      className={`inline-flex rounded-md border px-3 py-1 text-xs font-black ${statusClasses[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

async function fetchStaffStats() {
  const response = await fetch("/api/staff/stats", {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error("Unable to refresh staff stats.");
  }

  return (await response.json()) as StaffStats;
}

async function fetchStaffOrders(status: StaffOrderStatus, page: number) {
  const params = new URLSearchParams({
    status,
    page: String(page),
  });
  const response = await fetch(`/api/staff/orders?${params.toString()}`, {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error("Unable to refresh staff orders.");
  }

  return (await response.json()) as StaffOrdersPage;
}

export function StaffPanel({
  user,
  stats,
  initialOrdersPage,
}: {
  user: AuthUser;
  stats: StaffStats;
  initialOrdersPage: StaffOrdersPage;
}) {
  const [activeStatus, setActiveStatus] = useState<StaffOrderStatus>("approved");
  const [statsState, setStatsState] = useState(stats);
  const [pages, setPages] = useState<Partial<Record<StaffOrderStatus, StaffOrdersPage>>>({
    approved: initialOrdersPage,
  });
  const [pageByStatus, setPageByStatus] = useState<Record<StaffOrderStatus, number>>({
    approved: 1,
    in_progress: 1,
    completed: 1,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.status === activeStatus) ?? tabs[0],
    [activeStatus],
  );
  const activePage = pages[activeStatus];

  const refreshActiveData = useCallback(
    async (status = activeStatus, page = pageByStatus[status]) => {
      setIsRefreshing(true);
      setError(null);

      try {
        const [nextStats, nextOrdersPage] = await Promise.all([
          fetchStaffStats(),
          fetchStaffOrders(status, page),
        ]);

        setStatsState(nextStats);
        setPages((current) => ({
          ...current,
          [status]: nextOrdersPage,
        }));
        setPageByStatus((current) => ({
          ...current,
          [status]: nextOrdersPage.page,
        }));
      } catch (refreshError) {
        setError(
          refreshError instanceof Error
            ? refreshError.message
            : "Unable to refresh staff workflow.",
        );
      } finally {
        setIsRefreshing(false);
      }
    },
    [activeStatus, pageByStatus],
  );

  useEffect(() => {
    const refreshInterval = window.setInterval(() => {
      void refreshActiveData(activeStatus, pageByStatus[activeStatus]);
    }, 10000);

    return () => window.clearInterval(refreshInterval);
  }, [activeStatus, pageByStatus, refreshActiveData]);

  function selectTab(status: StaffOrderStatus) {
    setActiveStatus(status);

    if (!pages[status]) {
      void refreshActiveData(status, pageByStatus[status]);
    }
  }

  function goToPage(page: number) {
    setPageByStatus((current) => ({
      ...current,
      [activeStatus]: page,
    }));
    void refreshActiveData(activeStatus, page);
  }

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

        <section className="grid gap-4 md:grid-cols-3" aria-label="Staff order tabs">
          {tabs.map((tab) => (
            <StatTab
              key={tab.status}
              icon={tab.icon}
              label={tab.label}
              value={getStatValue(statsState, tab.status)}
              isActive={activeStatus === tab.status}
              onClick={() => selectTab(tab.status)}
            />
          ))}
        </section>

        <section className="mt-8 rounded-lg border border-white/10 bg-zinc-900 p-5 shadow-2xl shadow-black/25 sm:p-6">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-black text-white">{activeTab.label}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {activeTab.description}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isRefreshing ? (
                <span className="rounded-md border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-black text-amber-100">
                  Refreshing
                </span>
              ) : null}
              <span className="w-fit rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-zinc-300">
                {activePage?.totalCount ?? getStatValue(statsState, activeStatus)} orders
              </span>
            </div>
          </div>

          {error ? (
            <div className="mb-5 rounded-md border border-rose-300/20 bg-rose-400/10 p-4 text-sm font-semibold text-rose-100">
              {error}
            </div>
          ) : null}

          {activePage ? (
            <OrderPanel
              orders={activePage.orders}
              emptyText={activeTab.emptyText}
              action={activeTab.action}
              page={activePage.page}
              totalPages={activePage.totalPages}
              onPageChange={goToPage}
              onOrderUpdated={() => refreshActiveData(activeStatus, pageByStatus[activeStatus])}
            />
          ) : (
            <div className="rounded-md border border-dashed border-white/15 p-5 text-sm leading-6 text-zinc-400">
              Loading orders...
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatTab({
  icon: Icon,
  label,
  value,
  isActive,
  onClick,
}: {
  icon: typeof ReceiptText;
  label: string;
  value: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-6 text-left shadow-2xl shadow-black/25 transition hover:-translate-y-0.5 ${
        isActive
          ? "border-amber-300 bg-amber-400 text-zinc-950"
          : "border-white/10 bg-zinc-900 text-white hover:border-amber-300/50"
      }`}
      aria-pressed={isActive}
    >
      <div className="flex items-center justify-between gap-4">
        <span
          className={`grid size-12 place-items-center rounded-lg ${
            isActive ? "bg-zinc-950 text-amber-300" : "bg-white/10 text-amber-200"
          }`}
        >
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <p className={`text-4xl font-black ${isActive ? "text-zinc-950" : "text-white"}`}>
          {value}
        </p>
      </div>
      <p
        className={`mt-5 text-sm font-semibold uppercase ${
          isActive ? "text-zinc-900" : "text-zinc-400"
        }`}
      >
        {label}
      </p>
    </button>
  );
}

function OrderPanel({
  orders,
  emptyText,
  action,
  page,
  totalPages,
  onPageChange,
  onOrderUpdated,
}: {
  orders: StaffOrder[];
  emptyText: string;
  action: "start" | "complete" | "none";
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onOrderUpdated: () => void;
}) {
  return (
    <>
      {orders.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {orders.map((order) => (
            <StaffOrderCard
              key={order.id}
              order={order}
              action={action}
              onOrderUpdated={onOrderUpdated}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-white/15 p-5 text-sm leading-6 text-zinc-400">
          {emptyText}
        </div>
      )}

      <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-5 sm:flex-row">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-full rounded-md border border-white/10 px-4 py-3 text-sm font-black text-white transition hover:border-amber-300/50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Previous
        </button>
        <p className="text-sm font-semibold text-zinc-300">
          Page {page} of {totalPages}
        </p>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-full rounded-md border border-white/10 px-4 py-3 text-sm font-black text-white transition hover:border-amber-300/50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Next
        </button>
      </div>
    </>
  );
}

function StaffOrderCard({
  order,
  action,
  onOrderUpdated,
}: {
  order: StaffOrder;
  action: "start" | "complete" | "none";
  onOrderUpdated: () => void;
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-zinc-950 p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold uppercase text-zinc-500">Order</p>
          <h3 className="mt-1 text-2xl font-black text-white">#{order.id}</h3>
        </div>
        <StaffStatusBadge status={order.status as StaffOrderStatus} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Meta label="Customer" value={order.user.name} />
        <Meta label="Phone" value={order.user.phone ?? "Not added"} />
        <Meta label="Delivery type" value={order.deliveryType} />
        <Meta label="Created" value={formatStaffDate(new Date(order.createdAt))} />
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
          <StaffActionForm
            action={startPreparationAction}
            orderId={order.id}
            icon="play"
            idleLabel="Start Preparation"
            pendingLabel="Starting"
            onSuccess={onOrderUpdated}
          />
        ) : null}
        {action === "complete" ? (
          <StaffActionForm
            action={completeOrderAction}
            orderId={order.id}
            icon="check-circle"
            idleLabel="Mark as Completed"
            pendingLabel="Completing"
            onSuccess={onOrderUpdated}
          />
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

function StaffActionForm({
  action,
  orderId,
  idleLabel,
  pendingLabel,
  icon,
  onSuccess,
}: {
  action: (
    previousState: StaffActionState,
    formData: FormData,
  ) => Promise<StaffActionState>;
  orderId: number;
  idleLabel: string;
  pendingLabel: string;
  icon: "play" | "check-circle";
  onSuccess: () => void;
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  const hasHandledSuccess = useRef(false);

  useEffect(() => {
    if (state.ok && !hasHandledSuccess.current) {
      hasHandledSuccess.current = true;
      onSuccess();
    }
  }, [onSuccess, state.ok]);

  return (
    <form action={formAction}>
      <input type="hidden" name="orderId" value={orderId} />
      <StaffActionSubmit icon={icon} idleLabel={idleLabel} pendingLabel={pendingLabel} />
      {state.message ? (
        <p className="mt-3 text-sm font-semibold text-emerald-200">{state.message}</p>
      ) : null}
    </form>
  );
}

function StaffActionSubmit({
  idleLabel,
  pendingLabel,
  icon,
}: {
  idleLabel: string;
  pendingLabel: string;
  icon: "play" | "check-circle";
}) {
  const { pending } = useFormStatus();
  const Icon = icon === "play" ? Flame : CheckCircle2;

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-amber-400 px-4 py-3 text-sm font-black text-zinc-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      <Icon className="size-4" aria-hidden="true" />
      {pending ? pendingLabel : idleLabel}
    </button>
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
