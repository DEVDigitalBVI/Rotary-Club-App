import Link from "next/link";
import { ArrowLeft, CalendarSync, DatabaseZap, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { ClubRunnerImportForm } from "@/components/admin/clubrunner-import-form";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getCommittees } from "@/lib/data/committees";
import { getCurrentMember } from "@/lib/data/members";
import { canAddMembers } from "@/lib/mock-data";

export default async function ClubRunnerAdminPage() {
  const [member, committees] = await Promise.all([getCurrentMember(), getCommittees()]);
  if (!member || !canAddMembers(member, committees)) notFound();

  return (
    <div>
      <PageHeader
        title="ClubRunner bridge"
        description="Keep the member house current even though ClubRunner does not offer the club a public API."
        actions={<Button variant="outline" nativeButton={false} render={<Link href="/directory" />}><ArrowLeft />Directory</Button>}
      />
      <PageContainer className="max-w-5xl space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,.65fr)]">
          <section className="rounded-[1.5rem] border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
            <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary"><DatabaseZap className="size-5" /></div>
            <h2 className="font-heading mt-5 text-3xl font-semibold">Update the roster from CSV</h2>
            <p className="mt-2 text-base leading-7 text-muted-foreground">Export the member list from ClubRunner, check the preview, then apply it here. Existing people are matched by email; new people are added.</p>
            <div className="mt-7"><ClubRunnerImportForm /></div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-[1.5rem] border border-border bg-[var(--nav-surface)] p-6 text-white">
              <ShieldCheck className="size-6 text-[var(--rotary-gold)]" />
              <h2 className="font-heading mt-4 text-2xl font-semibold">Safe by design</h2>
              <p className="mt-2 text-sm leading-6 text-white/70">The import never removes people, changes officer roles, edits Foundation recognition, or links sign-in accounts. Only authorized club leaders can run it.</p>
            </section>
            <section className="rounded-[1.5rem] border border-border bg-card p-6">
              <CalendarSync className="size-5 text-primary" />
              <h2 className="font-heading mt-4 text-xl font-semibold">Calendar connection</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Members can download the app calendar from Events. Automatic ClubRunner-to-app updates become possible if ClubRunner supplies a private iCalendar feed URL; a public API is not required.</p>
              <Button variant="outline" className="mt-4" nativeButton={false} render={<Link href="/events" />}>Open events</Button>
            </section>
          </aside>
        </div>
      </PageContainer>
    </div>
  );
}
