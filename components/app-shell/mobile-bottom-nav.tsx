"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden print:hidden">
      {navItems.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "font-heading flex flex-1 flex-col items-center gap-1 py-2 text-[0.65rem] font-medium whitespace-nowrap",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "flex items-center justify-center rounded-full px-3 py-1 transition-colors",
                active && "bg-primary/10"
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
