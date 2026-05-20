"use client";

import { useState, useTransition } from "react";
import { Bell, X, Send, AlertTriangle } from "lucide-react";
import { sendTenantPushAction } from "@/lib/actions/notifications";

export function SendPushDialog({
  tenantId,
  tenantName,
}: {
  tenantId: string;
  tenantName: string;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sentCount, setSentCount] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setTitle("");
    setBody("");
    setError(null);
    setSentCount(null);
  }

  function close() {
    setOpen(false);
    setTimeout(reset, 200);
  }

  async function send() {
    setError(null);
    setSentCount(null);
    const fd = new FormData();
    fd.set("tenantId", tenantId);
    fd.set("title", title);
    fd.set("body", body);
    startTransition(async () => {
      const result = await sendTenantPushAction(fd);
      if (!result.ok) {
        setError(result.error ?? "Failed to send");
      } else {
        setSentCount(result.sent ?? 0);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Bell className="h-3.5 w-3.5" strokeWidth={2} />
        Send notification
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Send push notification
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Delivered to every signed-in mobile user of {tenantName}.
                </p>
              </div>
              <button
                onClick={close}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Never include patient names, diagnoses, room numbers or other
                PHI. Push payloads travel through Apple/Google servers.
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Title <span className="text-slate-400">({title.length}/80)</span>
                </label>
                <input
                  type="text"
                  maxLength={80}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Floor closed for maintenance"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Body <span className="text-slate-400">({body.length}/240)</span>
                </label>
                <textarea
                  maxLength={240}
                  rows={3}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="The 3rd floor pharmacy will be closed today from 2pm to 4pm."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            {error && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                {error}
              </div>
            )}
            {sentCount !== null && (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                {sentCount === 0
                  ? "No devices are registered yet for this tenant."
                  : `Delivered to ${sentCount} device${sentCount === 1 ? "" : "s"}.`}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={send}
                disabled={pending || !title.trim() || !body.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <Send className="h-3.5 w-3.5" strokeWidth={2} />
                {pending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
