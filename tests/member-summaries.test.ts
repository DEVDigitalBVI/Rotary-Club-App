import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rows: vi.fn(), rpc: vi.fn(), user: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({
  auth: { getUser: mocks.user },
  rpc: mocks.rpc,
  from: () => ({ select: () => ({
    order: () => ({ returns: mocks.rows }),
    eq: () => ({ maybeSingle: mocks.rows }),
  }) }),
}) }));

import { getMemberSummaries } from "../lib/data/members";

const member = { id: "member", name: "Club Member", classification: "Teacher", status: "active", avatar_color: "blue", avatar_url: null };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.rows.mockResolvedValue({ data: [member], error: null });
  mocks.rpc.mockResolvedValue({ data: false, error: null });
});

it("starts the visibility check while member names are still loading", async () => {
  let finish!: (value: { data: typeof member[]; error: null }) => void;
  mocks.rows.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const pending = getMemberSummaries();
  // createClient yields once before the independent database reads begin.
  await Promise.resolve();
  expect(mocks.rpc).toHaveBeenCalledWith("is_superuser");
  finish({ data: [member], error: null });
  const summaries = await pending;
  expect(summaries[0]).toMatchObject({ id: member.id, name: member.name, classification: "Teacher", email: "", phone: "" });
  expect(mocks.user).not.toHaveBeenCalled();
  expect(mocks.rpc).toHaveBeenCalledTimes(1);
});

it("does not return a roster when the visibility check fails", async () => {
  mocks.rpc.mockResolvedValue({ data: null, error: { message: "unavailable" } });
  await expect(getMemberSummaries()).rejects.toThrow("Unable to apply member visibility");
});

it("continues hiding a superuser's own profile from member pickers", async () => {
  mocks.user.mockResolvedValue({ data: { user: { id: "auth-id" } }, error: null });
  mocks.rpc.mockImplementation(async (name: string) => ({
    data: name === "is_superuser" ? true : name === "current_member_id" ? "superuser" : null,
    error: null,
  }));
  mocks.rows.mockResolvedValueOnce({ data: [member, { ...member, id: "superuser" }], error: null })
    .mockResolvedValueOnce({ data: { ...member, id: "superuser" }, error: null });
  expect((await getMemberSummaries()).map(row => row.id)).toEqual(["member"]);
});
