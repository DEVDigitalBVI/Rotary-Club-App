"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 flex overflow-hidden rounded-2xl border border-white/10 bg-[#0d315b]/95 pb-[env(safe-area-inset-bottom)] shadow-2xl backdrop-blur md:hidden print:hidden">
      {navItems.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.58rem] font-semibold whitespace-nowrap",
              active ? "text-white" : "text-white/48"
            )}
          >
            <span
              className={cn(
                "flex items-center justify-center rounded-full px-3 py-1 transition-colors",
                active && "bg-white/12"
              )}
            >
              <Icon
                className="size-5"
                strokeWidth={active ? 2.5 : 2}
                fill={active ? "color-mix(in oklch, var(--primary) 15%, transparent)" : "none"}
              />
            </span>
            {item.mobileLabel ?? item.label}
          </Link>
        );
      })}
    </nav>
  );
}
