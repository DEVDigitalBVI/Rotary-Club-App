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

describe("active signup and assigned-member integrity migration", () => {
  const sql = migration("20260823103000_active_signup_and_director_integrity.sql");

  it("limits new logins to unclaimed active or honorary roster records", () => {
    expect(sql).toContain("lower(email) = lower(trim(target_email))");
    expect(sql).toContain("user_id is null");
    expect(sql).toContain("status in ('active', 'honorary')");
  });

  it("prevents deactivation while a member still holds responsibilities", () => {
    expect(sql).toContain("before update of status on members");
    expect(sql).toContain("old.position is not null");
    expect(sql).toContain("exists (select 1 from committees where director_id = old.id)");
  });

  it("requires an assigned director to be included and eligible", () => {
    expect(sql).toContain("committee director must remain on roster");
    expect(sql).toContain("committee director must be active or honorary");
    expect(sql).toContain("where id = assigned_director_id and status in ('active', 'honorary')");
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

describe("member engagement migration", () => {
  const sql = migration("20260824010000_member_engagement.sql");

  it("keeps project management with the community-service leadership", () => {
    expect(sql).toContain("can_manage_committee('community-service')");
    expect(sql).toContain("member_id = current_member_id() and approved_at is null");
  });

  it("restricts targeted announcements to their intended audience", () => {
    expect(sql).toContain("create or replace function can_read_news_post");
    expect(sql).toContain("using (can_read_news_post(news_posts))");
    expect(sql).toContain("news_posts_notify_target");
  });

  it("keeps onboarding progress private to the member and club officers", () => {
    expect(sql).toContain("member_id = current_member_id() or runs_the_club()");
    expect(sql).toContain("with check (member_id = current_member_id())");
  });
});

describe("notice accountability migration", () => {
  const sql = migration("20260824160000_notice_accountability.sql");

  it("supports priority, pinning, expiry, and required acknowledgement", () => {
    expect(sql).toContain("priority in ('normal', 'important', 'urgent')");
    expect(sql).toContain("is_pinned boolean not null default false");
    expect(sql).toContain("requires_acknowledgement boolean not null default false");
    expect(sql).toContain("expires_at date");
  });

  it("lets members acknowledge only notices they are allowed to read", () => {
    expect(sql).toContain("member_id = current_member_id()");
    expect(sql).toContain("post.requires_acknowledgement");
    expect(sql).toContain("can_read_news_post(post)");
  });
});

describe("board notice acknowledgement visibility migration", () => {
  const sql = migration("20260824161000_board_notice_ack_visibility.sql");

  it("lets notice publishers audit acknowledgements without opening public access", () => {
    expect(sql).toContain("member_id = current_member_id() or is_board_member()");
    expect(sql).toContain("on news_acknowledgements for select to authenticated");
  });
});

describe("board chat moderation migration", () => {
  const sql = migration("20260824162000_board_chat_moderation.sql");

  it("lets board members moderate only conversations they can access", () => {
    expect(sql).toContain("sender_id = current_member_id() or is_board_member()");
    expect(sql.match(/can_access_chat_channel\(channel_id\)/g)).toHaveLength(2);
    expect(sql).toContain("on chat_messages for update to authenticated");
  });
});

describe("member deletion migration", () => {
  const sql = migration("20260825150000_member_deletion.sql");

  it("limits permanent roster removal to club leadership and prevents self-deletion", () => {
    expect(sql).toContain("on members for delete to authenticated");
    expect(sql).toContain("runs_the_club() and id <> current_member_id()");
  });
});

describe("event chat cleanup migration", () => {
  const sql = migration("20260825170000_stop_automatic_event_chats.sql");

  it("stops event creation from creating chat rooms and hides existing rooms", () => {
    expect(sql).toContain("drop trigger if exists events_create_chat on events");
    expect(sql).toContain("drop function if exists create_event_chat_channel()");
    expect(sql).toContain("where kind = 'event'");
    expect(sql).toContain("set archived_at = coalesce(archived_at, now())");
  });
});

describe("yearly committee chat archives", () => {
  const sql = migration("20260825180000_yearly_committee_chat_archives.sql");

  it("snapshots the old roster and makes archived rooms readable but not writable", () => {
    expect(sql).toContain("insert into chat_channel_members (channel_id, member_id)");
    expect(sql).toContain("snapshot.channel_id = c.id and snapshot.member_id = current_member_id()");
    expect(sql).toContain("c.archived_at is null");
    expect(sql).toContain("perform rollover_committee_chats()");
  });

  it("bounds the initial message payload per channel", () => {
    expect(sql).toContain("row_number() over (partition by m.channel_id order by m.created_at desc)");
    expect(sql).toContain("page_row <= greatest(1, least(per_channel_limit, 100))");
  });

  it("records the agreed retention periods", () => {
    expect(sql).toContain("('club', 36, now())");
    expect(sql).toContain("('committee', 84, now())");
    expect(sql).toContain("('project', 60, now())");
    expect(sql).toContain("('dm', 24, now())");
  });
});

describe("in-app notification system", () => {
  const sql = migration("20260826020000_notification_system.sql");

  it("keeps preferences private and applies them inside trusted producers", () => {
    expect(sql).toContain("notification_preferences_select");
    expect(sql).toContain("member_id = current_member_id()");
    expect(sql).toContain("notification_enabled(target_member_id uuid, notification_type text)");
    expect(sql).toContain("notification_enabled(recipient.id, 'chat')");
  });

  it("deduplicates delivery and covers core club activity", () => {
    expect(sql).toContain("notifications_recipient_dedupe_idx");
    expect(sql).toContain("events_notify_new");
    expect(sql).toContain("event_rsvps_notify_waitlist");
    expect(sql).toContain("service_projects_notify_open");
    expect(sql).toContain("project_volunteers_notify_owner");
  });

  it("publishes only the member-scoped inbox for realtime updates", () => {
    expect(sql).toContain("alter publication supabase_realtime add table notifications");
    expect(sql).not.toContain("alter publication supabase_realtime add table notification_preferences");
  });
});

describe("owned direct-chat deletion", () => {
  const sql = migration("20260826030000_delete_owned_direct_chats.sql");

  it("allows only the direct-chat creator to delete the conversation", () => {
    expect(sql).toContain("kind = 'dm'");
    expect(sql).toContain("created_by = current_member_id()");
    expect(sql).toContain("security definer");
    expect(sql).toContain("grant execute on function delete_owned_direct_chat(uuid) to authenticated");
  });
});
