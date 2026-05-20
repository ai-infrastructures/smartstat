"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Hospital,
  Building2,
  Layers,
  MapPin,
  ScrollText,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { UserMenu } from "./UserMenu";

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/tenants", label: "Tenants", Icon: Hospital },
  { href: "/buildings", label: "Buildings", Icon: Building2 },
  { href: "/floors", label: "Floors", Icon: Layers },
  { href: "/pois", label: "Points of Interest", Icon: MapPin },
  { href: "/audit", label: "Audit log", Icon: ScrollText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200/60 bg-white/70 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-950/70 md:flex md:flex-col">
      <div className="border-b border-slate-200/80 px-5 py-5 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <Logo className="h-9 w-9 shrink-0" />
          <div className="flex flex-col leading-tight">
            <span className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">
              SmartStat AI
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">
              Admin · v0
            </span>
          </div>
        </div>
      </div>

      <div className="px-3 pt-3">
        <Link
          href="/new-map"
          className="flex items-center gap-2.5 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow"
        >
          <Sparkles className="h-4 w-4" strokeWidth={2.5} />
          New map
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-0.5">
          {NAV.map(({ href, label, Icon }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={
                    isActive
                      ? "group flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition dark:bg-blue-950/40 dark:text-blue-300"
                      : "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white"
                  }
                >
                  <Icon
                    className={
                      isActive
                        ? "h-[18px] w-[18px] text-blue-600 dark:text-blue-400"
                        : "h-[18px] w-[18px] text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                    }
                    strokeWidth={2}
                  />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <UserMenu />
    </aside>
  );
}

function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="55%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" rx="224" fill="url(#logo-bg)" />
      <path
        d="M512 820 C 380 720, 280 620, 240 500 C 215 420, 240 330, 320 305 C 388 285, 460 320, 512 390 C 564 320, 636 285, 704 305 C 784 330, 809 420, 784 500 C 744 620, 644 720, 512 820 Z"
        fill="#FFFFFF"
      />
      <path
        d="M512 470 L 460 540 L 488 540 L 488 620 L 536 620 L 536 540 L 564 540 Z"
        fill="url(#logo-bg)"
      />
    </svg>
  );
}
