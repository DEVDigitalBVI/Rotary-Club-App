import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Wallet,
  Newspaper,
  MessageSquare,
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
  { href: "/account", label: "My Account", mobileLabel: "Account", icon: Wallet },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/chat", label: "Chat", icon: MessageSquare },
];
