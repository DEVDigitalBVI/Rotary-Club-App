"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function MobileBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const primaryItems = navItems.slice(0, 4);
  const moreItems = navItems.slice(4);
  const moreActive = moreItems.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  return (
    <>
      <nav className="fixed inset-x-3 bottom-3 z-40 flex overflow-hidden rounded-2xl border border-white/10 bg-[var(--nav-surface)]/95 pb-[env(safe-area-inset-bottom)] shadow-2xl backdrop-blur md:hidden print:hidden">
      {primaryItems.map((item) => {
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
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.58rem] font-semibold whitespace-nowrap",
            moreActive ? "text-white" : "text-white/48"
          )}
        >
          <span className={cn("flex items-center justify-center rounded-full px-3 py-1", moreActive && "bg-white/12")}><MoreHorizontal className="size-5" strokeWidth={moreActive ? 2.5 : 2} /></span>
          More
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-[1.75rem] border-border pb-[calc(1rem+env(safe-area-inset-bottom))] md:hidden">
          <SheetHeader className="border-b border-border px-5 pb-4 pt-5">
            <SheetTitle className="font-heading text-2xl font-semibold">More from your club</SheetTitle>
            <SheetDescription>Account, notices, and conversations.</SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-3 px-4 pb-2">
            {moreItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)} className={cn("flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card px-2 text-center text-xs font-bold transition-colors", active ? "border-primary bg-primary/8 text-primary" : "hover:bg-muted")}>
                  <span className={cn("flex size-10 items-center justify-center rounded-full", active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}><Icon className="size-5" /></span>
                  {item.mobileLabel ?? item.label}
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
