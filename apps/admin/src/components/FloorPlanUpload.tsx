"use client";

import { useRef, useState, useTransition } from "react";
import {
  removeFloorPlanAction,
  uploadFloorPlanAction,
} from "@/lib/actions/floor-assets";

export function FloorPlanUpload({
  floorId,
  hasFloorPlan,
}: {
  floorId: string;
  hasFloorPlan: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.set("floorId", floorId);
    fd.set("file", file);
    startTransition(async () => {
      const r = await uploadFloorPlanAction(fd);
      if (!r.ok) setError(r.error ?? "Upload failed");
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function onRemove() {
    if (!confirm("Remove the current floor plan image?")) return;
    const fd = new FormData();
    fd.set("floorId", floorId);
    startTransition(async () => {
      await removeFloorPlanAction(fd);
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Floor plan image
          </div>
          <div className="text-[11px] text-slate-500">
            PNG/JPG/SVG/WEBP · max 20 MB · displayed behind the editor
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasFloorPlan && (
            <button
              type="button"
              onClick={onRemove}
              disabled={pending}
              className="text-xs text-red-600 hover:underline disabled:opacity-60"
            >
              Remove
            </button>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {pending
              ? "Uploading…"
              : hasFloorPlan
              ? "Replace"
              : "Upload floor plan"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={onSelect}
            className="hidden"
          />
        </div>
      </div>
      {error && (
        <div className="mt-2 text-xs text-amber-700 dark:text-amber-300">
          {error}
        </div>
      )}
    </div>
  );
}
