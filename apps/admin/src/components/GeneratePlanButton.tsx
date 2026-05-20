"use client";

import { useState, useTransition } from "react";
import { Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { processMeshAction } from "@/lib/actions/meshProcessing";

/**
 * Triggers the server-side mesh → 2D floor plan pipeline.
 * Only rendered when the floor has an uploaded mesh.
 */
export function GeneratePlanButton({
  floorId,
  hasMesh,
}: {
  floorId: string;
  hasMesh: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<
    | null
    | {
        kind: "ok";
        edges: number;
        widthMeters: number;
        depthMeters: number;
      }
    | { kind: "err"; message: string }
  >(null);

  if (!hasMesh) {
    return (
      <button
        type="button"
        disabled
        title="Upload a .glb mesh from the scanner mobile app first."
        className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600"
      >
        <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
        Auto-generate plan
      </button>
    );
  }

  function run() {
    setResult(null);
    const fd = new FormData();
    fd.set("floorId", floorId);
    startTransition(async () => {
      const r = await processMeshAction(fd);
      if (r.ok) {
        setResult({
          kind: "ok",
          edges: r.edges ?? 0,
          widthMeters: r.widthMeters ?? 0,
          depthMeters: r.depthMeters ?? 0,
        });
      } else {
        setResult({ kind: "err", message: r.error ?? "Failed" });
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow disabled:opacity-60"
      >
        <Sparkles
          className={pending ? "h-3.5 w-3.5 animate-pulse" : "h-3.5 w-3.5"}
          strokeWidth={2.5}
        />
        {pending ? "Generating…" : "Auto-generate plan"}
      </button>

      {result?.kind === "ok" && (
        <span className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-3 w-3" />
          {result.edges} edges · {result.widthMeters.toFixed(1)}×
          {result.depthMeters.toFixed(1)} m
        </span>
      )}
      {result?.kind === "err" && (
        <span className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-3 w-3" />
          {result.message}
        </span>
      )}
    </div>
  );
}
