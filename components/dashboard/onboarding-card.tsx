import { Check, Circle, Compass } from "lucide-react";
import Link from "next/link";
import { onboardingTasks, type OnboardingKey } from "@/lib/data/onboarding";

export function OnboardingCard({ completed }: { completed: OnboardingKey[] }) {
  if (completed.length === onboardingTasks.length) return null;
  const percent = Math.round(completed.length / onboardingTasks.length * 100);
  return (
    <section className="mx-4 mt-5 overflow-hidden rounded-[1.5rem] border border-border bg-card sm:mx-8 lg:mx-10">
      <div className="grid lg:grid-cols-[.7fr_1.3fr]">
        <div className="bg-[#0d315b] p-6 text-white sm:p-7"><Compass className="size-6 text-[var(--rotary-gold)]" /><p className="font-label mt-5 text-[0.58rem] text-white/50">Your Rotary journey</p><h2 className="font-heading mt-2 text-3xl font-semibold">Find your place in the club.</h2><p className="mt-3 text-sm leading-6 text-white/60">{completed.length} of {onboardingTasks.length} steps complete · {percent}%</p><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/12"><div className="h-full rounded-full bg-[var(--rotary-gold)]" style={{ width: `${percent}%` }} /></div></div>
        <div className="divide-y divide-border px-6">
          {onboardingTasks.map((task) => { const done = completed.includes(task.key); const content = <><span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${done ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}>{done ? <Check className="size-3.5" /> : <Circle className="size-2" />}</span><span><strong className={`block text-sm ${done ? "text-muted-foreground" : "text-foreground"}`}>{task.title}</strong><span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{done ? "Completed automatically" : task.detail}</span></span></>; return done ? <div key={task.key} className="flex w-full items-start gap-3 py-4">{content}</div> : <Link key={task.key} href={task.href} className="group flex w-full items-start gap-3 py-4 transition-transform hover:translate-x-1">{content}</Link>; })}
        </div>
      </div>
    </section>
  );
}
