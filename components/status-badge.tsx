import { cn } from "@/lib/utils";

type Tone = "grass" | "cardinal" | "gold" | "sky" | "violet" | "neutral";

// Each tone resolves through a pair of tokens defined in globals.css, which
// is what lets the badge follow the theme: an inline `style` cannot carry a
// `.dark` variant, so the light/dark values have to live in CSS.
const toneStyle: Record<Tone, React.CSSProperties> = {
  grass: { backgroundColor: "var(--tone-grass-bg)", color: "var(--tone-grass-fg)" },
  cardinal: {
    backgroundColor: "var(--tone-cardinal-bg)",
    color: "var(--tone-cardinal-fg)",
  },
  gold: { backgroundColor: "var(--tone-gold-bg)", color: "var(--tone-gold-fg)" },
  sky: { backgroundColor: "var(--tone-sky-bg)", color: "var(--tone-sky-fg)" },
  violet: { backgroundColor: "var(--tone-violet-bg)", color: "var(--tone-violet-fg)" },
  neutral: {
    backgroundColor: "var(--tone-neutral-bg)",
    color: "var(--tone-neutral-fg)",
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
