"use client";

import { CheckCircle2, Play } from "lucide-react";
import { useFormStatus } from "react-dom";

type StaffActionIcon = "play" | "check-circle";

const icons = {
  play: Play,
  "check-circle": CheckCircle2,
};

export function StaffActionButton({
  idleLabel,
  pendingLabel,
  icon,
}: {
  idleLabel: string;
  pendingLabel: string;
  icon: StaffActionIcon;
}) {
  const { pending } = useFormStatus();
  const Icon = icons[icon];

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
