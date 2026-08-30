import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CalendarDays, CheckCircle2, ChevronRight, Clock3, HandHeart, MapPin, MessageCircle, Newspaper, Pin, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/member-avatar";
import { BirthdayBanner } from "@/components/dashboard/birthday-banner";
import { formatDate, todayDateString, todayMonthDay } from "@/lib/format";
import { getCurrentMember, getMembers } from "@/lib/data/members";
import { getVisibleNewsPosts } from "@/lib/data/news";
import { getEvents } from "@/lib/data/events";
import { getCompletedOnboarding, getOnboardingTaskHref, onboardingTasks } from "@/lib/data/onboarding";
import { OnboardingCard } from "@/components/dashboard/onboarding-card";
import { EventFlyerPreview } from "@/components/dashboard/event-flyer-preview";
import { NoticeAcknowledgement } from "@/components/news/notice-acknowledgement";
import { getServiceProjects } from "@/lib/data/projects";
import { getChatChannels } from "@/lib/data/chat";
import { getMissingMemberProfileFields } from "@/lib/member-profile";

type NextAction = {
  eyebrow: string;
  title: string;
  detail: string;
  href: string;
  missingFields?: string[];
};

function listWords(words: string[]) {
  return new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(words);
}

function eventDateParts(date: string) {
  const value = new Date(`${date}T12:00:00Z`);
  return {
    month: value.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
    day: value.toLocaleDateString("en-US", { day: "2-digit", timeZone: "UTC" }),
  };
}

