import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/page-container";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { NotificationPreferencesForm } from "@/components/notifications/notification-preferences";
import { getNotificationPreferences } from "@/lib/data/notifications";

export default async function NotificationsPage() {
  const preferences = await getNotificationPreferences();
  return <div><PageHeader title="Notifications" description="Recent club activity and the updates you’ve chosen to receive." /><PageContainer className="grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,.75fr)]"><NotificationCenter /><NotificationPreferencesForm initial={preferences} /></PageContainer></div>;
}
