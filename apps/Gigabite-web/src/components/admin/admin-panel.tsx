"use client";

import {
  Ban,
  CheckCircle2,
  ChefHat,
  ClipboardCheck,
  Clock3,
  FilePenLine,
  ReceiptText,
  ShieldCheck,
  UserCog,
  UserPlus,
  UserRound,
  UsersRound,
} from "lucide-react";
import {
  type FormEvent,
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";

import {
  approveCancellationAction,
  approveOrderAction,
  cancelOrderAction,
  type AdminFormState,
  updateCustomerNoteAction,
  updateDeliveryAddressAction,
  updateManagerNoteAction,
} from "@/app/admin/actions";
import {
  CreateStaffPanel,
  CreateUserPanel,
  EditStaffPanel,
  type StaffPage,
} from "@/components/admin/admin-user-management";

type AuthUser = {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  defaultDeliveryAddress: string | null;
  workLocation: string | null;
  role: "user" | "staff" | "manager";
};

type ManagerOrderTab =
  | "pendingApproval"
  | "cancellationRequests"
  | "activeOrders"
  | "completed"
  | "cancelled";

type ManagerMetrics = {
  salesToday: string;
  salesThisWeek: string;
  salesThisMonth: string;
  completedOrdersToday: number;
  pendingApprovalCount: number;
  cancellationRequestsCount: number;
  activeOrdersCount: number;
  completedOrdersCount: number;
  cancelledOrdersCount: number;
};

type ManagerOrdersPage = {
  orders: Array<{
    id: number;
    status:
      | "pending_approval"
      | "approved"
      | "in_progress"
      | "completed"
      | "cancel_requested"
      | "cancelled";
    deliveryType: "pickup" | "delivery";
    deliveryAddress: string | null;
    customerNote: string | null;
    managerNote: string | null;
    totalPrice: string;
    cancelRequestedAt: Date | string | null;
    createdAt: Date | string;
    user: {
      name: string;
      email: string;
      phone: string | null;
    };
    items: Array<{
      id: number;
      productName: string;
      quantity: number;
      unitPrice: string;
      lineTotal: string;
    }>;
  }>;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
type ManagerOrder = ManagerOrdersPage["orders"][number];
type ManagerPanelTab = ManagerOrderTab | "createUser" | "createStaff" | "editStaff";
type ManagerOrderStatus = ManagerOrder["status"];

const emptyActionState: AdminFormState = {
  message: "",
  ok: false,
};

const orderTabs = [
  "pendingApproval",
  "cancellationRequests",
  "activeOrders",
  "completed",
  "cancelled",
] as const satisfies readonly ManagerOrderTab[];

const statusLabels: Record<ManagerOrderStatus, string> = {
  pending_approval: "Pending approval",
  approved: "Approved",
  in_progress: "In progress",
  completed: "Completed",
  cancel_requested: "Cancel requested",
  cancelled: "Cancelled",
};

const statusClasses: Record<ManagerOrderStatus, string> = {
  pending_approval: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  approved: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
  in_progress: "border-sky-300/30 bg-sky-400/10 text-sky-100",
  completed: "border-zinc-300/20 bg-white/10 text-zinc-100",
  cancel_requested: "border-orange-300/30 bg-orange-400/10 text-orange-100",
  cancelled: "border-rose-300/30 bg-rose-400/10 text-rose-100",
};

const tabs = [
  {
    id: "pendingApproval",
    label: "Pending Approval",
    description: "New orders waiting for manager review",
    emptyText: "No orders are waiting for approval.",
    icon: ClipboardCheck,
    mode: "pending",
  },
  {
    id: "activeOrders",
    label: "Active Orders",
    description: "Approved and in-progress orders",
    emptyText: "No active orders right now.",
    icon: ChefHat,
    mode: "active",
  },
  {
    id: "cancellationRequests",
    label: "Cancellation Requests",
    description: "Customer cancellation requests needing review",
    emptyText: "No cancellation requests right now.",
    icon: Ban,
    mode: "cancel-request",
  },
  {
    id: "cancelled",
    label: "Canceled Orders",
    description: "Canceled order history",
    emptyText: "Canceled orders will appear here.",
    icon: ReceiptText,
    mode: "readonly",
  },
  {
    id: "completed",
    label: "Completed Orders",
    description: "Completed order history",
    emptyText: "Completed orders will appear here.",
    icon: CheckCircle2,
    mode: "readonly",
  },
  {
    id: "createStaff",
    label: "Create Staff",
    description: "Create staff accounts",
    icon: UsersRound,
  },
  {
    id: "editStaff",
    label: "Edit Staff",
    description: "Manage staff account basics",
    icon: UserCog,
  },
  {
    id: "createUser",
    label: "Create User",
    description: "Create customer accounts",
    icon: UserPlus,
  },
] as const;

export function AdminPanel({
  user,
  metrics,
  initialOrdersPage,
  initialStaffPage,
}: {
  user: AuthUser;
  metrics: ManagerMetrics;
  initialOrdersPage: ManagerOrdersPage;
  initialStaffPage: StaffPage;
}) {
  const [activeTab, setActiveTab] = useState<ManagerPanelTab>("pendingApproval");
  const [metricsState, setMetricsState] = useState(metrics);
  const [orderPages, setOrderPages] = useState<Partial<Record<ManagerOrderTab, ManagerOrdersPage>>>({
    pendingApproval: initialOrdersPage,
  });
  const [pageByOrderTab, setPageByOrderTab] = useState<Record<ManagerOrderTab, number>>({
    pendingApproval: 1,
    cancellationRequests: 1,
    activeOrders: 1,
    completed: 1,
    cancelled: 1,
  });
  const [staffPage, setStaffPage] = useState(initialStaffPage);
  const [staffPageNumber, setStaffPageNumber] = useState(initialStaffPage.page);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeConfig = useMemo(
    () => tabs.find((tab) => tab.id === activeTab) ?? tabs[0],
    [activeTab],
  );

  const refreshMetrics = useCallback(async () => {
    const response = await fetch("/api/admin/stats", {
      cache: "no-store",
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error("Unable to refresh manager counters.");
    }

    setMetricsState((await response.json()) as ManagerMetrics);
  }, []);

  const refreshOrderTab = useCallback(async (tab: ManagerOrderTab, page: number) => {
    const params = new URLSearchParams({ tab, page: String(page) });
    const response = await fetch(`/api/admin/orders?${params.toString()}`, {
      cache: "no-store",
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error("Unable to refresh manager orders.");
    }

    const nextPage = (await response.json()) as ManagerOrdersPage;
    setOrderPages((current) => ({ ...current, [tab]: nextPage }));
    setPageByOrderTab((current) => ({ ...current, [tab]: nextPage.page }));
  }, []);

  const refreshStaffPage = useCallback(async (page: number) => {
    const params = new URLSearchParams({ page: String(page) });
    const response = await fetch(`/api/admin/staff?${params.toString()}`, {
      cache: "no-store",
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error("Unable to refresh staff accounts.");
    }

    const nextPage = (await response.json()) as StaffPage;
    setStaffPage(nextPage);
    setStaffPageNumber(nextPage.page);
  }, []);

  const refreshActiveData = useCallback(
    async (tab: ManagerPanelTab = activeTab) => {
      setIsRefreshing(true);
      setError(null);

      try {
        await refreshMetrics();

        if (isOrderTab(tab)) {
          await refreshOrderTab(tab, pageByOrderTab[tab]);
        }

        if (tab === "editStaff") {
          await refreshStaffPage(staffPageNumber);
        }
      } catch (refreshError) {
        setError(
          refreshError instanceof Error
            ? refreshError.message
            : "Unable to refresh manager dashboard.",
        );
      } finally {
        setIsRefreshing(false);
      }
    },
    [activeTab, pageByOrderTab, refreshMetrics, refreshOrderTab, refreshStaffPage, staffPageNumber],
  );

  useEffect(() => {
    const refreshInterval = window.setInterval(() => {
      void refreshActiveData(activeTab);
    }, 10000);

    return () => window.clearInterval(refreshInterval);
  }, [activeTab, refreshActiveData]);

  function selectTab(tab: ManagerPanelTab) {
    setActiveTab(tab);

    if (isOrderTab(tab) && !orderPages[tab]) {
      void refreshOrderTab(tab, pageByOrderTab[tab]);
    }
  }

  function goToOrderPage(page: number) {
    if (!isOrderTab(activeTab)) {
      return;
    }

    setPageByOrderTab((current) => ({ ...current, [activeTab]: page }));
    void refreshOrderTab(activeTab, page);
  }

  function goToStaffPage(page: number) {
    setStaffPageNumber(page);
    void refreshStaffPage(page);
  }

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
              Manage Gigabite orders and staff operations from one active workflow.
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Manager tabs">
          {tabs.map((tab) => (
            <WorkflowTab
              key={tab.id}
              icon={tab.icon}
              label={tab.label}
              value={getTabCount(metricsState, tab.id)}
              isActive={activeTab === tab.id}
              onClick={() => selectTab(tab.id)}
            />
          ))}
        </section>

        <section className="mt-8 flex h-[1280px] max-h-[calc(100vh-3rem)] min-h-[960px] flex-col rounded-lg border border-white/10 bg-zinc-900 p-5 shadow-2xl shadow-black/25 sm:p-6">
          {error ? (
            <div className="mb-5 rounded-md border border-rose-300/20 bg-rose-400/10 p-4 text-sm font-semibold text-rose-100">
              {error}
            </div>
          ) : null}

          {isOrderTab(activeTab) ? (
            <OrderPanel
              title={activeConfig.label}
              subtitle={activeConfig.description}
              ordersPage={orderPages[activeTab]}
              emptyText={"emptyText" in activeConfig ? activeConfig.emptyText : ""}
              mode={"mode" in activeConfig ? activeConfig.mode : "readonly"}
              isRefreshing={isRefreshing}
              onPageChange={goToOrderPage}
              onOrderUpdated={() => refreshActiveData(activeTab)}
            />
          ) : null}

          {activeTab === "createUser" ? <CreateUserPanel /> : null}
          {activeTab === "createStaff" ? (
            <CreateStaffPanel onStaffCreated={() => refreshActiveData("createStaff")} />
          ) : null}
          {activeTab === "editStaff" ? (
            <EditStaffPanel
              staffPage={staffPage}
              isRefreshing={isRefreshing}
              onPageChange={goToStaffPage}
              onStaffUpdated={() => refreshActiveData("editStaff")}
            />
          ) : null}
        </section>
      </div>
    </main>
  );
}

function WorkflowTab({
  icon: Icon,
  label,
  value,
  isActive,
  onClick,
}: {
  icon: typeof ReceiptText;
  label: string;
  value: number | null;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-5 text-left shadow-2xl shadow-black/25 transition hover:-translate-y-0.5 ${
        isActive
          ? "border-amber-300 bg-amber-400 text-zinc-950"
          : "border-white/10 bg-zinc-900 text-white hover:border-amber-300/50"
      }`}
      aria-pressed={isActive}
    >
      <div className="flex items-center justify-between gap-4">
        <span
          className={`grid size-11 place-items-center rounded-lg ${
            isActive ? "bg-zinc-950 text-amber-300" : "bg-white/10 text-amber-200"
          }`}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {value === null ? null : (
          <p className={`text-3xl font-black ${isActive ? "text-zinc-950" : "text-white"}`}>
            {value}
          </p>
        )}
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
  title,
  subtitle,
  ordersPage,
  emptyText,
  mode,
  isRefreshing,
  onPageChange,
  onOrderUpdated,
}: {
  title: string;
  subtitle: string;
  ordersPage?: ManagerOrdersPage;
  emptyText: string;
  mode: "pending" | "cancel-request" | "active" | "readonly";
  isRefreshing: boolean;
  onPageChange: (page: number) => void;
  onOrderUpdated: () => void;
}) {
  const [activeEditor, setActiveEditor] = useState<string | null>(null);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-6 flex shrink-0 flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-black text-white">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isRefreshing ? (
            <span className="rounded-md border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-black text-amber-100">
              Refreshing
            </span>
          ) : null}
          <span className="w-fit rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-zinc-300">
            {ordersPage?.totalCount ?? 0} orders
          </span>
        </div>
      </div>

      {ordersPage ? (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {ordersPage.orders.length ? (
              <div className="grid gap-3">
                {ordersPage.orders.map((order) => (
                  <ManagerOrderCard
                    key={order.id}
                    order={order}
                    mode={mode}
                    activeEditor={activeEditor}
                    onEditorChange={setActiveEditor}
                    onOrderUpdated={onOrderUpdated}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-white/15 p-5 text-sm leading-6 text-zinc-400">
                {emptyText}
              </div>
            )}
          </div>

          <Pagination
            page={ordersPage.page}
            totalPages={ordersPage.totalPages}
            onPageChange={onPageChange}
          />
        </>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="rounded-md border border-dashed border-white/15 p-5 text-sm leading-6 text-zinc-400">
            Loading orders...
          </div>
        </div>
      )}
    </div>
  );
}

function ManagerOrderCard({
  order,
  mode,
  activeEditor,
  onEditorChange,
  onOrderUpdated,
}: {
  order: ManagerOrder;
  mode: "pending" | "cancel-request" | "active" | "readonly";
  activeEditor: string | null;
  onEditorChange: (editor: string | null) => void;
  onOrderUpdated: () => void;
}) {
  const canEdit = ["pending_approval", "approved", "cancel_requested"].includes(order.status);
  const canCancel = order.status === "pending_approval" || order.status === "approved";
  const location =
    order.deliveryType === "delivery"
      ? order.deliveryAddress ?? "Delivery address not provided"
      : "Restaurant counter";
  const itemsSummary = order.items
    .map((item) => `${item.productName} x${item.quantity}`)
    .join(" • ");
  const editorKey = (editor: string) => `${order.id}:${editor}`;
  const openEditor = (editor: string) => {
    const nextEditor = editorKey(editor);
    onEditorChange(activeEditor === nextEditor ? null : nextEditor);
  };
  const handleUpdated = () => {
    onEditorChange(null);
    onOrderUpdated();
  };

  return (
    <article className="rounded-lg border border-white/10 bg-zinc-950 p-5">
      <div className="grid gap-5 xl:grid-cols-[130px_minmax(0,1fr)_240px] xl:items-start">
        <div className="flex flex-wrap items-center gap-3 xl:block">
          <h3 className="text-2xl font-black text-white">#{order.id}</h3>
          <div className="xl:mt-2">
            <StatusBadge status={order.status} />
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <p className="text-xl font-black text-white">{order.user.name}</p>
            <p className="text-base font-semibold capitalize text-zinc-300">
              {order.deliveryType}
            </p>
            <p className="text-base text-zinc-500">{formatDate(order.createdAt)}</p>
            {order.cancelRequestedAt ? (
              <p className="text-base font-semibold text-orange-200">
                Cancel requested {formatDate(order.cancelRequestedAt)}
              </p>
            ) : null}
          </div>

          <div className="mt-3 grid gap-3 text-base text-zinc-300 xl:grid-cols-[180px_260px_minmax(0,1fr)]">
            <p>
              <span className="font-black uppercase text-zinc-500">Phone </span>
              {order.user.phone ?? "Not added"}
            </p>
            <p className="min-w-0 break-words">
              <span className="font-black uppercase text-zinc-500">Email </span>
              {order.user.email}
            </p>
            <p className="min-w-0 break-words">
              <span className="font-black uppercase text-zinc-500">
                {order.deliveryType === "delivery" ? "Address " : "Pickup "}
              </span>
              {location}
            </p>
          </div>

          <div className="mt-3 flex gap-2 rounded-md bg-white/[0.04] p-3 text-base">
            <ChefHat className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden="true" />
            <p className="min-w-0 break-words font-semibold text-white">{itemsSummary}</p>
          </div>

          <div className="mt-3 grid gap-2 lg:grid-cols-2">
            <Note label="Customer note" value={order.customerNote} />
            <Note label="Manager note" value={order.managerNote} />
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 xl:items-stretch">
          <p className="text-2xl font-black text-emerald-200">
            {formatMoney(order.totalPrice)}
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap xl:flex-col">
            {mode === "pending" ? (
              <OrderActionForm
                action={approveOrderAction}
                orderId={order.id}
                icon="shield-check"
                idleLabel="Confirm Order"
                pendingLabel="Approving"
                onSuccess={handleUpdated}
              />
            ) : null}

            {canEdit ? (
              <>
                <CompactButton label="Edit Manager Note" onClick={() => openEditor("managerNote")} />
                <CompactButton label="Edit Customer Note" onClick={() => openEditor("customerNote")} />
                {order.deliveryType === "delivery" ? (
                  <CompactButton label="Edit Address" onClick={() => openEditor("address")} />
                ) : null}
              </>
            ) : null}

            {mode === "cancel-request" ? (
              <CompactButton
                label="Approve Cancellation"
                tone="danger"
                onClick={() => openEditor("approveCancel")}
              />
            ) : null}

            {canCancel ? (
              <CompactButton
                label="Cancel Order"
                tone="danger"
                onClick={() => openEditor("cancelOrder")}
              />
            ) : null}

            {!canCancel && mode !== "pending" && mode !== "cancel-request" ? (
              <span className="inline-flex items-center gap-2 rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-zinc-400">
                <Clock3 className="size-4" aria-hidden="true" />
                Read-only
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {activeEditor === editorKey("managerNote") ? (
        <EditTextForm
          action={updateManagerNoteAction}
          orderId={order.id}
          fieldName="managerNote"
          label="Manager note"
          defaultValue={order.managerNote ?? ""}
          buttonLabel="Save note"
          onSuccess={handleUpdated}
        />
      ) : null}
      {activeEditor === editorKey("customerNote") ? (
        <EditTextForm
          action={updateCustomerNoteAction}
          orderId={order.id}
          fieldName="customerNote"
          label="Customer note"
          defaultValue={order.customerNote ?? ""}
          buttonLabel="Save customer note"
          onSuccess={handleUpdated}
        />
      ) : null}
      {activeEditor === editorKey("address") ? (
        <EditTextForm
          action={updateDeliveryAddressAction}
          orderId={order.id}
          fieldName="deliveryAddress"
          label="Delivery address"
          defaultValue={order.deliveryAddress ?? ""}
          buttonLabel="Save address"
          onSuccess={handleUpdated}
        />
      ) : null}
      {activeEditor === editorKey("approveCancel") ? (
        <ManagerDecisionForm
          action={approveCancellationAction}
          orderId={order.id}
          defaultNote={order.managerNote ?? ""}
          buttonLabel="Approve Cancellation"
          pendingLabel="Cancelling"
          confirmMessage={`Approve cancellation for order #${order.id}?`}
          onSuccess={handleUpdated}
        />
      ) : null}
      {activeEditor === editorKey("cancelOrder") ? (
        <ManagerDecisionForm
          action={cancelOrderAction}
          orderId={order.id}
          defaultNote={order.managerNote ?? ""}
          buttonLabel="Cancel Order"
          pendingLabel="Cancelling"
          confirmMessage={`Cancel order #${order.id}?`}
          onSuccess={handleUpdated}
        />
      ) : null}
    </article>
  );
}

function OrderActionForm({
  action,
  orderId,
  icon,
  idleLabel,
  pendingLabel,
  onSuccess,
}: {
  action: (previousState: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  orderId: number;
  icon: "shield-check";
  idleLabel: string;
  pendingLabel: string;
  onSuccess: () => void;
}) {
  const [state, formAction] = useActionState(action, emptyActionState);
  useActionSuccess(state, onSuccess);

  return (
    <form action={formAction}>
      <input type="hidden" name="orderId" value={orderId} />
      <SubmitButton icon={icon} idleLabel={idleLabel} pendingLabel={pendingLabel} />
      <ActionMessage state={state} />
    </form>
  );
}

function CompactButton({
  label,
  tone = "secondary",
  onClick,
}: {
  label: string;
  tone?: "secondary" | "danger";
  onClick: () => void;
}) {
  const classes = {
    secondary:
      "border-white/10 bg-white/5 text-zinc-100 hover:border-amber-300/60 hover:text-amber-200",
    danger:
      "border-rose-300/40 bg-rose-400/10 text-rose-100 hover:bg-rose-400/20",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex w-full items-center justify-center rounded-md border px-3 py-2.5 text-base font-black transition ${classes[tone]}`}
    >
      {label}
    </button>
  );
}

function ManagerDecisionForm({
  action,
  orderId,
  defaultNote,
  buttonLabel,
  pendingLabel,
  confirmMessage,
  onSuccess,
}: {
  action: (previousState: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  orderId: number;
  defaultNote: string;
  buttonLabel: string;
  pendingLabel: string;
  confirmMessage: string;
  onSuccess: () => void;
}) {
  const [state, formAction] = useActionState(action, emptyActionState);
  useActionSuccess(state, onSuccess);

  return (
    <form action={formAction} className="mt-4 grid gap-3 rounded-md bg-white/[0.04] p-4">
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
      <SubmitButton
        icon="ban"
        idleLabel={buttonLabel}
        pendingLabel={pendingLabel}
        variant="danger"
        confirmMessage={confirmMessage}
      />
      <ActionMessage state={state} />
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
  onSuccess,
}: {
  action: (previousState: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  orderId: number;
  fieldName: string;
  label: string;
  defaultValue: string;
  buttonLabel: string;
  onSuccess: () => void;
}) {
  const [state, formAction] = useActionState(action, emptyActionState);
  useActionSuccess(state, onSuccess);

  return (
    <form action={formAction} className="mt-4 rounded-md bg-white/[0.04] p-4">
      <input type="hidden" name="orderId" value={orderId} />
      <label className="grid gap-2">
        <span className="text-xs font-black uppercase text-zinc-400">{label}</span>
        <textarea
          name={fieldName}
          defaultValue={defaultValue}
          className="min-h-24 rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-500 focus:border-amber-300/70"
        />
      </label>
      <SubmitButton
        icon="file-pen"
        idleLabel={buttonLabel}
        pendingLabel="Saving"
        variant="secondary"
      />
      <ActionMessage state={state} />
    </form>
  );
}

function SubmitButton({
  idleLabel,
  pendingLabel,
  icon,
  variant = "primary",
  confirmMessage,
}: {
  idleLabel: string;
  pendingLabel: string;
  icon: "ban" | "shield-check" | "file-pen";
  variant?: "primary" | "danger" | "secondary";
  confirmMessage?: string;
}) {
  const { pending } = useFormStatus();
  const Icon =
    icon === "ban" ? Ban : icon === "shield-check" ? ShieldCheck : FilePenLine;
  const classes = {
    primary: "bg-amber-400 text-zinc-950 hover:bg-amber-300",
    danger:
      "border border-rose-300/40 bg-rose-400/10 text-rose-100 hover:bg-rose-400/20",
    secondary:
      "border border-white/10 bg-white/5 text-zinc-100 hover:border-amber-300/60 hover:text-amber-200",
  };

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-base font-black transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${classes[variant]}`}
    >
      <Icon className="size-4" aria-hidden="true" />
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  function submitPage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const pageField = event.currentTarget.elements.namedItem("page") as HTMLInputElement | null;
    const nextPage = Number(pageField?.value);

    if (!Number.isFinite(nextPage)) {
      if (pageField) {
        pageField.value = String(page);
      }
      return;
    }

    const clampedPage = Math.min(totalPages, Math.max(1, Math.trunc(nextPage)));

    if (pageField) {
      pageField.value = String(clampedPage);
    }

    if (clampedPage !== page) {
      onPageChange(clampedPage);
    }
  }

  return (
    <form
      onSubmit={submitPage}
      className="mt-6 flex shrink-0 flex-col items-center justify-between gap-3 border-t border-white/10 pt-5 sm:flex-row"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="w-full rounded-md border border-white/10 px-4 py-3 text-sm font-black text-white transition hover:border-amber-300/50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        Previous
      </button>

      <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
        <label className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
          <span>Page</span>
          <input
            key={page}
            name="page"
            type="number"
            min={1}
            max={totalPages}
            defaultValue={page}
            className="h-11 w-20 rounded-md border border-white/10 bg-zinc-950 px-3 text-center text-sm font-black text-white outline-none transition focus:border-amber-300/70"
            aria-label="Page number"
          />
          <span>of {totalPages}</span>
        </label>
        <button
          type="submit"
          className="w-full rounded-md bg-amber-400 px-4 py-3 text-sm font-black text-zinc-950 transition hover:bg-amber-300 sm:w-auto"
        >
          Go
        </button>
      </div>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="w-full rounded-md border border-white/10 px-4 py-3 text-sm font-black text-white transition hover:border-amber-300/50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        Next
      </button>
    </form>
  );
}

function ActionMessage({ state }: { state: AdminFormState }) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      className={`mt-3 text-sm font-semibold ${
        state.ok ? "text-emerald-200" : "text-rose-200"
      }`}
    >
      {state.message}
    </p>
  );
}

