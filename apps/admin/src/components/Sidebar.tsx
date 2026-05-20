"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard", icon: "◇" },
  { href: "/tenants", label: "Tenants", icon: "▤" },
  { href: "/buildings", label: "Buildings", icon: "▢" },
  { href: "/floors", label: "Floors", icon: "▦" },
  { href: "/pois", label: "Points of Interest", icon: "●" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:flex md:flex-col">
      <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            S
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              SmartStat AI
            </span>
            <span className="text-[10px] uppercase tracking-wide text-slate-500">
              Admin · v0
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {NAV.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={
                    isActive
                      ? "flex items-center gap-2.5 rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                      : "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }
                >
                  <span className="w-4 text-center text-slate-500 dark:text-slate-500">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-200 px-5 py-4 text-[10px] text-slate-400 dark:border-slate-800">
        © {new Date().getFullYear()} SmartStat AI
      </div>
    </aside>
  );
}
