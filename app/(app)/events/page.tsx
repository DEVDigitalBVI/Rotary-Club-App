import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/page-container";
import { EventCard } from "@/components/events/event-card";
import { CreateEventDialog } from "@/components/events/create-event-dialog";
import { getEventPage } from "@/lib/data/events";
import { getCurrentMember } from "@/lib/data/members";
import { getCommittees } from "@/lib/data/committees";
import { canManageEvents } from "@/lib/club";

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ period?: string; page?: string }> }) {
  const params = await searchParams;
  const period = params.period === "past" ? "past" : "upcoming";
  const page = Math.max(1, Math.min(10000, Number.parseInt(params.page ?? "1") || 1));
  const [{ events, total }, member, committees] = await Promise.all([getEventPage(period, page), getCurrentMember(), getCommittees()]);
  return <div><PageHeader title="Events" description="Meetings and events, and your RSVP status." actions={member && canManageEvents(member, committees) ? <CreateEventDialog /> : undefined} />
    <PageContainer><nav aria-label="Event views" className="mb-5 flex gap-5 text-sm font-semibold"><Link aria-current={period === "upcoming" ? "page" : undefined} href="/events?period=upcoming">Upcoming</Link><Link aria-current={period === "past" ? "page" : undefined} href="/events?period=past">Past</Link><Link href="/events/calendar.ics">Download calendar</Link></nav>
      <p className="mb-4 text-sm text-muted-foreground">{total} {period} events</p><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{events.map(event => <EventCard key={event.id} event={event} />)}</div>
      {!events.length && <p className="rounded-xl border border-dashed p-8 text-center">No events on this page.</p>}
      <nav aria-label="Event pages" className="mt-6 flex justify-between text-sm font-semibold text-primary">{page > 1 ? <Link href={`/events?period=${period}&page=${page - 1}`}>← Previous</Link> : <span />}{page * 12 < total && <Link href={`/events?period=${period}&page=${page + 1}`}>Next →</Link>}</nav>
    </PageContainer></div>;
}
