import { StatusBadge } from "@/components/status-badge";
import type { RsvpStatus } from "@/lib/mock-data";

export function RsvpStatusBadge({ status }: { status: RsvpStatus }) {
  if (status === "yes") return <StatusBadge tone="grass">Going</StatusBadge>;
  if (status === "maybe") return <StatusBadge tone="gold">Maybe</StatusBadge>;
  if (status === "no") return <StatusBadge tone="neutral">Not going</StatusBadge>;
  return <StatusBadge tone="sky">RSVP</StatusBadge>;
}
