import { StatusBadge } from "@/components/status-badge";
import type { NewsSource } from "@/lib/mock-data";

export function NewsSourceBadge({ source }: { source: NewsSource }) {
  if (source === "club") return <StatusBadge tone="sky">Club</StatusBadge>;
  if (source === "district") return <StatusBadge tone="violet">District 7020</StatusBadge>;
  return <StatusBadge tone="gold">Rotary International</StatusBadge>;
}
