import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/data/members";
import { getMyProjectSlots } from "@/lib/data/project-slots";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/page-container";
import { formatDateTime } from "@/lib/format";
export default async function MySlotsPage() {
  const member = await getCurrentMember(); if (!member) redirect("/login");
  const slots = (await getMyProjectSlots(member.id)).sort((a,b) => a.project_slots.starts_at.localeCompare(b.project_slots.starts_at));
  return <div><PageHeader title="My upcoming service slots" description="Your bookings and waitlist places, in date order."/><PageContainer className="max-w-4xl"><Link href="/projects" className="text-sm font-semibold text-primary">← All service projects</Link><ul className="mt-5 divide-y divide-border rounded-xl border border-border">{slots.map(row => <li key={row.slot_id} className="p-5"><Link href={`/projects/${row.project_slots.project_id}`} className="font-semibold text-primary">{row.project_slots.service_projects.title} · {row.project_slots.title}</Link><p className="mt-2 text-sm">{formatDateTime(row.project_slots.starts_at)} · {row.status === "waitlisted" ? "Waitlisted" : "Registered"}</p></li>)}</ul>{!slots.length&&<p className="mt-5 rounded-xl border border-dashed p-6">You have no upcoming service bookings. Choose a project to get involved.</p>}</PageContainer></div>;
}
