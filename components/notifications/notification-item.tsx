import Link from "next/link";
import { BellRing, CalendarDays, HandHeart, MessageSquare, Settings2, type LucideIcon } from "lucide-react";
import type { Notification } from "@/lib/data/notifications";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

function presentation(type: string): { icon: LucideIcon; label: string; tone: string } {
  if (type === "announcement") return { icon: BellRing, label: "Announcement", tone: "bg-primary/10 text-primary" };
  if (type.startsWith("event")) return { icon: CalendarDays, label: "Event", tone: "bg-[var(--rotary-gold)]/18 text-[#865500] dark:text-[var(--rotary-gold)]" };
  if (type.startsWith("service")) return { icon: HandHeart, label: "Service", tone: "bg-[var(--tone-grass-bg)] text-[var(--tone-grass-fg)]" };
  if (type === "chat") return { icon: MessageSquare, label: "Chat", tone: "bg-[var(--tone-sky-bg)] text-[var(--tone-sky-fg)]" };
  return { icon: Settings2, label: "Account", tone: "bg-muted text-muted-foreground" };
}

export function NotificationItem({ notification, compact = false, onOpen }: { notification: Notification; compact?: boolean; onOpen?: () => void }) {
  const item = presentation(notification.type);
  const Icon = item.icon;
  const content = (
    <>
      <span className={cn("flex shrink-0 items-center justify-center rounded-xl", item.tone, compact ? "size-9" : "size-11")}><Icon aria-hidden="true" className={compact ? "size-4" : "size-5"} /></span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className={cn("font-semibold leading-snug", compact ? "text-sm" : "text-[0.95rem]", !notification.read && "text-foreground")}>{notification.title}</span>
          {!notification.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
        </span>
        {notification.body && <span className={cn("mt-1 block text-muted-foreground", compact ? "line-clamp-2 text-xs leading-5" : "text-sm leading-5")}>{notification.body}</span>}
        <span className="mt-1.5 block text-xs text-muted-foreground">{item.label} · {formatDateTime(notification.createdAt)}</span>
      </span>
    </>
  );
  const classes = cn("flex w-full items-start gap-3 rounded-xl text-left outline-none transition-colors hover:bg-muted/65 focus-visible:ring-2 focus-visible:ring-ring", compact ? "p-2.5" : "p-4", !notification.read && "bg-primary/[0.045]");
  return notification.link ? <Link href={notification.link} onClick={onOpen} className={classes}>{content}</Link> : <button type="button" onClick={onOpen} className={classes}>{content}</button>;
}
