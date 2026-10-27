"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({
  idleLabel,
  pendingLabel,
  className,
}: {
  idleLabel: string;
  pendingLabel: string;
  className: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      aria-disabled={pending}
      className={className + " disabled:cursor-wait disabled:opacity-60"}>
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          {pendingLabel}
        </span>
      ) : idleLabel}
    </button>
  );
}
