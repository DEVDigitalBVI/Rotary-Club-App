import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Users, Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { RsvpStatusBadge } from "@/components/rsvp-badge";
import { NewsSourceBadge } from "@/components/news-source-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  currentMember,
  events,
  channels,
  members,
  newsPosts,
  balanceForMember,
} from "@/lib/mock-data";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

export default function DashboardPage() {
  const upcoming = events
    .filter((e) => new Date(e.date) >= new Date("2026-08-17"))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(0, 3);

  const balance = balanceForMember(currentMember.id);

  const latestMessages = channels
    .flatMap((c) => c.messages.map((m) => ({ ...m, channel: c.name })))
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
    .slice(0, 3);

  const latestNews = newsPosts.slice(0, 3);

  const firstName = currentMember.name.split(" ")[0];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Here's what's happening in the club."
      />

      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-8 lg:grid-cols-3">
        {/* Balance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="size-4" />
              My Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-semibold text-foreground">
              {formatCurrency(Math.abs(balance))}
            </p>
            <StatusBadge tone={balance > 0 ? "cardinal" : "grass"} className="mt-2">
              {balance > 0 ? "Balance owed" : balance < 0 ? "Credit on account" : "Paid up"}
            </StatusBadge>
            <Button
              variant="link"
              className="mt-2 h-auto p-0 font-heading"
              nativeButton={false}
              render={<Link href="/account" />}
            >
              View account <ArrowRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming events */}
        <Card className="sm:col-span-2 sm:row-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="size-4" />
              Upcoming events
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {upcoming.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:opacity-80"
              >
                <div className="min-w-0">
                  <p className="font-heading truncate text-sm font-medium text-foreground">
                    {event.title}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{formatDate(event.date)}</span>
                    <span>·</span>
                    <span className="truncate">{event.time}</span>
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" />
                    <span className="truncate">{event.location}</span>
                  </p>
                </div>
                <RsvpStatusBadge status={event.myRsvp} />
              </Link>
            ))}
            <Button
              variant="link"
              className="mt-1 h-auto justify-start p-0 font-heading"
              nativeButton={false}
              render={<Link href="/events" />}
            >
              View all events <ArrowRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* Directory quick link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Users className="size-4" />
              Directory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex -space-x-2">
              {members.slice(0, 6).map((m) => (
                <Avatar key={m.id} className="size-8 border-2 border-card">
                  <AvatarFallback
                    className="text-[0.65rem] font-semibold text-white"
                    style={{ backgroundColor: m.avatarColor }}
                  >
                    {m.initials}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {members.length} members in the club
            </p>
            <Button
              variant="link"
              className="mt-1 h-auto p-0 font-heading"
              nativeButton={false}
              render={<Link href="/directory" />}
            >
              Browse directory <ArrowRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* Latest chat */}
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">Recent messages</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {latestMessages.map((m) => {
              const sender = members.find((mem) => mem.id === m.senderId);
              return (
                <div key={m.id} className="flex items-start gap-2">
                  <Avatar className="size-7 shrink-0">
                    <AvatarFallback
                      className="text-[0.6rem] font-semibold text-white"
                      style={{ backgroundColor: sender?.avatarColor }}
                    >
                      {sender?.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">
                      {sender?.name}{" "}
                      <span className="font-normal text-muted-foreground">
                        in {m.channel}
                      </span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{m.body}</p>
                  </div>
                </div>
              );
            })}
            <Button
              variant="link"
              className="h-auto justify-start p-0 font-heading"
              nativeButton={false}
              render={<Link href="/chat" />}
            >
              Open chat <ArrowRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* Latest news */}
        <Card className="sm:col-span-2">
          <CardHeader>
            <CardTitle className="text-muted-foreground">Latest news</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {latestNews.map((post) => (
              <div key={post.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <NewsSourceBadge source={post.source} />
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(post.date)}
                  </span>
                </div>
                <p className="font-heading mt-1 text-sm font-medium text-foreground">
                  {post.title}
                </p>
              </div>
            ))}
            <Button
              variant="link"
              className="mt-1 h-auto justify-start p-0 font-heading"
              nativeButton={false}
              render={<Link href="/news" />}
            >
              View all news <ArrowRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
