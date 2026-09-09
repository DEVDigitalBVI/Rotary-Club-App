import { isProjectSlotWorkflowReady } from "@/lib/data/project-slots";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPendingMakeups } from "@/lib/data/attendance";
import { PendingMakeups } from "@/components/account/pending-makeups";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/page-container";
export default async function MakeupsPage() {
  const db = await createClient();
  const { data, error } = await db.rpc("can_assign_roles");
  if (error || !data) redirect("/projects");
  if (!await isProjectSlotWorkflowReady()) return <PageHeader title="Meeting makeups" description="Project attendance and makeup tracking are being set up." />;
  const makeups = await getPendingMakeups();
  return <div><PageHeader title="Meeting makeups" description="Enter these makeups in ClubRunner, then mark them logged. If attendance was corrected, remove the makeup in ClubRunner and mark the correction done." /><PageContainer><PendingMakeups makeups={makeups} /></PageContainer></div>;
}
