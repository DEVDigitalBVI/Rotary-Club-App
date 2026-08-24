import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = (name: string) =>
  readFileSync(resolve(process.cwd(), "supabase/migrations", name), "utf8")
    .replace(/--.*$/gm, "")
    .replace(/\s+/g, " ")
    .toLowerCase();

describe("active-member access migration", () => {
  const sql = migration("20260823090000_require_active_club_member.sql");

  it.each([
    "members",
    "committees",
    "committee_members",
    "events",
    "event_rsvps",
    "news_posts",
    "event_attendance",
  ])("protects %s reads with the active-member helper", (table) => {
    expect(sql).toContain(`on ${table} for select to authenticated using (is_active_club_member())`);
  });

  it("admits active and honorary members but not inactive members", () => {
    expect(sql).toContain("status in ('active', 'honorary')");
    expect(sql).not.toContain("status in ('active', 'inactive', 'honorary')");
  });
});

describe("attendance finalization migration", () => {
  const sql = migration("20260823093000_finalize_attendance_and_atomic_rosters.sql");

  it("authorizes attendance writes and records an explicit finalized state", () => {
    expect(sql).toContain("if not can_assign_roles() then");
    expect(sql).toContain("attendance_taken_at = now()");
    expect(sql).toContain("from event_attendance where event_id = target_event_id");
  });

  it("keeps the RPC unavailable to anonymous callers", () => {
    expect(sql).toContain("revoke execute on function set_event_attendance(uuid, uuid[]) from anon");
    expect(sql).toContain("grant execute on function set_event_attendance(uuid, uuid[]) to authenticated");
  });
});

describe("committee roster invariant migration", () => {
  const sql = migration("20260823100000_preserve_committee_director.sql");

  it("rejects a replacement roster that omits its assigned director", () => {
    const guard = sql.indexOf("committee director must remain on roster");
    const deletion = sql.indexOf("delete from committee_members");

    expect(sql).toContain("if not can_manage_committee(target_committee_id) then");
    expect(sql).toContain("director_id = any(coalesce(member_ids, '{}'::uuid[]))");
    expect(guard).toBeGreaterThan(-1);
    expect(deletion).toBeGreaterThan(guard);
  });
});

describe("role assignment migration", () => {
  const sql = migration("20260821230000_role_assignment.sql");

  it("authorizes every privileged role mutation in the database", () => {
    expect(sql).toContain("if not is_president() then");
    expect(sql).toContain("elsif not can_assign_roles() then");
    expect(sql.match(/if not can_assign_roles\(\) then/g)).toHaveLength(3);
  });
});
