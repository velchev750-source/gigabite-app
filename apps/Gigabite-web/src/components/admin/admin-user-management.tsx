"use client";

import { useActionState } from "react";
import { BriefcaseBusiness, MapPin, Phone, UserPlus, UsersRound } from "lucide-react";

import {
  createStaffByManagerAction,
  createUserByManagerAction,
  type AdminFormState,
} from "@/app/admin/actions";

type ManagedUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  defaultDeliveryAddress: string | null;
  workLocation: string | null;
  role: "user" | "staff" | "manager";
};

const initialState: AdminFormState = {
  message: "",
  ok: false,
};

export function AdminUserManagement({ users }: { users: ManagedUser[] }) {
  const [userState, userAction, isCreatingUser] = useActionState(
    createUserByManagerAction,
    initialState,
  );
  const [staffState, staffAction, isCreatingStaff] = useActionState(
    createStaffByManagerAction,
    initialState,
  );

  return (
    <section className="rounded-lg border border-white/10 bg-zinc-900 p-5 shadow-2xl shadow-black/25 sm:p-6">
      <div className="mb-6 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-amber-300">
            User management
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">Accounts</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Create customer and staff accounts without exposing role controls to the browser.
          </p>
        </div>
        <span className="w-fit rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-zinc-300">
          {users.length} accounts
        </span>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <AccountCreateForm
          title="Create User"
          submitLabel={isCreatingUser ? "Creating user" : "Create User"}
          action={userAction}
          state={userState}
          fields="user"
          disabled={isCreatingUser}
        />
        <AccountCreateForm
          title="Create Staff"
          submitLabel={isCreatingStaff ? "Creating staff" : "Create Staff"}
          action={staffAction}
          state={staffState}
          fields="staff"
          disabled={isCreatingStaff}
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
        <div className="grid grid-cols-[1fr_110px] bg-white/5 px-4 py-3 text-xs font-black uppercase text-zinc-400 md:grid-cols-[1fr_180px_160px_1fr_1fr]">
          <span>Account</span>
          <span>Role</span>
          <span className="hidden md:block">Phone</span>
          <span className="hidden md:block">Default address</span>
          <span className="hidden md:block">Work location</span>
        </div>
        {users.map((user) => (
          <article
            key={user.id}
            className="grid grid-cols-[1fr_110px] gap-3 border-t border-white/10 px-4 py-4 text-sm md:grid-cols-[1fr_180px_160px_1fr_1fr]"
          >
            <div>
              <p className="font-black text-white">{user.name}</p>
              <p className="mt-1 break-words text-xs text-zinc-500">{user.email}</p>
            </div>
            <span className="h-fit w-fit rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs font-black capitalize text-zinc-200">
              {user.role}
            </span>
            <p className="hidden text-zinc-300 md:block">{user.phone ?? "Not added"}</p>
            <p className="hidden text-zinc-300 md:block">
              {user.defaultDeliveryAddress ?? "Not set"}
            </p>
            <p className="hidden text-zinc-300 md:block">
              {user.workLocation ?? "Not set"}
            </p>
          </article>
        ))}
      </div>
    </section>
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
        <h3 className="text-xl font-black text-white">{title}</h3>
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

      {state.message ? (
        <p
          className={`mt-4 rounded-md border px-4 py-3 text-sm font-semibold ${
            state.ok
              ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
              : "border-rose-300/30 bg-rose-400/10 text-rose-100"
          }`}
        >
          {state.message}
        </p>
      ) : null}

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

function Input({
  label,
  name,
  type = "text",
  autoComplete,
  placeholder,
  required = true,
  icon,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete: string;
  placeholder: string;
  required?: boolean;
  icon?: "phone" | "address" | "work";
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
          className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-zinc-500"
        />
      </span>
    </label>
  );
}
