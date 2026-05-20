"use client";

import { useState, useTransition } from "react";
import {
  publishFloorAction,
  unpublishFloorAction,
} from "@/lib/actions/floors";

export function PublishToggle({
  floorId,
  status,
}: {
  floorId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isPublished = status === "published";

  function onClick() {
    setError(null);
    const fd = new FormData();
    fd.set("floorId", floorId);
    startTransition(async () => {
      const fn = isPublished ? unpublishFloorAction : publishFloorAction;
      const result = await fn(fd);
      if (!result.ok) setError(result.error ?? "Failed");
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={onClick}
        disabled={pending}
        className={
          isPublished
            ? "rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
            : "rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        }
      >
        {pending
          ? "Working…"
          : isPublished
          ? "Unpublish floor"
          : "Publish floor"}
      </button>
      {error && (
        <span className="text-xs text-amber-700 dark:text-amber-300">
          {error}
        </span>
      )}
    </div>
  );
}
