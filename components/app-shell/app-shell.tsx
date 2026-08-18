import { BrandLockup } from "@/components/brand/rotary-mark";
import { SidebarNav } from "./sidebar-nav";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { UserMenu } from "./user-menu";
import { currentMember } from "@/lib/mock-data";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-16 items-center px-4">
          <BrandLockup />
        </div>
        <SidebarNav />
        <div className="border-t border-sidebar-border p-3">
          <UserMenu member={currentMember} variant="expanded" />
        </div>
      </aside>

      <div className="flex min-h-full flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
          <BrandLockup />
          <UserMenu member={currentMember} variant="compact" />
        </header>

        <main className="flex-1 pb-20 md:pb-0">{children}</main>

        <MobileBottomNav />
      </div>
    </div>
  );
}
