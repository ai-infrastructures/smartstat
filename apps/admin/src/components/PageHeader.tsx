import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  href?: string;
  label: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  action,
}: {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: React.ReactNode;
}) {
  return (
    <header className="border-b border-slate-200/80 bg-white/70 px-4 py-5 backdrop-blur-sm md:px-8 md:py-6 dark:border-slate-800/80 dark:bg-slate-950/70">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-2 flex items-center gap-1 text-xs text-slate-500">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight
                  className="h-3 w-3 text-slate-300 dark:text-slate-600"
                  strokeWidth={2}
                />
              )}
              {b.href ? (
                <Link
                  href={b.href}
                  className="rounded px-1 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  {b.label}
                </Link>
              ) : (
                <span className="px-1 text-slate-700 dark:text-slate-300">
                  {b.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
