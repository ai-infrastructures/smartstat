"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  Hospital,
  Building2,
  Layers,
  MapPin,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

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

/**
 * Top app bar shown only on viewports < md.
 * Renders the brand mark + a hamburger that toggles a slide-in drawer.
 */
export function MobileNavBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // The drawer is closed by each Link's onClick handler — see below.

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Top bar (mobile only) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-950/90">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-7 w-7" />
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            SmartStat AI
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
        </button>
      </header>

      {/* Drawer + scrim */}
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
          />
          <nav
            className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-xl md:hidden dark:border-slate-800 dark:bg-slate-950"
            aria-label="Main navigation"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Logo className="h-8 w-8" />
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  SmartStat AI
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            <ul className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
              {NAV.map(({ href, label, Icon }) => {
                const isActive =
                  href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className={
                        isActive
                          ? "flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                          : "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60"
                      }
                    >
                      <Icon
                        className={
                          isActive
                            ? "h-[18px] w-[18px] text-blue-600 dark:text-blue-400"
                            : "h-[18px] w-[18px] text-slate-400 dark:text-slate-500"
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
        </>
      )}
    </>
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
        <linearGradient id="mobile-logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="55%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" rx="224" fill="url(#mobile-logo-bg)" />
      <path
        d="M512 820 C 380 720, 280 620, 240 500 C 215 420, 240 330, 320 305 C 388 285, 460 320, 512 390 C 564 320, 636 285, 704 305 C 784 330, 809 420, 784 500 C 744 620, 644 720, 512 820 Z"
        fill="#FFFFFF"
      />
      <path
        d="M512 470 L 460 540 L 488 540 L 488 620 L 536 620 L 536 540 L 564 540 Z"
        fill="url(#mobile-logo-bg)"
      />
    </svg>
  );
}
