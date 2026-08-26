"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1.5 px-4">
      {navItems.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none transition-[background-color,color,transform,box-shadow] focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              active
                ? "bg-white text-[var(--nav-surface)] shadow-sm"
                : "text-sidebar-foreground/68 hover:translate-x-0.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-4 shrink-0" strokeWidth={active ? 2.5 : 2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
