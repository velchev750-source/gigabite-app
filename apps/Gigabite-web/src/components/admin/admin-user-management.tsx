"use client";

import { BriefcaseBusiness, MapPin, Phone, Save, UserPlus, UsersRound } from "lucide-react";
import { type FormEvent, useActionState, useEffect, useRef } from "react";

import {
  createStaffByManagerAction,
  createUserByManagerAction,
  type AdminFormState,
  updateStaffByManagerAction,
} from "@/app/admin/actions";

export type StaffPage = {
  staff: Array<{
    id: number;
    name: string;
    email: string;
    phone: string | null;
    workLocation: string | null;
    role: "user" | "staff" | "manager";
  }>;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type ManagedStaff = StaffPage["staff"][number];

const initialState: AdminFormState = {
  message: "",
  ok: false,
};

export function CreateUserPanel() {
  const [userState, userAction, isCreatingUser] = useActionState(
    createUserByManagerAction,
    initialState,
  );

  return (
    <AccountCreateForm
      title="Create User"
      submitLabel={isCreatingUser ? "Creating user" : "Create User"}
      action={userAction}
      state={userState}
      fields="user"
      disabled={isCreatingUser}
    />
  );
}

export function CreateStaffPanel({ onStaffCreated }: { onStaffCreated: () => void }) {
  const [staffState, staffAction, isCreatingStaff] = useActionState(
    createStaffByManagerAction,
    initialState,
  );
  const handledMessage = useRef("");

  useEffect(() => {
    if (staffState.ok && staffState.message !== handledMessage.current) {
      handledMessage.current = staffState.message;
      onStaffCreated();
    }
  }, [onStaffCreated, staffState.message, staffState.ok]);

  return (
    <AccountCreateForm
      title="Create Staff"
      submitLabel={isCreatingStaff ? "Creating staff" : "Create Staff"}
      action={staffAction}
      state={staffState}
      fields="staff"
      disabled={isCreatingStaff}
    />
  );
}

export function EditStaffPanel({
  staffPage,
  isRefreshing,
  onPageChange,
  onStaffUpdated,
}: {
  staffPage?: StaffPage;
  isRefreshing: boolean;
  onPageChange: (page: number) => void;
  onStaffUpdated: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-6 flex shrink-0 flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-black text-white">Edit Staff</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Manage staff-only account basics. Password hashes and auth tokens are never exposed.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isRefreshing ? (
            <span className="rounded-md border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-black text-amber-100">
              Refreshing
            </span>
          ) : null}
          <span className="w-fit rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-zinc-300">
            {staffPage?.totalCount ?? 0} staff
          </span>
        </div>
      </div>

      {staffPage ? (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {staffPage.staff.length ? (
              <div className="grid gap-4">
              {staffPage.staff.map((staff) => (
                <StaffEditCard
                  key={staff.id}
                  staff={staff}
                  onStaffUpdated={onStaffUpdated}
                />
              ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-white/15 p-5 text-sm leading-6 text-zinc-400">
                Staff accounts will appear here.
              </div>
            )}
          </div>

          <Pagination
            page={staffPage.page}
            totalPages={staffPage.totalPages}
            onPageChange={onPageChange}
          />
        </>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="rounded-md border border-dashed border-white/15 p-5 text-sm leading-6 text-zinc-400">
            Loading staff...
          </div>
        </div>
      )}
    </div>
  );
}

function AccountCreateForm({
  title,
  submitLabel,
  action,
  state,
  fields,
  disabled,
}: {
  title: string;
  submitLabel: string;
  action: (formData: FormData) => void;
  state: AdminFormState;
  fields: "user" | "staff";
  disabled: boolean;
}) {
  return (
    <form action={action} className="rounded-lg border border-white/10 bg-zinc-950 p-5">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-lg bg-amber-400 text-zinc-950">
          <UserPlus className="size-5" aria-hidden="true" />
        </span>
        <h2 className="text-2xl font-black text-white">{title}</h2>
      </div>

      <div className="grid gap-4">
        <Input label="Name" name="name" autoComplete="name" placeholder="Alex Morgan" />
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="person@gigabite.demo"
        />
        <Input
          label="Phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+359 88 123 4567"
          required={false}
          icon="phone"
        />
        {fields === "user" ? (
          <Input
            label="Default delivery address"
            name="defaultDeliveryAddress"
            autoComplete="street-address"
            placeholder="24 Flavor Street, Sofia"
            required={false}
            icon="address"
          />
        ) : (
          <Input
            label="Work location"
            name="workLocation"
            autoComplete="organization"
            placeholder="Gigabite Center"
            icon="work"
          />
        )}
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 6 characters"
        />
        <Input
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat password"
        />
      </div>

      <FormMessage state={state} />

      <button
        type="submit"
        disabled={disabled}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-amber-400 px-4 py-3 text-sm font-black text-zinc-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <UsersRound className="size-4" aria-hidden="true" />
        {submitLabel}
      </button>
    </form>
  );
}

function StaffEditCard({
  staff,
  onStaffUpdated,
}: {
  staff: ManagedStaff;
  onStaffUpdated: () => void;
}) {
  const [state, formAction, isSaving] = useActionState(
    updateStaffByManagerAction,
    initialState,
  );
  const handledMessage = useRef("");

  useEffect(() => {
    if (state.ok && state.message !== handledMessage.current) {
      handledMessage.current = state.message;
      onStaffUpdated();
    }
  }, [onStaffUpdated, state.message, state.ok]);

  return (
    <form action={formAction} className="rounded-lg border border-white/10 bg-zinc-950 p-5">
      <input type="hidden" name="staffId" value={staff.id} />
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold uppercase text-zinc-500">Staff account</p>
          <h3 className="mt-1 text-xl font-black text-white">{staff.name}</h3>
          <p className="mt-1 text-sm text-zinc-500">{staff.email}</p>
        </div>
        <span className="h-fit w-fit rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs font-black capitalize text-zinc-200">
          {staff.role}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Input
          label="Name"
          name="name"
          autoComplete="name"
          placeholder="Alex Morgan"
          defaultValue={staff.name}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="staff@gigabite.demo"
          defaultValue={staff.email}
        />
        <Input
          label="Phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+359 88 123 4567"
          required={false}
          icon="phone"
          defaultValue={staff.phone ?? ""}
        />
        <Input
          label="Work location"
          name="workLocation"
          autoComplete="organization"
          placeholder="Gigabite Center"
          icon="work"
          defaultValue={staff.workLocation ?? ""}
        />
      </div>

      <FormMessage state={state} />

      <button
        type="submit"
        disabled={isSaving}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-amber-400 px-4 py-3 text-sm font-black text-zinc-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        <Save className="size-4" aria-hidden="true" />
        {isSaving ? "Saving" : "Save Staff"}
      </button>
    </form>
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

function FormMessage({ state }: { state: AdminFormState }) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      className={`mt-4 rounded-md border px-4 py-3 text-sm font-semibold ${
        state.ok
          ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
          : "border-rose-300/30 bg-rose-400/10 text-rose-100"
      }`}
    >
      {state.message}
    </p>
  );
}

function Input({
  label,
  name,
  type = "text",
  autoComplete,
  placeholder,
  required = true,
  icon,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete: string;
  placeholder: string;
  required?: boolean;
  icon?: "phone" | "address" | "work";
  defaultValue?: string;
}) {
  const Icon =
    icon === "phone" ? Phone : icon === "address" ? MapPin : icon === "work" ? BriefcaseBusiness : null;

  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-zinc-200">{label}</span>
      <span className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 transition focus-within:border-amber-300/70">
        {Icon ? <Icon className="size-5 shrink-0 text-amber-300" aria-hidden="true" /> : null}
        <input
          name={name}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={required}
          defaultValue={defaultValue}
          className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-zinc-500"
        />
      </span>
    </label>
  );
}
