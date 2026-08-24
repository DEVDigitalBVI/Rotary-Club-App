import { BrandLockup } from "@/components/brand/rotary-mark";
import { SidebarNav } from "./sidebar-nav";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { UserMenu } from "./user-menu";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentMember } from "@/lib/data/members";
import { getNotifications, getUnreadNotificationCount } from "@/lib/data/notifications";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const [currentMember, notifications, unreadCount] = await Promise.all([
    getCurrentMember(),
    getNotifications(),
    getUnreadNotificationCount(),
  ]);

  return (
    <div className="flex min-h-full min-w-0 flex-1">
      <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex print:hidden">
        <div
          className="flex h-32 items-center px-4"
          style={{ backgroundColor: "var(--rotary-blue)" }}
        >
          <BrandLockup logoClassName="h-24" />
        </div>
        <SidebarNav />
        <div className="flex items-center gap-2 border-t border-sidebar-border p-3">
          <div className="min-w-0 flex-1">
            {currentMember ? (
              <UserMenu member={currentMember} variant="expanded" />
            ) : (
              <p className="px-2 text-xs text-muted-foreground">
                Account not linked to a member profile.
              </p>
            )}
          </div>
          {currentMember && (
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              className="shrink-0 text-sidebar-foreground hover:bg-sidebar-accent"
            />
          )}
          <ThemeToggle className="shrink-0" />
        </div>
      </aside>

      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-30 flex h-24 items-center justify-between px-4 md:hidden print:hidden"
          style={{ backgroundColor: "var(--rotary-blue)" }}
        >
          <BrandLockup logoClassName="h-18" />
          <div className="flex items-center gap-1">
            {currentMember && (
              <NotificationBell
                notifications={notifications}
                unreadCount={unreadCount}
                className="text-white hover:bg-white/15"
              />
            )}
            <ThemeToggle className="text-white hover:bg-white/15 hover:text-white" />
            {currentMember && <UserMenu member={currentMember} variant="compact" />}
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden pb-20 md:pb-0 print:pb-0">{children}</main>

        <MobileBottomNav />
      </div>
    </div>
  );
}
