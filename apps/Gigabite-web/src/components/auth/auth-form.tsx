"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, LockKeyhole, Mail, MapPin, Phone, UserRound } from "lucide-react";

type AuthMode = "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Something went wrong.");
        return;
      }

      router.push(data.redirectTo || "/account");
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {isRegister ? (
        <>
          <Field
            icon={UserRound}
            label="Name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Alex Morgan"
          />
          <Field
            icon={Phone}
            label="Phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+359 88 123 4567"
            required={false}
          />
          <Field
            icon={MapPin}
            label="Delivery address"
            name="deliveryAddress"
            type="text"
            autoComplete="street-address"
            placeholder="24 Flavor Street, Sofia"
            required={false}
          />
        </>
      ) : null}
      <Field
        icon={Mail}
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@gigabite.test"
      />
      <Field
        icon={LockKeyhole}
        label="Password"
        name="password"
        type="password"
        autoComplete={isRegister ? "new-password" : "current-password"}
        placeholder="Enter your password"
      />
      {isRegister ? (
        <Field
          icon={LockKeyhole}
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
        />
      ) : null}

      {error ? (
        <div className="rounded-md border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100">
          {error}
        </div>
      ) : null}

      <button
        disabled={isPending}
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-amber-400 px-6 py-4 text-base font-black text-zinc-950 shadow-xl shadow-amber-500/20 transition hover:-translate-y-1 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Please wait" : isRegister ? "Create Account" : "Login"}
        <ArrowRight className="size-5" aria-hidden="true" />
      </button>

      <p className="text-center text-sm text-zinc-400">
        {isRegister ? "Already have an account?" : "New to Gigabite?"}{" "}
        <Link
          href={isRegister ? "/login" : "/register"}
          className="font-black text-amber-300 transition hover:text-amber-200"
        >
          {isRegister ? "Login" : "Register"}
        </Link>
      </p>
    </form>
  );
}

function Field({
  icon: Icon,
  label,
  name,
  type,
  autoComplete,
  placeholder,
  required = true,
}: {
  icon: typeof Mail;
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-zinc-200">{label}</span>
      <span className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 text-zinc-200 transition focus-within:border-amber-300/70 focus-within:bg-white/[0.07]">
        <Icon className="size-5 shrink-0 text-amber-300" aria-hidden="true" />
        <input
          required={required}
          name={name}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-zinc-500"
        />
      </span>
    </label>
  );
}
