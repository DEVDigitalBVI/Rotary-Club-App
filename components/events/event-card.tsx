import Link from "next/link";
import { CalendarDays, MapPin, Users, Video } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RsvpStatusBadge } from "@/components/rsvp-badge";
import { formatDate } from "@/lib/format";
import type { EventItem } from "@/lib/mock-data";

export function EventCard({ event }: { event: EventItem }) {
  const peopleGoing = event.rsvps.yes + (event.rsvps.guests ?? 0);

  return (
    <Link href={`/events/${event.id}`}>
      <Card className="h-full transition-shadow hover:shadow-[var(--shadow-card-hover)]">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            {/* A poster is the fastest way to recognise an event in a list. */}
            {event.flyer && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={event.flyer.url}
                alt=""
                aria-hidden="true"
                className="aspect-[3/4] w-14 shrink-0 rounded-md border border-border object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-heading text-sm font-semibold text-foreground">
                {event.title}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" />
                {formatDate(event.date)} · {event.time}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                {event.isVirtual ? (
                  <Video className="size-3.5" />
                ) : (
                  <MapPin className="size-3.5" />
                )}
                {event.location}
              </p>
            </div>
            <RsvpStatusBadge status={event.myRsvp} />
          </div>

          {event.speaker && (
            <p className="text-xs text-muted-foreground">
              Speaker: <span className="text-foreground">{event.speaker.name}</span> —{" "}
              {event.speaker.topic}
            </p>
          )}

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5" />
            {event.attendance
              ? `${event.attendance.present} attended`
              : `${peopleGoing} going · ${event.rsvps.maybe} maybe`}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
