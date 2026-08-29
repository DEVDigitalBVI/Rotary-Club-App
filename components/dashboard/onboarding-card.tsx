import { ArrowRight, Compass } from "lucide-react";
import Link from "next/link";
import { onboardingTasks, type OnboardingKey } from "@/lib/data/onboarding";

export function OnboardingCard({ completed }: { completed: OnboardingKey[] }) {
  if (completed.length === onboardingTasks.length) return null;
  const percent = Math.round(completed.length / onboardingTasks.length * 100);
  return (
    <section className="mx-4 mt-5 rounded-[1.25rem] border border-border bg-card px-5 py-4 sm:mx-8 sm:px-6 lg:mx-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--nav-surface)] text-[var(--rotary-gold)]">
          <Compass className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-label text-primary/65">Your Rotary journey</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {completed.length} of {onboardingTasks.length} steps complete
              </p>
            </div>
            <span className="text-sm font-semibold text-foreground">{percent}%</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-[var(--rotary-gold)]" style={{ width: `${percent}%` }} />
          </div>
        </div>
        <Link href="/onboarding" className="group inline-flex shrink-0 items-center gap-2 self-start text-sm font-semibold text-primary hover:underline sm:self-center">
          View checklist
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
