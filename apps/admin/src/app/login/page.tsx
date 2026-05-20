import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-6 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <svg
            viewBox="0 0 1024 1024"
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto mb-4 h-14 w-14 drop-shadow-md"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="login-logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1D4ED8" />
                <stop offset="55%" stopColor="#0EA5E9" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
            </defs>
            <rect width="1024" height="1024" rx="224" fill="url(#login-logo-bg)" />
            <path
              d="M512 820 C 380 720, 280 620, 240 500 C 215 420, 240 330, 320 305 C 388 285, 460 320, 512 390 C 564 320, 636 285, 704 305 C 784 330, 809 420, 784 500 C 744 620, 644 720, 512 820 Z"
              fill="#FFFFFF"
            />
            <path
              d="M512 470 L 460 540 L 488 540 L 488 620 L 536 620 L 536 540 L 564 540 Z"
              fill="url(#login-logo-bg)"
            />
          </svg>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            SmartStat AI
          </h1>
          <p className="mt-1 text-sm text-slate-500">Admin sign in</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          The first user to sign in can claim super_admin from the dashboard.
        </p>
      </div>
    </main>
  );
}
