import { cn } from "@/lib/utils";

type Tone = "grass" | "cardinal" | "gold" | "sky" | "violet" | "neutral";

const toneStyle: Record<Tone, React.CSSProperties> = {
  grass: {
    backgroundColor: "color-mix(in oklch, var(--rotary-grass) 14%, white)",
    color: "color-mix(in oklch, var(--rotary-grass) 80%, black)",
  },
  cardinal: {
    backgroundColor: "color-mix(in oklch, var(--rotary-cardinal) 12%, white)",
    color: "color-mix(in oklch, var(--rotary-cardinal) 75%, black)",
  },
  gold: {
    backgroundColor: "color-mix(in oklch, var(--rotary-gold) 20%, white)",
    color: "color-mix(in oklch, var(--rotary-orange) 75%, black)",
  },
  sky: {
    backgroundColor: "color-mix(in oklch, var(--rotary-sky) 14%, white)",
    color: "color-mix(in oklch, var(--rotary-azure) 80%, black)",
  },
  violet: {
    backgroundColor: "color-mix(in oklch, var(--rotary-violet) 12%, white)",
    color: "color-mix(in oklch, var(--rotary-violet) 75%, black)",
  },
  neutral: {
    backgroundColor: "var(--muted)",
    color: "var(--muted-foreground)",
  },
};

export function StatusBadge({
  tone,
  className,
  children,
}: {
  tone: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center gap-1 rounded-full px-2 text-xs font-medium whitespace-nowrap",
        className
      )}
      style={toneStyle[tone]}
    >
      {children}
    </span>
  );
}
