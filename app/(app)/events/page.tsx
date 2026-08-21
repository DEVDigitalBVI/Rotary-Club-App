import { PageHeader } from "@/components/page-header";
import { EventCard } from "@/components/events/event-card";
import { CreateEventDialog } from "@/components/events/create-event-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getEvents } from "@/lib/data/events";
import { getCurrentMember } from "@/lib/data/members";
import { getCommittees } from "@/lib/data/committees";
import { canManageEvents } from "@/lib/mock-data";
import { todayDateString } from "@/lib/format";

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
        actions={mayManage ? <CreateEventDialog /> : undefined}
      />

      <div className="p-4 sm:p-8">
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
            </div>
          </TabsContent>
          <TabsContent value="past" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {past.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
