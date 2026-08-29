import { PageHeader } from "@/components/page-header";
import { EventCard } from "@/components/events/event-card";
import { CreateEventDialog } from "@/components/events/create-event-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getEvents } from "@/lib/data/events";
import { getCurrentMember } from "@/lib/data/members";
import { getCommittees } from "@/lib/data/committees";
import { canManageEvents } from "@/lib/mock-data";
import { todayDateString } from "@/lib/format";
import { PageContainer } from "@/components/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarDays, Download, History } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function EventsPage() {
  const [events, currentMember, committees] = await Promise.all([
    getEvents(),
    getCurrentMember(),
    getCommittees(),
  ]);
  const mayManage = currentMember ? canManageEvents(currentMember, committees) : false;
  const today = todayDateString();

  const upcoming = [...events]
    .filter((e) => e.date >= today)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const past = [...events]
    .filter((e) => e.date < today)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div>
      <PageHeader
        title="Events"
        description="Meetings and events, and your RSVP status."
        actions={
          <>
            {events.length > 0 && (
              <Button variant="outline" nativeButton={false} render={<Link href="/events/calendar.ics" />}>
                <Download />Calendar file
              </Button>
            )}
            {mayManage && events.length > 0 && <CreateEventDialog />}
          </>
        }
      />

      <PageContainer>
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
              {upcoming.length === 0 && <EmptyState icon={CalendarDays} title="No upcoming events" description={mayManage ? "Schedule the next gathering so members can plan ahead and RSVP." : "There isn’t another club gathering scheduled yet. Check back after the programme is updated."} action={mayManage ? <CreateEventDialog /> : undefined} />}
            </div>
          </TabsContent>
          <TabsContent value="past" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {past.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
              {past.length === 0 && <EmptyState icon={History} title="No past events" description="Completed meetings and service events will appear here for future reference." />}
            </div>
          </TabsContent>
        </Tabs>
      </PageContainer>
    </div>
  );
}
