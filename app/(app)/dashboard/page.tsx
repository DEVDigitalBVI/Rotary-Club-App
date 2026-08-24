import Link from "next/link";
import { ArrowUpRight, CalendarDays, ChevronRight, Clock3, MapPin, MessageCircle, Newspaper, Sparkles, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/member-avatar";
import { BirthdayBanner } from "@/components/dashboard/birthday-banner";
import { currentMember, channels, members, balanceForMember, overdueBalanceForMember } from "@/lib/mock-data";
import { formatCurrency, formatDate, todayDateString } from "@/lib/format";
import { getCurrentMember, getTodaysBirthdays } from "@/lib/data/members";
import { getVisibleNewsPosts } from "@/lib/data/news";
import { getEvents } from "@/lib/data/events";

function eventDateParts(date: string) {
  const value = new Date(`${date}T12:00:00Z`);
  return {
    month: value.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
    day: value.toLocaleDateString("en-US", { day: "2-digit", timeZone: "UTC" }),
  };
}

export default async function DashboardPage() {
  const [viewer, birthdaysToday, newsPosts, events] = await Promise.all([
    getCurrentMember(),
    getTodaysBirthdays(),
    getVisibleNewsPosts(),
    getEvents(),
  ]);
  const today = todayDateString();
  const upcoming = events.filter((event) => event.date >= today).sort((a, b) => (a.date < b.date ? -1 : 1));
  const nextEvent = upcoming[0];
  const laterEvents = upcoming.slice(1, 4);
  const balance = balanceForMember(currentMember.id);
  const overdue = overdueBalanceForMember(currentMember.id);
  const latestMessages = channels.flatMap((channel) => channel.messages.map((message) => ({ ...message, channel: channel.name }))).sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)).slice(0, 2);
  const latestNews = newsPosts.slice(0, 2);
  const firstName = currentMember.name.split(" ")[0];
  const date = nextEvent ? eventDateParts(nextEvent.date) : null;

  return (
    <div className="mx-auto w-full max-w-[1500px] pb-10">
      <header className="rise-in px-4 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-10 lg:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-label mb-3 text-[0.63rem] text-primary/65">What’s happening · Road Town</p>
            <h1 className="font-heading max-w-3xl text-[2.6rem] font-semibold leading-[0.95] text-foreground sm:text-6xl">
              Latest club <span className="text-primary">events.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">Meetings, service projects, and the moments bringing us together.</p>
          </div>
          <div className="hidden items-center gap-3 pb-1 lg:flex">
            <div className="flex -space-x-2.5">{members.slice(0, 5).map((member) => <MemberAvatar key={member.id} member={member} className="size-9 border-2 border-background" />)}</div>
            <p className="text-xs leading-4 text-muted-foreground"><strong className="block text-foreground">{members.length} members</strong>serving the BVI</p>
          </div>
        </div>
      </header>

      <div className="grid gap-5 px-4 sm:px-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(19rem,.75fr)] lg:px-10">
        {nextEvent && date && (
          <section className="rise-in rise-in-delay-1 relative min-h-[28rem] overflow-hidden rounded-[1.75rem] bg-[#123b67] text-white shadow-[0_30px_70px_-38px_rgba(13,49,91,.8)]">
            <div className="absolute -right-24 -top-20 size-80 rounded-full border-[70px] border-white/[0.035]" />
            <div className="absolute -bottom-24 right-1/4 size-64 rounded-full bg-[var(--rotary-gold)]/10 blur-2xl" />
            <div className="relative flex h-full min-h-[28rem] flex-col justify-between p-6 sm:p-9">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-semibold backdrop-blur"><Sparkles className="size-3.5 text-[var(--rotary-gold)]" />Next gathering</div>
                <div className="min-w-16 rounded-2xl bg-[var(--rotary-gold)] px-3 py-2 text-center text-[#183453] shadow-lg"><span className="font-label block text-[0.58rem]">{date.month}</span><span className="font-heading block text-3xl font-bold leading-none">{date.day}</span></div>
              </div>
              <div className="max-w-2xl">
                <p className="font-label mb-3 text-[0.62rem] text-white/50">Club programme</p>
                <h2 className="font-heading text-4xl font-semibold leading-[1.02] sm:text-6xl">{nextEvent.title}</h2>
                {nextEvent.speaker && <p className="mt-4 max-w-xl text-sm leading-6 text-white/65 sm:text-base"><span className="text-white">{nextEvent.speaker.name}</span> on {nextEvent.speaker.topic}.</p>}
                <div className="mt-7 flex flex-col gap-3 border-t border-white/15 pt-5 text-sm text-white/72 sm:flex-row sm:items-center sm:gap-7">
                  <span className="flex items-center gap-2"><Clock3 className="size-4 text-[var(--rotary-gold)]" />{nextEvent.time}</span>
                  <span className="flex items-center gap-2"><MapPin className="size-4 text-[var(--rotary-gold)]" />{nextEvent.location}</span>
                </div>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Button className="h-11 rounded-full bg-white px-5 font-semibold text-[#123b67] hover:bg-[var(--rotary-gold)]" nativeButton={false} render={<Link href={`/events/${nextEvent.id}`} />}>View gathering <ArrowUpRight className="size-4" /></Button>
                  <p className="text-xs text-white/50">{nextEvent.rsvps.yes} members attending</p>
                </div>
              </div>
            </div>
          </section>
        )}

        <aside className="rise-in rise-in-delay-2 flex flex-col overflow-hidden rounded-[1.75rem] border border-border bg-card">
          <div className="border-b border-border p-6"><p className="font-label text-[0.62rem] text-primary/60">On the calendar</p><h2 className="font-heading mt-2 text-3xl font-semibold">Coming up</h2></div>
          <div className="flex-1 divide-y divide-border px-6">
            {laterEvents.map((event) => {
              const parts = eventDateParts(event.date);
              return <Link key={event.id} href={`/events/${event.id}`} className="group grid grid-cols-[2.75rem_1fr_auto] items-center gap-3 py-5"><span className="text-center"><span className="font-label block text-[0.52rem] text-primary/60">{parts.month}</span><span className="font-heading block text-2xl font-semibold leading-none">{parts.day}</span></span><span className="min-w-0"><strong className="block text-sm font-semibold leading-snug">{event.title}</strong><span className="mt-1 block truncate text-xs text-muted-foreground">{event.time}</span></span><ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></Link>;
            })}
          </div>
          <Link href="/events" className="flex items-center justify-between bg-[#e6a51c] p-6 text-sm font-bold text-[#183453] transition-colors hover:bg-[var(--rotary-gold)]">Explore all events <ArrowUpRight className="size-4" /></Link>
        </aside>
      </div>

      <BirthdayBanner viewerId={viewer?.id} birthdays={birthdaysToday} />

      <div className="mx-4 mt-5 flex flex-col gap-2 border-y border-border py-5 sm:mx-8 sm:flex-row sm:items-center sm:justify-between lg:mx-10">
        <div><p className="font-label text-[0.58rem] text-primary/60">Your member house</p><h2 className="font-heading mt-1 text-2xl font-semibold">Good to see you, {firstName}.</h2></div>
        <p className="text-sm text-muted-foreground">Here’s the rest of your club at a glance.</p>
      </div>

      <div className="mt-5 grid gap-5 px-4 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:px-10">
        <section className="overflow-hidden rounded-[1.5rem] border border-border bg-card">
          <div className="border-b border-border p-6 sm:p-7"><p className="font-label text-[0.6rem] text-primary/60">At a glance</p><h2 className="font-heading mt-1 text-3xl font-semibold">Your club life</h2></div>
          <Link href="/account" className="group flex items-center gap-4 border-b border-border p-6 transition-colors hover:bg-muted/45">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/8 text-primary"><Wallet className="size-5" /></span>
            <span className="min-w-0 flex-1"><span className="block text-xs text-muted-foreground">Account balance</span><strong className="font-heading mt-0.5 block text-2xl font-semibold">{formatCurrency(balance)}</strong><span className={`mt-1 block text-xs ${overdue > 0 ? "text-destructive" : "text-muted-foreground"}`}>{overdue > 0 ? `${formatCurrency(overdue)} overdue` : "You’re all paid up"}</span></span><ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
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
              <div className="space-y-4">{latestMessages.map((message) => { const sender = members.find((member) => member.id === message.senderId); return <div key={message.id} className="flex gap-3"><MemberAvatar member={sender} className="size-8 shrink-0" /><div className="min-w-0"><p className="text-xs font-semibold">{sender?.name} <span className="font-normal text-muted-foreground">in {message.channel}</span></p><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{message.body}</p></div></div>; })}</div>
              <Link href="/chat" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">Join the conversation <ArrowUpRight className="size-3" /></Link>
            </div>
            <div className="border-t border-border pt-5 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold text-muted-foreground"><Newspaper className="size-4" />Latest notices</div>
              <div className="space-y-4">{latestNews.map((post) => <div key={post.id}><p className="text-xs text-muted-foreground">{formatDate(post.date)}</p><p className="font-heading mt-1 text-lg font-semibold leading-snug">{post.title}</p></div>)}</div>
              <Link href="/news" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">Read all notices <ArrowUpRight className="size-3" /></Link>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-5 flex items-center justify-between px-4 text-xs text-muted-foreground sm:px-8 lg:px-10"><span className="flex items-center gap-2"><CalendarDays className="size-3.5" />Rotary year 2026–27</span><span>Road Town · British Virgin Islands</span></div>
    </div>
  );
}
