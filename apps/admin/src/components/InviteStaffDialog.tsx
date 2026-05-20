"use client";

import { useState, useTransition } from "react";
import { Mail, UserPlus, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { inviteStaffAction } from "@/lib/actions/staffInvite";

const ROLES: { value: string; label: string; hint: string }[] = [
  {
    value: "scanner_operator",
    label: "Scanner operator",
    hint: "Can upload LiDAR scans and 2D floor plans from the mobile app.",
  },
  {
    value: "tenant_editor",
    label: "Tenant editor",
    hint: "Can edit POIs, waypoints, and publish floors. Cannot invite users.",
  },
  {
    value: "tenant_admin",
    label: "Tenant admin",
    hint: "Full access to this tenant: edit, publish, invite, send notifications.",
  },
];

export function InviteStaffDialog({
  tenantId,
  tenantName,
}: {
  tenantId: string;
  tenantName: string;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("scanner_operator");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<"sent" | "dev-stub" | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setEmail("");
    setRole("scanner_operator");
    setError(null);
    setSent(null);
  }

  function close() {
    setOpen(false);
    setTimeout(reset, 200);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSent(null);
    const fd = new FormData();
    fd.set("tenantId", tenantId);
    fd.set("email", email);
    fd.set("role", role);
    startTransition(async () => {
      const r = await inviteStaffAction(fd);
      if (!r.ok) {
        setError(r.error ?? "Failed");
      } else {
        setSent(r.delivery === "dev-stub" ? "dev-stub" : "sent");
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
        <UserPlus className="h-3.5 w-3.5" strokeWidth={2} />
        Invite staff
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Invite a staff member
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  To {tenantName}. They&apos;ll get a sign-in email.
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

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Email
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@hospital.example"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Role
                </label>
                <div className="space-y-2">
                  {ROLES.map((r) => (
                    <label
                      key={r.value}
                      className={
                        role === r.value
                          ? "flex cursor-pointer items-start gap-3 rounded-xl border-2 border-blue-500 bg-blue-50 p-3 dark:bg-blue-950/30"
                          : "flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/60 bg-white p-3 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                      }
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={role === r.value}
                        onChange={(e) => setRole(e.target.value)}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {r.label}
                        </div>
                        <div className="text-xs text-slate-500">{r.hint}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {error}
                </div>
              )}
              {sent && (
                <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {sent === "sent"
                    ? `Invite delivered to ${email}.`
                    : `Invite logged locally (RESEND_API_KEY not set — dev mode).`}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={pending || !email}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  <Mail className="h-3.5 w-3.5" strokeWidth={2} />
                  {pending ? "Sending…" : "Send invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
