import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/data/members";
import { getPersonalServiceRecord } from "@/lib/data/service-record";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/page-container";
import { PersonalServiceRecord } from "@/components/service/personal-service-record";

export default async function ServiceRecordPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const member = await getCurrentMember();
  if (!member) redirect("/login");
  const record = await getPersonalServiceRecord(member.id, (await searchParams).year);
  return <div><PageHeader title="Your service record." description="The time you’ve given. The projects you’ve been part of." /><PageContainer><PersonalServiceRecord key={record.selectedYear} {...record} memberName={member.name} /></PageContainer></div>;
}
