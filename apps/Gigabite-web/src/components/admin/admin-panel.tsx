import {
  BadgeDollarSign,
  Ban,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FilePenLine,
  ReceiptText,
  UserRound,
  WalletCards,
} from "lucide-react";

import {
  approveCancellationAction,
  approveOrderAction,
  cancelOrderAction,
  updateCustomerNoteAction,
  updateDeliveryAddressAction,
  updateManagerNoteAction,
} from "@/app/admin/actions";
import {
  formatDate,
  formatMoney,
  StatusBadge,
} from "@/components/account/account-components";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { AdminUserManagement } from "@/components/admin/admin-user-management";
import type { AuthUser } from "@/services/auth";
import type { getManagerMetrics, getManagerOrders } from "@/services/manager-orders";
import type { getManageableUsers } from "@/services/manager-users";

type ManagerOrders = Awaited<ReturnType<typeof getManagerOrders>>;
type ManagerMetrics = Awaited<ReturnType<typeof getManagerMetrics>>;
type ManagerOrder = ManagerOrders[keyof ManagerOrders][number];
type ManagedUsers = Awaited<ReturnType<typeof getManageableUsers>>;

export function AdminPanel({
  user,
  metrics,
  orders,
  users,
}: {
  user: AuthUser;
  metrics: ManagerMetrics;
  orders: ManagerOrders;
  users: ManagedUsers;
}) {
  return (
    <main className="bg-zinc-950 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase text-amber-300">
              Operations control
            </p>
            <h1 className="mt-3 text-5xl font-black text-white">Manager Panel</h1>
            <p className="mt-4 text-lg leading-8 text-zinc-300">
              Manage Gigabite orders and sales without stepping into staff preparation.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-zinc-900 px-5 py-4 shadow-xl shadow-black/20">
            <span className="grid size-11 place-items-center rounded-lg bg-amber-400 text-zinc-950">
              <UserRound className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase text-zinc-500">
                Signed in manager
              </p>
              <p className="mt-1 text-sm font-black text-white">{user.name}</p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            icon={BadgeDollarSign}
            label="Sales today"
            value={formatMoney(metrics.salesToday)}
            tone="emerald"
          />
          <MetricCard
            icon={WalletCards}
            label="Sales this week"
            value={formatMoney(metrics.salesThisWeek)}
            tone="amber"
          />
          <MetricCard
            icon={ReceiptText}
            label="Sales this month"
            value={formatMoney(metrics.salesThisMonth)}
            tone="sky"
          />
          <MetricCard
            icon={CheckCircle2}
            label="Completed today"
            value={String(metrics.completedOrdersToday)}
            tone="emerald"
          />
          <MetricCard
            icon={ClipboardCheck}
            label="Pending approval"
            value={String(metrics.pendingApprovalCount)}
            tone="amber"
          />
          <MetricCard
            icon={Ban}
            label="Cancellation requests"
            value={String(metrics.cancellationRequestsCount)}
            tone="rose"
          />
        </section>

        <div className="mt-8 grid gap-6">
          <AdminUserManagement users={users} />
          <OrderSection
            title="Pending Approval"
            subtitle="New orders waiting for manager review"
            orders={orders.pendingApproval}
            emptyText="No orders are waiting for approval."
            mode="pending"
          />
          <OrderSection
            title="Cancellation Requests"
            subtitle="Customer requests that need manager approval"
            orders={orders.cancellationRequests}
            emptyText="No cancellation requests right now."
            mode="cancel-request"
          />
          <OrderSection
            title="Active Orders"
            subtitle="Approved and in-progress orders for visibility"
            orders={orders.activeOrders}
            emptyText="No active orders right now."
            mode="active"
          />
          <OrderSection
            title="Completed"
            subtitle="Completed order history and sales source"
            orders={orders.completed}
            emptyText="Completed orders will appear here."
            mode="readonly"
          />
          <OrderSection
            title="Cancelled"
            subtitle="Cancelled order history"
            orders={orders.cancelled}
            emptyText="Cancelled orders will appear here."
            mode="readonly"
          />
        </div>
      </div>
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof ReceiptText;
  label: string;
  value: string;
  tone: "amber" | "sky" | "emerald" | "rose";
}) {
  const toneClasses = {
    amber: "bg-amber-400 text-zinc-950",
    sky: "bg-sky-400/15 text-sky-200",
    emerald: "bg-emerald-400/15 text-emerald-200",
    rose: "bg-rose-400/15 text-rose-100",
  };

  return (
    <article className="rounded-lg border border-white/10 bg-zinc-900 p-6 shadow-2xl shadow-black/25">
      <div className="flex items-center justify-between gap-4">
        <span className={`grid size-12 place-items-center rounded-lg ${toneClasses[tone]}`}>
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <p className="text-3xl font-black text-white">{value}</p>
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
  mode,
}: {
  title: string;
  subtitle: string;
  orders: ManagerOrder[];
  emptyText: string;
  mode: "pending" | "cancel-request" | "active" | "readonly";
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
        <div className="grid gap-4">
          {orders.map((order) => (
            <ManagerOrderCard key={order.id} order={order} mode={mode} />
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

function ManagerOrderCard({
  order,
  mode,
}: {
  order: ManagerOrder;
  mode: "pending" | "cancel-request" | "active" | "readonly";
}) {
  const canEdit = ["pending_approval", "approved", "cancel_requested"].includes(order.status);
  const canCancel = order.status === "pending_approval" || order.status === "approved";

  return (
    <article className="rounded-lg border border-white/10 bg-zinc-950 p-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase text-zinc-500">Order</p>
          <h3 className="mt-1 text-2xl font-black text-white">#{order.id}</h3>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Meta label="Customer" value={order.user.name} />
        <Meta label="Email" value={order.user.email} />
        <Meta label="Phone" value={order.user.phone ?? "Not added"} />
        <Meta label="Delivery type" value={order.deliveryType} />
        <Meta label="Created" value={formatDate(order.createdAt)} />
        <Meta label="Total" value={formatMoney(order.totalPrice)} />
        {order.deliveryType === "delivery" ? (
          <Meta label="Delivery address" value={order.deliveryAddress ?? "Not provided"} />
        ) : (
          <Meta label="Pickup" value="Restaurant counter" />
        )}
        {order.cancelRequestedAt ? (
          <Meta label="Cancel requested" value={formatDate(order.cancelRequestedAt)} />
        ) : null}
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-white/10">
        <div className="grid grid-cols-[1fr_70px_100px_100px] bg-white/5 px-4 py-3 text-xs font-black uppercase text-zinc-400">
          <span>Product</span>
          <span>Qty</span>
          <span>Unit</span>
          <span>Total</span>
        </div>
        {order.items.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[1fr_70px_100px_100px] border-t border-white/10 px-4 py-3 text-sm"
          >
            <span className="font-semibold text-white">{item.productName}</span>
            <span className="text-zinc-300">{item.quantity}</span>
            <span className="text-zinc-300">{formatMoney(item.unitPrice)}</span>
            <span className="font-black text-emerald-200">
              {formatMoney(item.lineTotal)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Note label="Customer note" value={order.customerNote} />
        <Note label="Manager note" value={order.managerNote} />
      </div>

      {canEdit ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          <EditTextForm
            action={updateManagerNoteAction}
            orderId={order.id}
            fieldName="managerNote"
            label="Manager note"
            defaultValue={order.managerNote ?? ""}
            buttonLabel="Save note"
          />
          <EditTextForm
            action={updateCustomerNoteAction}
            orderId={order.id}
            fieldName="customerNote"
            label="Customer note"
            defaultValue={order.customerNote ?? ""}
            buttonLabel="Save customer note"
          />
          {order.deliveryType === "delivery" ? (
            <EditTextForm
              action={updateDeliveryAddressAction}
              orderId={order.id}
              fieldName="deliveryAddress"
              label="Delivery address"
              defaultValue={order.deliveryAddress ?? ""}
              buttonLabel="Save address"
            />
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {mode === "pending" ? (
          <form action={approveOrderAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <AdminActionButton
              icon="shield-check"
              idleLabel="Confirm Order"
              pendingLabel="Approving"
            />
          </form>
        ) : null}

        {mode === "cancel-request" ? (
          <ManagerDecisionForm
            action={approveCancellationAction}
            orderId={order.id}
            defaultNote={order.managerNote ?? ""}
            buttonLabel="Approve Cancellation"
            pendingLabel="Cancelling"
            confirmMessage={`Approve cancellation for order #${order.id}?`}
          />
        ) : null}

        {canCancel ? (
          <ManagerDecisionForm
            action={cancelOrderAction}
            orderId={order.id}
            defaultNote={order.managerNote ?? ""}
            buttonLabel="Cancel Order"
            pendingLabel="Cancelling"
            confirmMessage={`Cancel order #${order.id}?`}
          />
        ) : null}

        {!canCancel && mode !== "pending" && mode !== "cancel-request" ? (
          <span className="inline-flex items-center gap-2 rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-zinc-400">
            <Clock3 className="size-4" aria-hidden="true" />
            Read-only
          </span>
        ) : null}
      </div>
    </article>
  );
}

function ManagerDecisionForm({
  action,
  orderId,
  defaultNote,
  buttonLabel,
  pendingLabel,
  confirmMessage,
}: {
  action: (formData: FormData) => void | Promise<void>;
  orderId: number;
  defaultNote: string;
  buttonLabel: string;
  pendingLabel: string;
  confirmMessage: string;
}) {
  return (
    <form action={action} className="grid gap-3 rounded-md bg-white/[0.04] p-4 sm:min-w-72">
      <input type="hidden" name="orderId" value={orderId} />
      <label className="grid gap-2">
        <span className="text-xs font-black uppercase text-zinc-400">Manager note</span>
        <textarea
          name="managerNote"
          defaultValue={defaultNote}
          className="min-h-20 rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-500 focus:border-amber-300/70"
          placeholder="Optional reason or internal note"
        />
      </label>
      <AdminActionButton
        icon="ban"
        idleLabel={buttonLabel}
        pendingLabel={pendingLabel}
        variant="danger"
        confirmMessage={confirmMessage}
      />
    </form>
  );
}

function EditTextForm({
  action,
  orderId,
  fieldName,
  label,
  defaultValue,
  buttonLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  orderId: number;
  fieldName: string;
  label: string;
  defaultValue: string;
  buttonLabel: string;
}) {
  return (
    <form action={action} className="rounded-md bg-white/[0.04] p-4">
      <input type="hidden" name="orderId" value={orderId} />
      <label className="grid gap-2">
        <span className="text-xs font-black uppercase text-zinc-400">{label}</span>
        <textarea
          name={fieldName}
          defaultValue={defaultValue}
          className="min-h-24 rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-500 focus:border-amber-300/70"
        />
      </label>
      <button
        type="submit"
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-black text-zinc-100 transition hover:border-amber-300/60 hover:text-amber-200"
      >
        <FilePenLine className="size-4" aria-hidden="true" />
        {buttonLabel}
      </button>
    </form>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/[0.04] p-3">
      <p className="text-xs font-semibold uppercase text-zinc-500">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-white">{value}</p>
    </div>
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
