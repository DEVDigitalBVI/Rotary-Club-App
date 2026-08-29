import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Newspaper,
  MessageSquare,
  HandHeart,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  mobileLabel?: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/directory", label: "Directory", icon: Users },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/projects", label: "Service", icon: HandHeart },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/chat", label: "Chat", icon: MessageSquare },
];

const byHref = new Map(navItems.map((item) => [item.href, item]));
export const mobilePrimaryItems = ["/dashboard", "/events", "/chat", "/projects"].map((href) => byHref.get(href)!);
export const mobileMoreItems = ["/directory", "/news"].map((href) => byHref.get(href)!);
