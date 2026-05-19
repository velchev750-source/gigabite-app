"use client";

import { useFormStatus } from "react-dom";
import type { LucideIcon } from "lucide-react";

export function AdminActionButton({
  idleLabel,
  pendingLabel,
  icon: Icon,
  variant = "primary",
  confirmMessage,
}: {
  idleLabel: string;
  pendingLabel: string;
  icon: LucideIcon;
  variant?: "primary" | "danger" | "secondary";
  confirmMessage?: string;
}) {
  const { pending } = useFormStatus();
  const classes = {
    primary:
      "bg-amber-400 text-zinc-950 hover:bg-amber-300",
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
      className={`inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${classes[variant]}`}
    >
      <Icon className="size-4" aria-hidden="true" />
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
