import { MyRotary } from "@/components/dashboard/my-rotary";
import { getMyRotaryActivity } from "@/lib/data/my-rotary";
import { getCommittees } from "@/lib/data/committees";
import { rotaryYear, upcomingEvents } from "@/lib/my-rotary";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Clock3, MapPin, MessageCircle, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/member-avatar";
import { BirthdayBanner } from "@/components/dashboard/birthday-banner";
import { formatDate, todayDateString, todayMonthDay } from "@/lib/format";
import { getCurrentMember, getMembers } from "@/lib/data/members";
import { getVisibleNewsPosts } from "@/lib/data/news";
import { getEvents } from "@/lib/data/events";
import { getCompletedOnboarding, getOnboardingTaskHref, onboardingTasks, type OnboardingKey } from "@/lib/data/onboarding";
import { OnboardingCard } from "@/components/dashboard/onboarding-card";
import { EventFlyerPreview } from "@/components/dashboard/event-flyer-preview";
import { NoticeAcknowledgement } from "@/components/news/notice-acknowledgement";
import { getServiceProjects } from "@/lib/data/projects";
import { getLatestChatPreview } from "@/lib/data/chat";
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
  const viewerPromise = getCurrentMember();
  const [viewer, members, newsPosts, events, serviceProjects, committees, latestMessages, personalActivity, onboarding] = await Promise.all([
    viewerPromise, getMembers(), getVisibleNewsPosts(), getEvents(), getServiceProjects(), getCommittees(),
    getLatestChatPreview(),
    viewerPromise.then(member => member ? getMyRotaryActivity(member.id) : null),
    viewerPromise.then(member => member ? getCompletedOnboarding(member.id) : [] as OnboardingKey[]),
  ]);
  const birthdaysToday = members.filter(
    (member) => member.dateOfBirth?.slice(5) === todayMonthDay()
  );
  const today = todayDateString();
  const upcoming = upcomingEvents(events);
  const nextEvent = upcoming[0];
  const nextEventAttending = nextEvent
    ? nextEvent.rsvps.yes + (nextEvent.rsvps.guests ?? 0)
    : 0;
  const clubNotices = newsPosts.filter((post) => post.source === "club");
  const latestNotices = (clubNotices.length > 0 ? clubNotices : newsPosts).slice(0, 3);
  const openServiceProjects = serviceProjects.filter((project) => project.status === "open").slice(0, 2);
  const firstName = viewer?.name.split(" ")[0] ?? "friend";
  const date = nextEvent ? eventDateParts(nextEvent.date) : null;
  const nextOnboardingTask = onboardingTasks.find((task) => !onboarding.includes(task.key) && (task.key !== "first-event" || upcoming.length > 0) && (task.key !== "first-project" || openServiceProjects.length > 0));
  const missingProfileFields = getMissingMemberProfileFields(viewer);
  const noticeNeedingAction = clubNotices.find((notice) => notice.requiresAcknowledgement && !notice.acknowledgedAt);
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
    <div className="mx-auto w-full max-w-[1400px] pb-8">
      <header className="px-4 pb-6 pt-7 sm:px-8 lg:px-10">
        <p className="font-label mb-2 text-primary">Rotary Club of Road Town</p>
        <h1 className="font-heading text-4xl font-semibold sm:text-5xl">My <span className="text-primary">Rotary.</span></h1>
        <p className="mt-3 text-base text-muted-foreground">Good to see you, {firstName}. Here’s what’s next.</p>
      </header>

      {nextAction.eyebrow === "You’re all caught up" ? <p className="mx-4 mb-5 rounded-xl border border-border bg-card px-5 py-3 text-sm text-muted-foreground sm:mx-8 lg:mx-10"><span className="font-semibold text-foreground">You’re all caught up.</span> Nothing needs your attention.</p> : <>
          <Link href={nextAction.href} className="group mx-4 mb-5 block rounded-2xl sm:mx-8 lg:mx-10 border border-primary/20 bg-card px-5 py-4">
            <p className="font-label text-primary">{nextAction.eyebrow}</p>
            <h2 className="font-heading mt-2 flex items-start justify-between gap-3 text-2xl font-semibold">{nextAction.title}<ArrowUpRight className="mt-1 size-5 shrink-0 text-primary" /></h2>
            <p className="mt-2 text-base leading-6 text-muted-foreground">{nextAction.detail}</p>
            {nextAction.missingFields && <p className="mt-3 text-sm text-muted-foreground">Missing: {nextAction.missingFields.join(", ")}</p>}
          </Link>
      </>}
      <div className="grid items-start gap-5 px-4 sm:px-8 lg:grid-cols-[1.3fr_1fr] lg:px-10">
        <section className="overflow-hidden rounded-2xl bg-[var(--feature-surface)] p-5 text-white sm:p-7">
          <p className="font-label flex items-center gap-2 text-white/85"><CalendarDays className="size-4 text-[var(--rotary-gold)]" />Next event</p>
          {nextEvent && date ? <>
            <div className="mt-5 flex items-start gap-4">
              <div className="shrink-0 rounded-xl bg-[var(--rotary-gold)] px-4 py-3 text-center text-[var(--action-gold-foreground)]"><span className="block text-sm font-semibold">{date.month}</span><span className="font-heading text-3xl font-bold">{date.day}</span></div>
              <div className="min-w-0"><h2 className="font-heading text-3xl font-semibold leading-tight">{nextEvent.title}</h2><p className="mt-2 text-sm text-white/85">{formatDate(nextEvent.date)}</p></div>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/85"><span className="flex items-center gap-2"><Clock3 className="size-4" />{nextEvent.time}</span><span className="flex items-center gap-2"><MapPin className="size-4" />{nextEvent.location}</span></div>
            {nextEvent.speaker && <p className="mt-3 text-base text-white/85">{nextEvent.speaker.name} · {nextEvent.speaker.topic}</p>}
            {nextEvent.flyer && <div className="mt-4 max-w-32"><EventFlyerPreview flyer={nextEvent.flyer} eventTitle={nextEvent.title} /></div>}
            <div className="mt-5 flex flex-wrap items-center gap-3"><Button nativeButton={false} render={<Link href={`/events/${nextEvent.id}`} />} className="h-11 bg-white text-[var(--feature-surface)] hover:bg-[var(--rotary-gold)]">{nextEvent.myRsvp === "none" ? "View event & RSVP" : "View your RSVP"}<ArrowUpRight /></Button><span className="text-sm text-white/85">{nextEvent.myRsvp === "yes" ? (nextEvent.registration?.status === "waitlisted" ? "You’re waitlisted" : "You’re going") : nextEvent.myRsvp === "maybe" ? "Your RSVP: Maybe" : nextEvent.myRsvp === "no" ? "You’re not going" : `${nextEventAttending} attending`}</span></div>
          </> : <>
            <h2 className="font-heading mt-4 text-2xl font-semibold">The calendar is open.</h2>
            <p className="mt-2 text-base leading-6 text-white/85">New meetings and events will appear here when scheduled.</p>
            <Link href="/events" className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--rotary-gold)] hover:underline">Open club calendar <ArrowUpRight className="size-4" /></Link>
          </>}
        </section>
        <div className="space-y-4">
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3"><h2 className="font-heading flex items-center gap-2 text-2xl font-semibold"><Newspaper className="size-4 text-primary" />Club notices</h2><Link href="/news" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline">View all</Link></div>
            {personalActivity && personalActivity.unreadNoticeCount > 0 && <Link href="/notifications" className="mb-2 inline-flex min-h-11 items-center text-sm font-semibold text-primary">{personalActivity.unreadNoticeCount} unread in your inbox <ArrowUpRight className="ml-1 size-4" /></Link>}
            <div className="divide-y divide-border">{latestNotices.slice(0, 2).map(notice => <article key={notice.id} className="py-3"><p className="text-sm text-muted-foreground">{notice.priority === "urgent" ? "Urgent · " : ""}{formatDate(notice.date)}</p><Link href="/news" className="mt-1 block text-base font-semibold hover:underline">{notice.title}</Link><p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{notice.body}</p>{notice.requiresAcknowledgement && notice.source === "club" && <div className="mt-3"><NoticeAcknowledgement postId={notice.id} acknowledgedAt={notice.acknowledgedAt} compact /></div>}</article>)}</div>
            {latestNotices.length === 0 && <p className="text-sm leading-6 text-muted-foreground">You’re caught up. New club updates will appear here.</p>}
          </section>
        </div>
      </div>
      {viewer && personalActivity && <MyRotary member={viewer} committees={committees} events={events.filter(event => event.id !== nextEvent?.id)} projects={serviceProjects} activity={personalActivity} />}
      <BirthdayBanner viewerId={viewer?.id} birthdays={birthdaysToday} />
      <OnboardingCard completed={onboarding} />
      <div className="mx-4 mt-5 rounded-2xl border border-border bg-card p-5 sm:mx-8 lg:mx-10">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-heading text-xl font-semibold">Stay connected</h2><Link href="/directory" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary">Meet the {members.length === 1 ? "club member" : `${members.length} members`} <ArrowUpRight className="ml-1 size-4" /></Link></div>
        {latestMessages.slice(0, 1).map(message => <div key={message.id} className="my-3 flex items-start gap-3"><MemberAvatar member={members.find(member => member.id === message.senderId)} className="size-9" /><div><p className="text-sm font-semibold">{message.channel}</p><p className="line-clamp-2 text-sm text-muted-foreground">{message.body}</p></div></div>)}
        <div className="flex flex-wrap gap-x-6 gap-y-2"><Link href="/chat" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"><MessageCircle className="size-4" />Open conversations</Link><Link href="/feedback" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary">Share an idea <ArrowUpRight className="ml-1 size-4" /></Link></div>
      </div>
      <p className="px-4 pt-5 text-sm text-muted-foreground sm:px-8 lg:px-10">Rotary year {rotaryYear(today).label} · Road Town, British Virgin Islands</p>
    </div>
  );
}
