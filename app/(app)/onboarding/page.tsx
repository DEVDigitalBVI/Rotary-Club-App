import Link from "next/link";
import { ArrowUpRight, Check, Circle, Compass } from "lucide-react";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { getCurrentMember } from "@/lib/data/members";
import { getCompletedOnboarding, onboardingTasks } from "@/lib/data/onboarding";

export default async function OnboardingPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  const completed = await getCompletedOnboarding(member.id);
  const completedSet = new Set(completed);
  const percent = Math.round((completed.length / onboardingTasks.length) * 100);

  return (
    <div>
      <PageHeader
        title="Your Rotary journey"
        description="A short checklist for getting connected, finding your place, and joining club life."
      />
      <PageContainer className="max-w-4xl space-y-6">
        <section className="overflow-hidden rounded-[1.5rem] bg-[var(--nav-surface)] p-6 text-white sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-[var(--rotary-gold)]"><Compass className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="font-label text-white/55">Journey progress</p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <h2 className="font-heading text-3xl font-semibold">{completed.length} of {onboardingTasks.length} complete</h2>
                <span className="text-sm font-semibold text-white/70">{percent}%</span>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/12"><div className="h-full rounded-full bg-[var(--rotary-gold)]" style={{ width: `${percent}%` }} /></div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.5rem] border border-border bg-card">
          {onboardingTasks.map((task, index) => {
            const isComplete = completedSet.has(task.key);
            return (
              <Link key={task.key} href={task.href} className="group flex items-start gap-4 border-b border-border p-5 transition-colors last:border-0 hover:bg-muted/40 sm:p-6">
                <span className={isComplete ? "flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-600/12 text-emerald-700 dark:text-emerald-300" : "flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground"}>
                  {isComplete ? <Check className="size-4" /> : <Circle className="size-3" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-label block text-primary/60">Step {index + 1}</span>
                  <strong className="font-heading mt-1 block text-xl font-semibold text-foreground">{task.title}</strong>
                  <span className="mt-1 block text-sm leading-6 text-muted-foreground">{task.detail}</span>
                </span>
                <span className="mt-2 flex shrink-0 items-center gap-1 text-sm font-semibold text-primary">
                  {isComplete ? "Review" : "Open"}
                  <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </section>
      </PageContainer>
    </div>
  );
}