export default async function DashboardPage() {
  const [viewer, members, newsPosts, events, serviceProjects] = await Promise.all([
    getCurrentMember(),
    getMembers(),
    getVisibleNewsPosts(),
    getEvents(),
    getServiceProjects(),
  ]);
  const birthdaysToday = members.filter(
    (member) => member.dateOfBirth?.slice(5) === todayMonthDay()
  );
  const today = todayDateString();
  const upcoming = events.filter((event) => event.date >= today).sort((a, b) => (a.date < b.date ? -1 : 1));
  const nextEvent = upcoming[0];
  const nextEventAttending = nextEvent
    ? nextEvent.rsvps.yes + (nextEvent.rsvps.guests ?? 0)
    : 0;
  const channels = viewer ? await getChatChannels(viewer.id) : [];
  const latestMessages = channels
    .flatMap((channel) => channel.messages.map((message) => ({ ...message, channel: channel.name })))
    .filter((message) => !message.deletedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 2);
  const clubNotices = newsPosts.filter((post) => post.source === "club");
  const latestNotices = (clubNotices.length > 0 ? clubNotices : newsPosts).slice(0, 3);
  const openServiceProjects = serviceProjects.filter((project) => project.status === "open").slice(0, 2);
  const firstName = viewer?.name.split(" ")[0] ?? "friend";
  const date = nextEvent ? eventDateParts(nextEvent.date) : null;
  const onboarding = viewer ? await getCompletedOnboarding(viewer.id) : [];
  const nextOnboardingTask = onboardingTasks.find((task) => !onboarding.includes(task.key));
  const missingProfileFields = getMissingMemberProfileFields(viewer);
  const noticeNeedingAction = latestNotices.find((notice) => notice.requiresAcknowledgement && !notice.acknowledgedAt);
  const eventNeedingRsvp = upcoming.find((event) => event.myRsvp === "none");
  const nextAction: NextAction = noticeNeedingAction
    ? { eyebrow: "Notice awaiting you", title: noticeNeedingAction.title, detail: "Read and acknowledge this club update.", href: "/news" }
    : eventNeedingRsvp
      ? { eyebrow: "RSVP requested", title: eventNeedingRsvp.title, detail: `${formatDate(eventNeedingRsvp.date)} · Let the club know if you’re coming.`, href: `/events/${eventNeedingRsvp.id}` }
      : nextOnboardingTask
        ? {
            eyebrow: "Your next step",
            title: nextOnboardingTask.title,
            detail: nextOnboardingTask.key === "profile"
              ? [
                  missingProfileFields.some((field) => field.selfService)
                    ? `You can add ${listWords(missingProfileFields.filter((field) => field.selfService).map((field) => field.label.toLowerCase()))}.`
                    : null,
                  missingProfileFields.some((field) => !field.selfService)
                    ? "You can add your classification now; your club secretary can change it later."
                    : null,
                ].filter(Boolean).join(" ")
              : nextOnboardingTask.detail,
            href: viewer ? getOnboardingTaskHref(nextOnboardingTask, viewer.id) : nextOnboardingTask.href,
            missingFields: nextOnboardingTask.key === "profile"
              ? missingProfileFields.map((field) => field.label)
              : undefined,
          }
        : openServiceProjects[0]
          ? { eyebrow: "Service opportunity", title: openServiceProjects[0].title, detail: "Join the team and help move this project forward.", href: "/projects" }
          : { eyebrow: "You’re all caught up", title: "Nothing needs your attention.", detail: "Explore the directory or start a conversation with a fellow member.", href: "/chat" };

  return (
    <div className="mx-auto w-full max-w-[1500px] pb-10">
      <header className="rise-in px-4 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-10 lg:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-label mb-3 text-primary/70">Member house · Road Town</p>
            <h1 className="font-heading max-w-3xl text-[2.6rem] font-semibold leading-[0.95] text-foreground sm:text-6xl">
              Your club, <span className="text-primary">today.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">The next gathering, the updates that matter, and one clear place to begin.</p>
          </div>
          <div className="hidden items-center gap-3 pb-1 lg:flex">
            <div className="flex -space-x-2.5">{members.slice(0, 5).map((member) => <MemberAvatar key={member.id} member={member} className="size-9 border-2 border-background" />)}</div>
            <p className="text-xs leading-4 text-muted-foreground"><strong className="block text-foreground">{members.length} members</strong>serving the BVI</p>
          </div>
        </div>
      </header>

      <div className="grid gap-5 px-4 sm:px-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(19rem,.75fr)] lg:px-10">
        {nextEvent && date ? (
          <section className="rise-in rise-in-delay-1 relative min-h-[23rem] overflow-hidden rounded-[1.75rem] bg-[var(--feature-surface)] text-[var(--feature-foreground)] shadow-[0_30px_70px_-38px_rgba(13,49,91,.8)]">
            <div className="absolute -right-24 -top-20 size-80 rounded-full border-[70px] border-white/[0.035]" />
            <div className="absolute -bottom-24 right-1/4 size-64 rounded-full bg-[var(--rotary-gold)]/10 blur-2xl" />
            <div className="relative flex h-full min-h-[23rem] flex-col p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-semibold backdrop-blur"><Sparkles className="size-3.5 text-[var(--rotary-gold)]" />Next gathering</div>
                <div className="min-w-16 rounded-2xl bg-[var(--rotary-gold)] px-3 py-2 text-center text-[var(--action-gold-foreground)] shadow-lg"><span className="font-label block text-[0.58rem]">{date.month}</span><span className="font-heading block text-3xl font-bold leading-none">{date.day}</span></div>
              </div>
              <div className={`mt-6 grid flex-1 items-end gap-7 ${nextEvent.flyer ? "lg:grid-cols-[minmax(0,1fr)_9.75rem]" : ""}`}>
                <div className="max-w-2xl">
                  <p className="font-label mb-3 text-[0.62rem] text-white/50">Club programme</p>
                  <h2 className="font-heading text-4xl font-semibold leading-[1.02] sm:text-5xl">{nextEvent.title}</h2>
                  {nextEvent.speaker && <p className="mt-4 max-w-xl text-sm leading-6 text-white/65 sm:text-base"><span className="text-white">{nextEvent.speaker.name}</span> on {nextEvent.speaker.topic}.</p>}
                  <div className="mt-5 flex flex-col gap-3 border-t border-white/15 pt-4 text-sm text-white/72 sm:flex-row sm:items-center sm:gap-7">
                    <span className="flex items-center gap-2"><Clock3 className="size-4 text-[var(--rotary-gold)]" />{nextEvent.time}</span>
                    <span className="flex items-center gap-2"><MapPin className="size-4 text-[var(--rotary-gold)]" />{nextEvent.location}</span>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Button className="h-11 rounded-full bg-white px-5 font-semibold text-[var(--feature-surface)] hover:bg-[var(--rotary-gold)]" nativeButton={false} render={<Link href={`/events/${nextEvent.id}`} />}>View gathering <ArrowUpRight className="size-4" /></Button>
                    <p className="text-xs text-white/50">{nextEventAttending} {nextEventAttending === 1 ? "person" : "people"} attending</p>
                  </div>
                </div>
                {nextEvent.flyer && <EventFlyerPreview flyer={nextEvent.flyer} eventTitle={nextEvent.title} />}
              </div>
            </div>
          </section>
        ) : (
          <section className="rise-in rise-in-delay-1 relative flex min-h-[23rem] flex-col justify-between overflow-hidden rounded-[1.75rem] bg-[var(--feature-surface)] p-6 text-white shadow-[0_30px_70px_-38px_rgba(13,49,91,.8)] sm:p-8">
            <div className="absolute -right-16 -top-20 size-72 rounded-full border-[64px] border-white/[0.04]" />
            <div className="relative">
              <span className="inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-[var(--rotary-gold)]"><CalendarDays className="size-5" /></span>
              <p className="font-label mt-8 text-white/55">Club calendar</p>
              <h2 className="font-heading mt-3 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">The next gathering is waiting to be scheduled.</h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-white/70">Once the programme is added—or the ClubRunner calendar is connected—members will see the next meeting here.</p>
            </div>
            <div className="relative mt-8 flex flex-wrap items-center gap-3">
              <Button nativeButton={false} render={<Link href="/events" />} className="rounded-full bg-white text-[var(--feature-surface)] hover:bg-[var(--rotary-gold)]">Open events <ArrowUpRight /></Button>
              <span className="text-sm text-white/55">No upcoming events</span>
            </div>
          </section>
        )}

        <aside className="rise-in rise-in-delay-2 flex flex-col overflow-hidden rounded-[1.75rem] border border-border bg-card">
          <div className="border-b border-border bg-primary/[0.035] p-6">
            <div className="flex items-center gap-2 text-primary"><Newspaper className="size-4" /><p className="font-label text-[0.62rem]">Club communications</p></div>
            <h2 className="font-heading mt-2 text-3xl font-semibold">Latest notices</h2>
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">Important updates from around the club.</p>
          </div>
          <div className="flex-1 divide-y divide-border px-6">
            {latestNotices.map((notice, index) => (
              <article key={notice.id} className="py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 font-label text-[0.52rem] text-primary/65">
                    {notice.isPinned && <Pin className="size-3" />}
                    {notice.priority === "urgent" && <AlertTriangle className="size-3 text-[var(--notice-urgent)]" />}
                    {index === 0 ? "Newest" : formatDate(notice.date)}
                  </span>
                  <Link href="/news" aria-label={`Read ${notice.title}`}><ArrowUpRight className="size-3.5 text-muted-foreground transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:text-primary" /></Link>
                </div>
                <Link href="/news" className="mt-1.5 block text-sm font-semibold leading-snug text-foreground hover:text-primary">{notice.title}</Link>
                <span className="mt-1 line-clamp-2 block text-sm leading-6 text-muted-foreground">{notice.body}</span>
                {notice.requiresAcknowledgement && notice.source === "club" && <div className="mt-3"><NoticeAcknowledgement postId={notice.id} acknowledgedAt={notice.acknowledgedAt} compact /></div>}
              </article>
            ))}
            {latestNotices.length === 0 && <p className="py-8 text-sm text-muted-foreground">No club notices have been posted yet.</p>}
          </div>
          <Link href="/news" className="flex items-center justify-between bg-[var(--action-gold)] p-5 text-sm font-bold text-[var(--action-gold-foreground)] transition-colors hover:bg-[var(--rotary-gold)]">Read all notices <ArrowUpRight className="size-4" /></Link>
        </aside>
      </div>

      <BirthdayBanner viewerId={viewer?.id} birthdays={birthdaysToday} />

      <div className="mx-4 mt-5 flex flex-col gap-2 border-y border-border py-5 sm:mx-8 sm:flex-row sm:items-center sm:justify-between lg:mx-10">
        <div><p className="font-label text-[0.58rem] text-primary/60">Your member house</p><h2 className="font-heading mt-1 text-2xl font-semibold">Good to see you, {firstName}.</h2></div>
        <p className="text-sm text-muted-foreground">Here’s the rest of your club at a glance.</p>
      </div>

      <section className="mx-4 mt-5 overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-[var(--shadow-card)] sm:mx-8 lg:mx-10">
        <div className="grid md:grid-cols-[minmax(0,.65fr)_minmax(0,1.35fr)]">
          <div className="bg-[var(--action-gold)] p-6 text-[var(--action-gold-foreground)] sm:p-7">
            <CheckCircle2 className="size-6" />
            <p className="font-label mt-5 text-current/65">Next for you</p>
            <h2 className="font-heading mt-2 text-3xl font-semibold">One useful next step.</h2>
          </div>
          <Link href={nextAction.href} className="group flex items-center gap-4 p-6 transition-colors hover:bg-muted/45 sm:p-7">
            <span className="min-w-0 flex-1">
              <span className="font-label block text-primary/70">{nextAction.eyebrow}</span>
              <strong className="font-heading mt-2 block text-2xl font-semibold text-foreground">{nextAction.title}</strong>
              <span className="mt-2 block text-base leading-7 text-muted-foreground">{nextAction.detail}</span>
              {nextAction.missingFields && nextAction.missingFields.length > 0 && (
                <span className="mt-4 flex flex-wrap gap-2" aria-label="Missing profile information">
                  {nextAction.missingFields.map((field) => (
                    <span key={field} className="rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1 text-xs font-semibold text-primary">
                      Missing: {field}
                    </span>
                  ))}
                </span>
              )}
            </span>
            <ArrowUpRight className="size-5 shrink-0 text-primary transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <OnboardingCard completed={onboarding} />

      <div className="mt-5 grid gap-5 px-4 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:px-10">
        <section className="overflow-hidden rounded-[1.5rem] border border-border bg-card">
          <div className="border-b border-border p-6 sm:p-7"><p className="font-label text-[0.6rem] text-primary/60">At a glance</p><h2 className="font-heading mt-1 text-3xl font-semibold">Your club life</h2></div>
          <Link href="/directory" className="group flex items-center gap-4 p-6 transition-colors hover:bg-muted/45">
            <span className="flex size-11 items-center justify-center rounded-full bg-[var(--rotary-gold)]/15 text-[#996000]"><Users className="size-5" /></span>
            <span className="min-w-0 flex-1"><span className="block text-xs text-muted-foreground">Club directory</span><strong className="font-heading mt-0.5 block text-2xl font-semibold">{members.length} people</strong><span className="mt-1 block text-xs text-muted-foreground">One shared purpose</span></span><ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
        </section>

        <section className="rounded-[1.5rem] border border-border bg-card p-6 sm:p-7">
          <div className="mb-5"><p className="font-label text-[0.6rem] text-primary/60">From around the club</p><h2 className="font-heading mt-1 text-3xl font-semibold">Club pulse</h2></div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-bold text-muted-foreground"><MessageCircle className="size-4" />Recent conversation</div>
              <div className="space-y-4">{latestMessages.map((message) => { const sender = members.find((member) => member.id === message.senderId); return <div key={message.id} className="flex gap-3"><MemberAvatar member={sender} className="size-8 shrink-0" /><div className="min-w-0"><p className="text-sm font-semibold">{sender?.name ?? "Former member"} <span className="font-normal text-muted-foreground">in {message.channel}</span></p><p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{message.body}</p></div></div>; })}{latestMessages.length === 0 && <p className="text-sm leading-6 text-muted-foreground">No club conversations yet. Be the first to say hello.</p>}</div>
              <Link href="/chat" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">Join the conversation <ArrowUpRight className="size-3" /></Link>
            </div>
            <div className="border-t border-border pt-5 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold text-muted-foreground"><HandHeart className="size-4" />Service opportunities</div>
              <div className="space-y-4">
                {openServiceProjects.map((project) => <div key={project.id}><p className="text-xs text-muted-foreground">{project.startsAt ? formatDate(project.startsAt) : "Date to be announced"}</p><p className="font-heading mt-1 text-lg font-semibold leading-snug">{project.title}</p><p className="mt-1 text-xs text-muted-foreground">{project.volunteerIds.length}{project.volunteerGoal ? ` of ${project.volunteerGoal}` : ""} volunteers</p></div>)}
                {openServiceProjects.length === 0 && <p className="text-xs leading-5 text-muted-foreground">No open service projects right now.</p>}
              </div>
              <Link href="/projects" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">Explore service <ArrowUpRight className="size-3" /></Link>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-5 flex items-center justify-between px-4 text-xs text-muted-foreground sm:px-8 lg:px-10"><span className="flex items-center gap-2"><CalendarDays className="size-3.5" />Rotary year 2026–27</span><span>Road Town · British Virgin Islands</span></div>
    </div>
  );
}
