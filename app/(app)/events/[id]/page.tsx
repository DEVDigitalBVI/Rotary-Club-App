import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, MapPin, Mic, Video } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MemberAvatar } from "@/components/member-avatar";
import { RsvpControl } from "@/components/events/rsvp-control";
import { EventMaterials } from "@/components/events/event-materials";
import { TakeAttendanceDialog } from "@/components/events/take-attendance-dialog";
import { getEventById } from "@/lib/data/events";
import { getCurrentMember, getMembers } from "@/lib/data/members";
import { getCommittees } from "@/lib/data/committees";
import { getEventAttendance } from "@/lib/data/attendance";
import { canManageEvents, canAssignRoles } from "@/lib/mock-data";
import { formatDate, todayDateString } from "@/lib/format";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [event, members, currentMember, committees, attendanceRecord] = await Promise.all([
    getEventById(id),
    getMembers(),
    getCurrentMember(),
    getCommittees(),
    getEventAttendance(id),
  ]);
  if (!event) notFound();

  const isAdmin = currentMember?.role === "admin";
  const mayManage = currentMember ? canManageEvents(currentMember, committees) : false;
  const mayTakeAttendance = currentMember ? canAssignRoles(currentMember) : false;
  const isUpcoming = event.date >= todayDateString();

  // Real attendance (once taken) supersedes the RSVP-based "who's coming"
  // guess it's derived from before the meeting happens.
  const attendanceTaken = attendanceRecord.finalized;
  const attendeeIdsToShow = attendanceTaken
    ? attendanceRecord.attendeeIds
    : (event.attendeeIds ?? []);
  const attendees = attendeeIdsToShow
    .map((mid) => members.find((m) => m.id === mid))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  return (
    <div className="p-4 sm:p-8">
      <Link
        href="/events"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to events
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <h1 className="font-heading text-2xl font-semibold text-foreground">
                {event.title}
              </h1>

              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <CalendarDays className="size-4" />
                  {formatDate(event.date, { weekday: "long" })}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="size-4" />
                  {event.time}
                </span>
                <span className="flex items-center gap-2">
                  {event.isVirtual ? (
                    <Video className="size-4" />
                  ) : (
                    <MapPin className="size-4" />
                  )}
                  {event.location}
                </span>
                {event.speaker && (
                  <span className="flex items-center gap-2">
                    <Mic className="size-4" />
                    {event.speaker.name} — {event.speaker.topic}
                  </span>
                )}
              </div>

              <p className="font-body text-sm leading-relaxed text-foreground">
                {event.description}
              </p>

              {event.rsvpDeadline && (
                <p className="text-xs text-muted-foreground">
                  Please RSVP by {formatDate(event.rsvpDeadline)}.
                </p>
              )}
            </CardContent>
          </Card>

          {currentMember && (
            <Card>
              <CardContent>
                <RsvpControl
                  eventId={event.id}
                  memberId={currentMember.id}
                  initial={event.myRsvp}
                />
              </CardContent>
            </Card>
          )}

          <EventMaterials
            eventId={event.id}
            flyer={event.flyer}
            agenda={event.agenda}
            canManage={mayManage}
            showAgenda={isUpcoming}
          />
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardContent>
              <h2 className="font-heading text-sm font-semibold text-foreground">
                {event.attendance ? "Attendance" : "RSVPs"}
              </h2>
              {event.attendance ? (
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {event.attendance.present}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    / {event.attendance.total} attended
                  </span>
                </p>
              ) : (
                <div className="mt-3 flex flex-col gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Going</span>
                    <span className="font-medium text-foreground">{event.rsvps.yes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Maybe</span>
                    <span className="font-medium text-foreground">{event.rsvps.maybe}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Not going</span>
                    <span className="font-medium text-foreground">{event.rsvps.no}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {mayTakeAttendance && event.countsTowardAttendance && (
            <Card>
              <CardContent>
                <TakeAttendanceDialog
                  eventId={event.id}
                  members={members}
                  attendeeIds={attendanceRecord.attendeeIds}
                />
              </CardContent>
            </Card>
          )}

          {isAdmin && attendees.length > 0 && (
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-sm font-semibold text-foreground">
                    {attendanceTaken ? "Attendees" : "Confirmed so far"}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {attendees.length}
                  </span>
                </div>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {attendees.map((m) => (
                    <li key={m.id} className="flex items-center gap-2">
                      <MemberAvatar
                        member={m}
                        className="size-7"
                        fallbackClassName="text-[0.6rem]"
                      />
                      <span className="text-sm text-foreground">{m.name}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
