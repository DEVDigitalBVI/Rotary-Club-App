import type { ClubRunnerMemberRow } from "./clubrunner-csv";
export type RosterRow = { name: string; email: string; phone: string | null; classification: string | null; join_date: string | null; status: "active" | "inactive" | "honorary" };
export function planRosterImport(rows: ClubRunnerMemberRow[], existing: RosterRow[]) {
  const byEmail = new Map(existing.map(row => [row.email.toLowerCase(), row]));
  return rows.map(row => {
    const before = byEmail.get(row.email);
    const after: RosterRow = { name: row.name, email: before?.email ?? row.email, phone: row.phone ?? before?.phone ?? null, classification: row.classification ?? before?.classification ?? null, join_date: row.joinDate ?? before?.join_date ?? null, status: before?.status ?? "active" };
    const changes = (Object.keys(after) as (keyof RosterRow)[]).filter(key => before?.[key] !== after[key]).map(field => ({ field, before: before?.[field] ?? "", after: after[field] ?? "" }));
    return { name: row.name, email: row.email, kind: !before ? "added" : changes.length ? "changed" : "unchanged", changes, after };
  });
}
