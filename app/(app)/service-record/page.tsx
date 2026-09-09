import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/data/members";
import { getPersonalServiceRecord } from "@/lib/data/service-record";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/page-container";
import { PersonalServiceRecord } from "@/components/service/personal-service-record";

export default async function ServiceRecordPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/login");
  const record = await getPersonalServiceRecord(member.id);
  return <div><PageHeader title="Your service record." description="The time you’ve given. The projects you’ve been part of." /><PageContainer><PersonalServiceRecord {...record} memberName={member.name} /></PageContainer></div>;
}
