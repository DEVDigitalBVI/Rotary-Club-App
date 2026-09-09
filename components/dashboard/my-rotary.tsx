import Link from "next/link";
import { ArrowUpRight, Bell, CalendarDays, HandHeart, Users } from "lucide-react";
import type { Member, Committee, EventItem } from "@/lib/club";
import type { ServiceProject } from "@/lib/data/projects";
import type { getMyRotaryActivity } from "@/lib/data/my-rotary";
import { upcomingPersonalRsvps } from "@/lib/my-rotary";
import { formatDate, formatTime, toClubDateString } from "@/lib/format";

type Activity = Awaited<ReturnType<typeof getMyRotaryActivity>>;
const number = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);

export function MyRotary({ member, committees, events, projects, activity }: {
  member: Member; committees: Committee[]; events: EventItem[]; projects: ServiceProject[]; activity: Activity;
}) {
  const rsvps = upcomingPersonalRsvps(events);
  const memberships = committees.filter((committee) => committee.memberIds.includes(member.id) || committee.directorId === member.id);
  const myProjects = projects.filter((project) => project.status === "open" && (project.volunteerIds.includes(member.id) || activity.serviceSlots.some((s) => s.project_slots.project_id === project.id)));

  return (
    <section aria-label="My Rotary overview" className="mx-4 mb-8 grid gap-4 sm:mx-8 lg:mx-10 lg:grid-cols-[1.25fr_1fr]">
      <section className="rise-in overflow-hidden rounded-[1.5rem] bg-[var(--feature-surface)] p-6 text-white sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <p className="font-label flex items-center gap-2 text-white/75"><CalendarDays className="size-4 text-[var(--rotary-gold)]" />Your diary</p>
          <span className="rounded-full border border-white/25 px-3 py-1 text-xs">{rsvps.length + activity.serviceSlots.length} upcoming</span>
        </div>
        <h2 className="font-heading mt-3 text-3xl font-semibold">Where you’re showing up.</h2>
        {rsvps.length ? (
          <ul className="mt-5 divide-y divide-white/15">
            {rsvps.slice(0, 3).map((event) => {
              const status = event.myRsvp === "maybe" ? "Maybe" : event.registration?.status === "waitlisted" ? "Waitlisted" : "Going";
              return <li key={event.id}><Link href={`/events/${event.id}`} className="group flex items-start justify-between gap-4 rounded-lg py-4 outline-none focus-visible:ring-2 focus-visible:ring-white">
                <span className="min-w-0"><span className="block text-xs text-white/70">{formatDate(event.date, { year: undefined })} · {event.time}</span><strong className="mt-1 block text-lg font-semibold group-hover:underline">{event.title}</strong>{event.location && <span className="mt-1 block text-xs text-white/70">{event.location}</span>}</span>
                <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[var(--rotary-gold)]">{status}</span>
              </Link></li>;
            })}
          </ul>
        ) : activity.serviceSlots.length === 0 && <p className="my-6 max-w-md text-sm leading-7 text-white/75">Your diary is open. RSVP to a meeting or fellowship event and it will appear here.</p>}
        {activity.serviceSlots.length > 0 && <ul className="mt-4 divide-y divide-white/15">{[...activity.serviceSlots].sort((a,b) => a.project_slots.starts_at.localeCompare(b.project_slots.starts_at)).slice(0,3).map((signup) => <li key={signup.slot_id}><Link href={`/projects/${signup.project_slots.project_id}`} className="block py-3 hover:underline"><span className="block text-xs text-white/70">{formatDate(toClubDateString(signup.project_slots.starts_at))} · {formatTime(signup.project_slots.starts_at)} · {signup.status === "waitlisted" ? "Waitlisted" : "Booked"}</span><strong className="mt-1 block text-sm">{signup.project_slots.service_projects.title} · {signup.project_slots.title}</strong></Link></li>)}</ul>}
        <Link href="/events" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--rotary-gold)] hover:underline">Browse all events <ArrowUpRight className="size-4" /></Link>
      </section>

      <section className="rise-in rise-in-delay-1 rounded-[1.5rem] border border-border bg-card p-6 sm:p-7">
        <p className="font-label flex items-center gap-2 text-primary"><HandHeart className="size-4" />Your contribution · {activity.year}</p>
        <h2 className="sr-only">Your service hours</h2>
        <div className="mt-5">
          <p className="font-heading text-6xl font-semibold tracking-tight text-primary">{number(activity.hours.total)}<span className="ml-2 text-xl font-normal">hrs</span></p>
          <p className="mt-2 text-xs text-muted-foreground">Service hours logged this Rotary year</p>
          <Link href="/service-record" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">View your service record <ArrowUpRight className="size-4" /></Link>
        </div>
        <div className="mt-6 border-t border-border pt-4">
          <p className="text-sm font-semibold">{myProjects.length} active service {myProjects.length === 1 ? "commitment" : "commitments"}</p>
          {myProjects.length > 0 ? <ul className="mt-2 space-y-1">{myProjects.slice(0, 2).map((project) => <li key={project.id} className="text-sm text-muted-foreground">{project.title}</li>)}</ul> : <p className="mt-2 text-sm leading-6 text-muted-foreground">Find a project where your time can make a difference.</p>}
          <Link href="/projects" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">{myProjects.length ? "View your service slots" : "Find a service project"} <ArrowUpRight className="size-4" /></Link>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-border bg-card p-6 sm:p-7">
        <div className="flex items-center justify-between gap-3"><h2 className="font-heading flex items-center gap-2 text-2xl font-semibold"><Bell className="size-4 text-primary" />Unread notices</h2><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{activity.unreadNoticeCount}</span></div>
        {activity.notices.length ? <ul className="mt-3 divide-y divide-border">{activity.notices.map((notice) => <li key={notice.id}><Link href="/notifications" className="block rounded-lg py-3 hover:text-primary"><strong className="block text-sm">{notice.title}</strong>{notice.body && <span className="mt-1 line-clamp-2 block text-sm leading-6 text-muted-foreground">{notice.body}</span>}</Link></li>)}</ul> : <p className="mt-4 text-sm leading-6 text-muted-foreground">You’re caught up on your announcement notifications.</p>}
        <Link href="/notifications" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Open your inbox <ArrowUpRight className="size-4" /></Link>
      </section>

      <section className="rounded-[1.5rem] border border-border bg-card p-6 sm:p-7">
        <h2 className="font-heading flex items-center gap-2 text-2xl font-semibold"><Users className="size-4 text-primary" />Your committees</h2>
        {member.position && <p className="mt-3 text-xs font-semibold capitalize text-primary">{member.position.replaceAll("-", " ")}</p>}
        {memberships.length ? <ul className="mt-3 divide-y divide-border">{memberships.map((committee) => <li key={committee.id} className="flex items-center justify-between gap-3 py-3"><span className="text-sm font-medium">{committee.name}</span><span className="shrink-0 text-xs text-muted-foreground">{committee.directorId === member.id ? "Director" : "Member"}</span></li>)}</ul> : <p className="mt-4 text-sm leading-6 text-muted-foreground">Get to know the committees and find where you’d like to serve.</p>}
        <Link href="/directory?tab=committees" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Explore committees <ArrowUpRight className="size-4" /></Link>
      </section>
      <Link href="/feedback" className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 hover:bg-muted/40 lg:col-span-2"><span><strong className="font-heading block text-lg">Have an idea for the club?</strong><span className="mt-1 block text-sm text-muted-foreground">Send quick feedback or suggest an improvement.</span></span><ArrowUpRight className="size-5 shrink-0 text-primary" /></Link>
    </section>
  );
}
