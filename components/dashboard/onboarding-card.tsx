import { ArrowUpRight, Check, Compass } from "lucide-react";
import Link from "next/link";
import { onboardingTasks, type OnboardingKey } from "@/lib/data/onboarding";

export function OnboardingCard({ completed }: { completed: OnboardingKey[] }) {
  if (completed.length === onboardingTasks.length) return null;
  const percent = Math.round(completed.length / onboardingTasks.length * 100);
  const nextTask = onboardingTasks.find((task) => !completed.includes(task.key));
  if (!nextTask) return null;
  return (
    <section className="mx-4 mt-5 overflow-hidden rounded-[1.5rem] border border-border bg-card sm:mx-8 lg:mx-10">
      <div className="grid md:grid-cols-[minmax(16rem,.65fr)_minmax(0,1.35fr)]">
        <div className="bg-[var(--nav-surface)] p-6 text-white">
          <div className="flex items-center gap-3"><Compass className="size-5 text-[var(--rotary-gold)]" /><div><p className="font-label text-white/55">Your Rotary journey</p><h2 className="font-heading mt-1 text-2xl font-semibold">Find your place.</h2></div></div>
          <div className="mt-5 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-white/12"><div className="h-full rounded-full bg-[var(--rotary-gold)]" style={{ width: `${percent}%` }} /></div><span className="text-sm font-semibold text-white/70">{percent}%</span></div>
        </div>
        <Link href={nextTask.href} className="group flex items-center gap-4 p-6 transition-colors hover:bg-muted/45">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Check className="size-4" /></span>
          <span className="min-w-0 flex-1"><span className="font-label block text-primary/70">Next journey step</span><strong className="mt-1 block text-base text-foreground">{nextTask.title}</strong><span className="mt-1 block text-sm leading-6 text-muted-foreground">{nextTask.detail}</span></span>
          <ArrowUpRight className="size-5 shrink-0 text-primary transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