function useActionSuccess(state: AdminFormState, onSuccess: () => void) {
  const handledMessage = useRef("");

  useEffect(() => {
    if (state.ok && state.message !== handledMessage.current) {
      handledMessage.current = state.message;
      onSuccess();
    }
  }, [onSuccess, state.message, state.ok]);
}

function formatMoney(value: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: ManagerOrderStatus }) {
  return (
    <span
      className={`inline-flex rounded-md border px-3 py-1 text-xs font-black ${statusClasses[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

function Note({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-md bg-white/[0.04] px-3 py-2">
      <p className="text-xs font-semibold uppercase text-zinc-500">{label}</p>
      <p className="mt-1 break-words text-base leading-7 text-zinc-200">
        {value ? truncateText(value, 160) : "None"}
      </p>
    </div>
  );
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength).trim()}...` : value;
}

function isOrderTab(tab: ManagerPanelTab): tab is ManagerOrderTab {
  return orderTabs.some((orderTab) => orderTab === tab);
}

function getTabCount(metrics: ManagerMetrics, tab: ManagerPanelTab) {
  if (tab === "pendingApproval") {
    return metrics.pendingApprovalCount;
  }

  if (tab === "cancellationRequests") {
    return metrics.cancellationRequestsCount;
  }

  if (tab === "activeOrders") {
    return metrics.activeOrdersCount;
  }

  if (tab === "completed") {
    return metrics.completedOrdersCount;
  }

  if (tab === "cancelled") {
    return metrics.cancelledOrdersCount;
  }

  return null;
}
