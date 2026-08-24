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
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex print:hidden">
        <div className="flex h-28 items-center px-6">
          <BrandLockup logoClassName="h-[4.5rem]" />
        </div>
        <p className="font-label px-6 pb-5 text-[0.62rem] text-white/45">Member house · Road Town</p>
        <SidebarNav />
        <div className="flex items-center gap-2 border-t border-sidebar-border p-4">
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
          className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/10 bg-sidebar px-4 md:hidden print:hidden"
        >
          <BrandLockup logoClassName="h-14" />
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
