import { BrandLockup } from "@/components/brand/rotary-mark";
import { SidebarNav } from "./sidebar-nav";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { currentMember } from "@/lib/mock-data";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full min-w-0 flex-1">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex print:hidden">
        <div
          className="flex h-28 items-center px-4"
          style={{ backgroundColor: "var(--rotary-blue)" }}
        >
          <BrandLockup logoClassName="h-20" />
        </div>
        <SidebarNav />
        <div className="flex items-center gap-2 border-t border-sidebar-border p-3">
          <div className="min-w-0 flex-1">
            <UserMenu member={currentMember} variant="expanded" />
          </div>
          <ThemeToggle className="shrink-0" />
        </div>
      </aside>

      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-30 flex h-24 items-center justify-between px-4 md:hidden print:hidden"
          style={{ backgroundColor: "var(--rotary-blue)" }}
        >
          <BrandLockup />
          <div className="flex items-center gap-1">
            <ThemeToggle className="text-white hover:bg-white/15 hover:text-white" />
            <UserMenu member={currentMember} variant="compact" />
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden pb-20 md:pb-0 print:pb-0">{children}</main>

        <MobileBottomNav />
      </div>
    </div>
  );
}
