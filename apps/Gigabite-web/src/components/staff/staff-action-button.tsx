"use client";

import { useFormStatus } from "react-dom";
import type { LucideIcon } from "lucide-react";

export function StaffActionButton({
  idleLabel,
  pendingLabel,
  icon: Icon,
}: {
  idleLabel: string;
  pendingLabel: string;
  icon: LucideIcon;
}) {
  const { pending } = useFormStatus();

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
