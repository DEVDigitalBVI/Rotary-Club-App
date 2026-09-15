import { getCurrentMember } from "@/lib/data/members";
import { getPersonalServiceRecord } from "@/lib/data/service-record";
import { serviceRecordCsv } from "@/lib/service-record";
export async function GET() {
  const member = await getCurrentMember();
  if (!member || member.status === "inactive") return new Response("Sign in to export your service record.", { status: 401 });
  const { entries, makeups } = await getPersonalServiceRecord(member.id, null);
  return new Response(serviceRecordCsv(entries, makeups), { headers: { "Content-Type": "text/csv;charset=utf-8", "Content-Disposition": 'attachment; filename="service-record-all-years.csv"', "Cache-Control": "private, no-store" } });
}
